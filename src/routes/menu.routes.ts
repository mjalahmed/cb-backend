import express, { type Request, type Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index.js';
import logger from '../utils/logger.js';

const router = express.Router();

// POST /api/v1/menu/products
router.post('/products',
  [
    body('categoryId').optional().isUUID().withMessage('Invalid category ID')
  ],
  async (req: Request<{}, {}, { categoryId?: string }>, res: Response) => {
    const { categoryId } = req.body;
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

      const products = await prisma.product.findMany({
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
        }
      });

      logger.debug('Products retrieved', {
        categoryId,
        count: products.length
      });
      res.json({ products });
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
