import express, { type Request, type Response } from 'express';
import { param, query, body, validationResult } from 'express-validator';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware.js';
import { prisma } from '../../index.js';
import type { UpdateOrderStatusRequest } from '../../types/index.js';
import { OrderStatus, Prisma } from '@prisma/client';

const router = express.Router();

// Apply authentication and admin check to all routes
router.use(authenticate);
router.use(requireAdmin);

// GET /api/v1/admin/orders
router.get('/',
  [
    query('status').optional().isIn(['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'])
  ],
  async (req: Request, res: Response) => {
    try {
      const { status } = req.query;

      const where: Prisma.OrderWhereInput = {};
      if (status && typeof status === 'string') {
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

      res.json({ orders });
    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({ error: 'Failed to retrieve orders' });
    }
  }
);

// PATCH /api/v1/admin/orders/:id/status
router.patch('/:id/status',
  [
    param('id').isUUID().withMessage('Invalid order ID'),
    body('status')
      .isIn(['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'])
      .withMessage('Invalid order status')
  ],
  async (req: Request<{ id: string }, {}, UpdateOrderStatusRequest>, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { id } = req.params;
      const { status } = req.body;

      const order = await prisma.order.update({
        where: { id },
        data: { status: status as OrderStatus },
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

      res.json({ order });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        res.status(404).json({ error: 'Order not found' });
        return;
      }
      console.error('Update order status error:', error);
      res.status(500).json({ error: 'Failed to update order status' });
    }
  }
);

export default router;

