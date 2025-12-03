import express, { type Request, type Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index.js';
import { sendOTP } from '../services/twilio.service.js';
import { verifyOTP } from '../utils/otp.util.js';
import { generateToken } from '../utils/jwt.util.js';
import { hashPassword, comparePassword, validateStrongPassword } from '../utils/password.util.js';
import type { RegisterRequest, LoginRequest, SendOTPRequest, VerifyPhoneRequest } from '../types/index.js';
import logger from '../utils/logger.js';

const router = express.Router();

// POST /api/v1/auth/register
router.post('/register',
  [
    body('username')
      .notEmpty()
      .withMessage('Username is required')
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    body('phoneNumber')
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Invalid phone number format')
  ],
  async (req: Request<{}, {}, RegisterRequest>, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { username, email, password, phoneNumber } = req.body;

      // Validate strong password
      const passwordValidation = validateStrongPassword(password);
      if (!passwordValidation.valid) {
        res.status(400).json({ error: passwordValidation.error });
        return;
      }

      // Normalize username and email to lowercase for case-insensitive comparison
      const normalizedUsername = username.toLowerCase();
      const normalizedEmail = email ? email.toLowerCase() : null;

      // Check if username, email, or phone number already exists
      // Since we store in lowercase, we can query directly
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: normalizedUsername },
            ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
            { phoneNumber }
          ]
        }
      });

      if (existingUser) {
        if (existingUser.username.toLowerCase() === normalizedUsername) {
          res.status(400).json({ error: 'Username already taken' });
          return;
        }
        if (normalizedEmail && existingUser.email?.toLowerCase() === normalizedEmail) {
          res.status(400).json({ error: 'Email already registered' });
          return;
        }
        if (existingUser.phoneNumber === phoneNumber) {
          res.status(400).json({ error: 'Phone number already registered' });
          return;
        }
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user (phone not verified yet)
      // Store username and email in lowercase for consistency
      const user = await prisma.user.create({
        data: {
          username: normalizedUsername,
          email: normalizedEmail,
          password: hashedPassword,
          phoneNumber,
          phoneVerified: false,
          role: 'CUSTOMER'
        }
      });

      // Send OTP for phone verification
      await sendOTP(phoneNumber);

      logger.info('User registered successfully', {
        userId: user.id,
        username: user.username,
        phoneNumber: user.phoneNumber
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully. Please verify your phone number.',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phoneNumber: user.phoneNumber,
          phoneVerified: user.phoneVerified,
          role: user.role
        }
      });
    } catch (error) {
      logger.error('Register error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      const errorMessage = error instanceof Error ? error.message : 'Failed to register user';
      res.status(500).json({ error: errorMessage });
    }
  }
);

// POST /api/v1/auth/login
router.post('/login',
  [
    body('username')
      .notEmpty()
      .withMessage('Username is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  async (req: Request<{}, {}, LoginRequest>, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { username, password } = req.body;

      // Normalize username/email to lowercase for case-insensitive lookup
      const normalizedUsername = username.toLowerCase();

      // Find user by username or email (stored in lowercase)
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { username: normalizedUsername },
            { email: normalizedUsername }
          ]
        }
      });

      if (!user) {
        res.status(401).json({ error: 'Invalid username or password' });
        return;
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({ error: 'Invalid username or password' });
        return;
      }

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        username: user.username,
        role: user.role
      });

      logger.info('User logged in successfully', {
        userId: user.id,
        username: user.username,
        role: user.role
      });

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phoneNumber: user.phoneNumber,
          phoneVerified: user.phoneVerified,
          role: user.role
        }
      });
    } catch (error) {
      logger.error('Login error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      const errorMessage = error instanceof Error ? error.message : 'Failed to login';
      res.status(500).json({ error: errorMessage });
    }
  }
);

// POST /api/v1/auth/send-otp
router.post('/send-otp',
  [
    body('phoneNumber')
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Invalid phone number format')
  ],
  async (req: Request<{}, {}, SendOTPRequest>, res: Response) => {
    const { phoneNumber } = req.body;
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      // Verify phone number belongs to a user
      const user = await prisma.user.findUnique({
        where: { phoneNumber }
      });

      if (!user) {
        res.status(404).json({ error: 'Phone number not found' });
        return;
      }

      // Send OTP via Twilio
      await sendOTP(phoneNumber);

      logger.info('OTP sent successfully', { phoneNumber });

      res.json({
        success: true,
        message: 'OTP sent successfully'
      });
    } catch (error) {
      logger.error('Send OTP error', {
        phoneNumber,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      const errorMessage = error instanceof Error ? error.message : 'Failed to send OTP';
      res.status(500).json({ error: errorMessage });
    }
  }
);

// POST /api/v1/auth/verify-phone
router.post('/verify-phone',
  [
    body('phoneNumber')
      .notEmpty()
      .withMessage('Phone number is required'),
    body('otp')
      .notEmpty()
      .withMessage('OTP is required')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits')
  ],
  async (req: Request<{}, {}, VerifyPhoneRequest>, res: Response) => {
    const { phoneNumber, otp } = req.body;
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      // Verify OTP
      const verification = verifyOTP(phoneNumber, otp);
      if (!verification.valid) {
        res.status(400).json({ error: verification.error });
        return;
      }

      // Find user and update phone verification status
      const user = await prisma.user.findUnique({
        where: { phoneNumber }
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Update phone verification status
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { phoneVerified: true }
      });

      logger.info('Phone number verified successfully', {
        userId: updatedUser.id,
        phoneNumber: updatedUser.phoneNumber
      });

      res.json({
        success: true,
        message: 'Phone number verified successfully',
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          phoneNumber: updatedUser.phoneNumber,
          phoneVerified: updatedUser.phoneVerified,
          role: updatedUser.role
        }
      });
    } catch (error) {
      logger.error('Verify phone error', {
        phoneNumber,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify phone number';
      res.status(500).json({ error: errorMessage });
    }
  }
);

export default router;
