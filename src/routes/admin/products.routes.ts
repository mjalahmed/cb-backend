import express, { type Request, type Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware.js';
import { prisma } from '../../index.js';
import type { CreateProductRequest, UpdateProductRequest } from '../../types/index.js';
import { Prisma } from '@prisma/client';
import logger from '../../utils/logger.js';

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
    const { name, description, price, imageUrl, categoryId, isAvailable = true } = req.body;
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

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

      logger.info('Product created', {
        productId: product.id,
        name: product.name,
        price: product.price.toString(),
        categoryId
      });

      res.status(201).json({ product });
    } catch (error) {
      logger.error('Create product error', {
        name,
        categoryId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({ error: 'Failed to create product' });
    }
  }
);

// POST /api/v1/admin/products/update
router.post('/update',
  [
    body('id').isUUID().withMessage('Invalid product ID'),
    body('name').optional().notEmpty(),
    body('description').optional().isString(),
    body('price').optional().isFloat({ min: 0 }),
    body('imageUrl').optional().isURL(),
    body('isAvailable').optional().isBoolean(),
    body('categoryId').optional().isUUID()
  ],
  async (req: Request<{}, {}, UpdateProductRequest & { id: string }>, res: Response) => {
    const { id, ...updateFields } = req.body;
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      const updateData: Prisma.ProductUpdateInput = {};

      // Build update object with only provided fields
      if (updateFields.name !== undefined) updateData.name = updateFields.name;
      if (updateFields.description !== undefined) updateData.description = updateFields.description;
      if (updateFields.price !== undefined) updateData.price = updateFields.price;
      if (updateFields.imageUrl !== undefined) updateData.imageUrl = updateFields.imageUrl;
      if (updateFields.isAvailable !== undefined) updateData.isAvailable = updateFields.isAvailable;
      if (updateFields.categoryId !== undefined) {
        // Verify category exists
        const category = await prisma.category.findUnique({
          where: { id: updateFields.categoryId }
        });
        if (!category) {
          res.status(404).json({ error: 'Category not found' });
          return;
        }
        updateData.category = { connect: { id: updateFields.categoryId } };
      }

      const product = await prisma.product.update({
        where: { id },
        data: updateData,
        include: {
          category: true
        }
      });

      logger.info('Product updated', {
        productId: id,
        updates: updateFields
      });

      res.json({ product });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      logger.error('Update product error', {
        productId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({ error: 'Failed to update product' });
    }
  }
);

export default router;
