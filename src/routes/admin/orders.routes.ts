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
    body('status').optional().isIn(['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED']),
    body('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    body('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    body('sortBy').optional().isIn(['date', 'status', 'amount']).withMessage('sortBy must be date, status, or amount')
  ],
  async (req: Request<{}, {}, { status?: string; page?: number; limit?: number; sortBy?: string }>, res: Response) => {
    const { status, page = 1, limit = 20, sortBy = 'date' } = req.body;
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

      // Calculate pagination
      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      // Determine sort order
      let orderBy: any = { createdAt: 'desc' };
      if (sortBy === 'date') {
        orderBy = { createdAt: 'desc' };
      } else if (sortBy === 'status') {
        orderBy = { status: 'asc' };
      } else if (sortBy === 'amount') {
        orderBy = { totalAmount: 'desc' };
      }

      const [orders, totalCount] = await Promise.all([
        prisma.order.findMany({
          where,
          select: {
            id: true,
            userId: true,
            totalAmount: true,
            status: true, // Explicitly include status
            orderType: true,
            scheduledTime: true,
            createdAt: true, // Explicitly include date
            updatedAt: true,
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
          orderBy,
          skip,
          take
        }),
        prisma.order.count({ where })
      ]);

      logger.debug('Admin orders retrieved', {
        status,
        count: orders.length,
        page,
        limit,
        sortBy,
        totalCount
      });
      res.json({
        orders,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          totalCount,
          totalPages: Math.ceil(totalCount / Number(limit))
        }
      });
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
