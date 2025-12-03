import express, { type Request, type Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index.js';
import logger from '../utils/logger.js';

const router = express.Router();

// POST /api/v1/menu/products
router.post('/products',
  [
    body('categoryId').optional().isUUID().withMessage('Invalid category ID'),
    body('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    body('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  async (req: Request<{}, {}, { categoryId?: string; page?: number; limit?: number }>, res: Response) => {
    const { categoryId, page = 1, limit = 20 } = req.body;
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const where: {
        isAvailable: boolean;
        categoryId?: string;
      } = {
        isAvailable: true
      };

      if (categoryId) {
        where.categoryId = categoryId;
      }

      // Calculate pagination
      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      const [products, totalCount] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take
        }),
        prisma.product.count({ where })
      ]);

      logger.debug('Products retrieved', {
        categoryId,
        count: products.length,
        page,
        limit,
        totalCount
      });
      res.json({
        products,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          totalCount,
          totalPages: Math.ceil(totalCount / Number(limit))
        }
      });
    } catch (error) {
      logger.error('Get products error', {
        categoryId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({ error: 'Failed to retrieve products' });
    }
  }
);

export default router;
