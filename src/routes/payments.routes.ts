import express, { type Request, type Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware.js';
import { prisma } from '../index.js';
import Stripe from 'stripe';
import type { CreatePaymentIntentRequest } from '../types/index.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia'
});

// POST /api/v1/payments/intent
router.post('/intent',
  authenticate,
  [
    body('orderId').isUUID().withMessage('Valid order ID is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number')
  ],
  async (req: Request<{}, {}, CreatePaymentIntentRequest>, res: Response) => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userId = req.user.userId;
    const { orderId, amount } = req.body;
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      // Verify order exists and belongs to user
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { payment: true }
      });

      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      if (order.userId !== userId) {
        res.status(403).json({ error: 'Unauthorized access to this order' });
        return;
      }

      if (order.payment && order.payment.status === 'SUCCESS') {
        res.status(400).json({ error: 'Order already paid' });
        return;
      }

      // Convert amount to cents for Stripe
      const amountInCents = Math.round(Number(amount) * 100);

      if (!process.env.STRIPE_SECRET_KEY) {
        // Development mode - return mock payment intent
        res.json({
          clientSecret: 'mock_client_secret_' + orderId,
          amount: amount,
          orderId: orderId
        });
        return;
      }

      // Create Stripe Payment Intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        metadata: {
          orderId: orderId,
          userId: userId
        }
      });

      // Update or create payment record
      await prisma.payment.upsert({
        where: { orderId },
        update: {
          transactionId: paymentIntent.id,
          amount: amount,
          status: 'PENDING'
        },
        create: {
          orderId,
          transactionId: paymentIntent.id,
          amount: amount,
          status: 'PENDING'
        }
      });

      logger.info('Payment intent created', {
        orderId,
        amount,
        transactionId: paymentIntent.id
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        amount: amount,
        orderId: orderId
      });
    } catch (error) {
      logger.error('Create payment intent error', {
        orderId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({ error: 'Failed to create payment intent' });
    }
  }
);

export default router;

