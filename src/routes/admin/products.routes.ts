import express, { type Request, type Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware.js';
import { prisma } from '../../index.js';
import type { CreateProductRequest, UpdateProductRequest } from '../../types/index.js';
import { Prisma } from '@prisma/client';

const router = express.Router();

// Apply authentication and admin check to all routes
router.use(authenticate);
router.use(requireAdmin);

// POST /api/v1/admin/products
router.post('/',
  [
    body('name').notEmpty().withMessage('Product name is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('categoryId').isUUID().withMessage('Valid category ID is required'),
    body('description').optional().isString(),
    body('imageUrl').optional().isURL().withMessage('Invalid image URL'),
    body('isAvailable').optional().isBoolean()
  ],
  async (req: Request<{}, {}, CreateProductRequest>, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { name, description, price, imageUrl, categoryId, isAvailable = true } = req.body;

      // Verify category exists
      const category = await prisma.category.findUnique({
        where: { id: categoryId }
      });

      if (!category) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }

      const product = await prisma.product.create({
        data: {
          name,
          description,
          price,
          imageUrl,
          categoryId,
          isAvailable
        },
        include: {
          category: true
        }
      });

      res.status(201).json({ product });
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  }
);

// PATCH /api/v1/admin/products/:id
router.patch('/:id',
  [
    param('id').isUUID().withMessage('Invalid product ID'),
    body('name').optional().notEmpty(),
    body('description').optional().isString(),
    body('price').optional().isFloat({ min: 0 }),
    body('imageUrl').optional().isURL(),
    body('isAvailable').optional().isBoolean(),
    body('categoryId').optional().isUUID()
  ],
  async (req: Request<{ id: string }, {}, UpdateProductRequest>, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { id } = req.params;
      const updateData: Prisma.ProductUpdateInput = {};

      // Build update object with only provided fields
      if (req.body.name !== undefined) updateData.name = req.body.name;
      if (req.body.description !== undefined) updateData.description = req.body.description;
      if (req.body.price !== undefined) updateData.price = req.body.price;
      if (req.body.imageUrl !== undefined) updateData.imageUrl = req.body.imageUrl;
      if (req.body.isAvailable !== undefined) updateData.isAvailable = req.body.isAvailable;
      if (req.body.categoryId !== undefined) {
        // Verify category exists
        const category = await prisma.category.findUnique({
          where: { id: req.body.categoryId }
        });
        if (!category) {
          res.status(404).json({ error: 'Category not found' });
          return;
        }
        updateData.category = { connect: { id: req.body.categoryId } };
      }

      const product = await prisma.product.update({
        where: { id },
        data: updateData,
        include: {
          category: true
        }
      });

      res.json({ product });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      console.error('Update product error:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  }
);

export default router;

