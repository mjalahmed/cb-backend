import express, { type Request, type Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index.js';
import { sendOTP } from '../services/twilio.service.js';
import { verifyOTP } from '../utils/otp.util.js';
import { generateToken } from '../utils/jwt.util.js';
import type { SendOTPRequest, VerifyOTPRequest } from '../types/index.js';

const router = express.Router();

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

// POST /api/v1/auth/verify-otp
router.post('/verify-otp',
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
  async (req: Request<{}, {}, VerifyOTPRequest>, res: Response) => {
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

      // Find or create user
      let user = await prisma.user.findUnique({
        where: { phoneNumber }
      });

      if (!user) {
        user = await prisma.user.create({
          data: { phoneNumber, role: 'CUSTOMER' }
        });
      }

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        phoneNumber: user.phoneNumber,
        role: user.role
      });

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          phoneNumber: user.phoneNumber,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Verify OTP error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify OTP';
      res.status(500).json({ error: errorMessage });
    }
  }
);

export default router;

