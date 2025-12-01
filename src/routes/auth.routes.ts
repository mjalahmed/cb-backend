import express, { type Request, type Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index.js';
import { sendOTP } from '../services/twilio.service.js';
import { verifyOTP } from '../utils/otp.util.js';
import { generateToken } from '../utils/jwt.util.js';
import { hashPassword, comparePassword } from '../utils/password.util.js';
import type { RegisterRequest, LoginRequest, SendOTPRequest, VerifyPhoneRequest } from '../types/index.js';

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
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
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

      // Check if username already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username },
            ...(email ? [{ email }] : []),
            { phoneNumber }
          ]
        }
      });

      if (existingUser) {
        if (existingUser.username === username) {
          res.status(400).json({ error: 'Username already taken' });
          return;
        }
        if (email && existingUser.email === email) {
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
      const user = await prisma.user.create({
        data: {
          username,
          email: email || null,
          password: hashedPassword,
          phoneNumber,
          phoneVerified: false,
          role: 'CUSTOMER'
        }
      });

      // Send OTP for phone verification
      await sendOTP(phoneNumber);

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
      console.error('Register error:', error);
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

      // Find user by username
      const user = await prisma.user.findUnique({
        where: { username }
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
      console.error('Login error:', error);
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
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { phoneNumber } = req.body;

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

      res.json({
        success: true,
        message: 'OTP sent successfully'
      });
    } catch (error) {
      console.error('Send OTP error:', error);
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
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { phoneNumber, otp } = req.body;

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
      console.error('Verify phone error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify phone number';
      res.status(500).json({ error: errorMessage });
    }
  }
);

export default router;
