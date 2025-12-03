import express, { type Request, type Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index.js';

const router = express.Router();

// POST /api/v1/menu/products
router.post('/products',
  [
    body('categoryId').optional().isUUID().withMessage('Invalid category ID')
  ],
  async (req: Request<{}, {}, { categoryId?: string }>, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { categoryId } = req.body;

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

      res.json({ products });
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({ error: 'Failed to retrieve products' });
    }
  }
);

export default router;
