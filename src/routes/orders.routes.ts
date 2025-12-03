import express, { type Request, type Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware.js';
import { prisma } from '../index.js';
import type { CreateOrderRequest } from '../types/index.js';
import { OrderType, OrderStatus } from '@prisma/client';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// POST /api/v1/orders
router.post('/',
  [
    body('items').isArray({ min: 1 }).withMessage('Order must have at least one item'),
    body('items.*.productId').isUUID().withMessage('Invalid product ID'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('orderType').isIn(['DELIVERY', 'PICKUP']).withMessage('Order type must be DELIVERY or PICKUP'),
    body('scheduledTime').optional().isISO8601().withMessage('Invalid scheduled time format'),
    body('paymentMethod').isIn(['CASH', 'CARD']).withMessage('Payment method must be CASH or CARD')
  ],
  async (req: Request<{}, {}, CreateOrderRequest>, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { items, orderType, scheduledTime, paymentMethod } = req.body;
      const userId = req.user.userId;

      // Validate all products exist and are available
      const productIds = items.map(item => item.productId);
      const products = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          isAvailable: true
        }
      });

      if (products.length !== productIds.length) {
        res.status(400).json({ error: 'One or more products are invalid or unavailable' });
        return;
      }

      // Calculate total amount
      let totalAmount = 0;
      const orderItemsData = items.map(item => {
        const product = products.find(p => p.id === item.productId);
        if (!product) {
          throw new Error('Product not found');
        }
        const itemTotal = Number(product.price) * item.quantity;
        totalAmount += itemTotal;

        return {
          productId: item.productId,
          quantity: item.quantity,
          priceAtOrder: product.price
        };
      });

      // Create order with items in a transaction
      const order = await prisma.$transaction(async (tx) => {
        const newOrder = await tx.order.create({
          data: {
            userId,
            totalAmount,
            orderType: orderType as OrderType,
            scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
            status: 'PENDING' as OrderStatus,
            orderItems: {
              create: orderItemsData
            }
          },
          include: {
            orderItems: {
              include: {
                product: true
              }
            }
          }
        });

        // If payment method is CARD, create pending payment record
        if (paymentMethod === 'CARD') {
          await tx.payment.create({
            data: {
              orderId: newOrder.id,
              amount: totalAmount,
              status: 'PENDING'
            }
          });
        }

        return newOrder;
      });

      res.status(201).json({ order });
    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({ error: 'Failed to create order' });
    }
  }
);

// POST /api/v1/orders/my
router.post('/my', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userId = req.user.userId;

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true
              }
            }
          }
        },
        payment: {
          select: {
            id: true,
            status: true,
            transactionId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to retrieve orders' });
  }
});

export default router;
