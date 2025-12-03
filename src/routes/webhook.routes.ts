import express, { type Request, type Response } from 'express';
import { prisma } from '../index.js';
import Stripe from 'stripe';
import logger from '../utils/logger.js';

const router = express.Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia'
});

// POST /api/v1/payments/webhook
// This route must use raw body parser (handled in index.ts)
router.post('/', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.warn('Stripe webhook secret not configured');
    res.status(400).json({ error: 'Webhook secret not configured' });
    return;
  }

  let event: Stripe.Event;

  try {
    if (typeof sig !== 'string') {
      throw new Error('Missing stripe-signature header');
    }
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Webhook signature verification failed', {
      error: errorMessage,
      stack: err instanceof Error ? err.stack : undefined
    });
    res.status(400).send(`Webhook Error: ${errorMessage}`);
    return;
  }

  // Handle the event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata?.orderId;

    if (orderId) {
      try {
        await prisma.payment.update({
          where: { orderId },
          data: {
            status: 'SUCCESS',
            transactionId: paymentIntent.id
          }
        });

        logger.info('Payment succeeded', {
          orderId,
          transactionId: paymentIntent.id
        });
      } catch (error) {
        logger.error('Error updating payment status', {
          orderId,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    }
  } else if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata?.orderId;

    if (orderId) {
      try {
        await prisma.payment.update({
          where: { orderId },
          data: {
            status: 'FAILED',
            transactionId: paymentIntent.id
          }
        });

        logger.warn('Payment failed', {
          orderId,
          transactionId: paymentIntent.id
        });
      } catch (error) {
        logger.error('Error updating payment status', {
          orderId,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    }
  }

  res.json({ received: true });
});

export default router;

