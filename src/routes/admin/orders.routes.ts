import express, { type Request, type Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware.js';
import { prisma } from '../../index.js';
import { OrderStatus, Prisma } from '@prisma/client';
import logger from '../../utils/logger.js';

const router = express.Router();

// Apply authentication and admin check to all routes
router.use(authenticate);
router.use(requireAdmin);

// POST /api/v1/admin/orders
router.post('/',
  [
    body('status').optional().isIn(['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'])
  ],
  async (req: Request<{}, {}, { status?: string }>, res: Response) => {
    const { status } = req.body;
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const where: Prisma.OrderWhereInput = {};
      if (status) {
        where.status = status as OrderStatus;
      }

      const orders = await prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              phoneNumber: true
            }
          },
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

      logger.debug('Admin orders retrieved', {
        status,
        count: orders.length
      });
      res.json({ orders });
    } catch (error) {
      logger.error('Get orders error', {
        status,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({ error: 'Failed to retrieve orders' });
    }
  }
);

// POST /api/v1/admin/orders/status
router.post('/status',
  [
    body('id').isUUID().withMessage('Invalid order ID'),
    body('status')
      .isIn(['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'])
      .withMessage('Invalid order status')
  ],
  async (req: Request<{}, {}, { id: string; status: OrderStatus }>, res: Response) => {
    const { id, status } = req.body;
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const order = await prisma.order.update({
        where: { id },
        data: { status },
        include: {
          user: {
            select: {
              id: true,
              phoneNumber: true
            }
          },
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
        }
      });

      logger.info('Order status updated', {
        orderId: id,
        newStatus: status,
        userId: order.userId
      });

      res.json({ order });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        res.status(404).json({ error: 'Order not found' });
        return;
      }
      logger.error('Update order status error', {
        orderId: id,
        status,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({ error: 'Failed to update order status' });
    }
  }
);

export default router;
