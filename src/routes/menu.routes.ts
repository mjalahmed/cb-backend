import express, { type Request, type Response } from 'express';
import { query, validationResult } from 'express-validator';
import { prisma } from '../index.js';

const router = express.Router();

// GET /api/v1/menu/products
router.get('/products',
  [
    query('category_id').optional().isUUID().withMessage('Invalid category ID')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { category_id } = req.query;

      const where: {
        isAvailable: boolean;
        categoryId?: string;
      } = {
        isAvailable: true
      };

      if (category_id && typeof category_id === 'string') {
        where.categoryId = category_id;
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

      res.json({ products });
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({ error: 'Failed to retrieve products' });
    }
  }
);

export default router;

