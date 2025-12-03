import express, { type Request, type Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware.js';
import { prisma } from '../../index.js';
import { Prisma } from '@prisma/client';

const router = express.Router();

// Apply authentication and admin check to all routes
router.use(authenticate);
router.use(requireAdmin);

// POST /api/v1/admin/categories
router.post('/',
  async (_req: Request, res: Response) => {
    try {
      const categories = await prisma.category.findMany({
        include: {
          _count: {
            select: {
              products: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.json({ categories });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ error: 'Failed to retrieve categories' });
    }
  }
);

// POST /api/v1/admin/categories/get
router.post('/get',
  [
    body('id').isUUID().withMessage('Invalid category ID')
  ],
  async (req: Request<{}, {}, { id: string }>, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { id } = req.body;

      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          products: {
            select: {
              id: true,
              name: true,
              price: true,
              isAvailable: true,
              imageUrl: true
            }
          },
          _count: {
            select: {
              products: true
            }
          }
        }
      });

      if (!category) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }

      res.json({ category });
    } catch (error) {
      console.error('Get category error:', error);
      res.status(500).json({ error: 'Failed to retrieve category' });
    }
  }
);

// POST /api/v1/admin/categories/create
router.post('/create',
  [
    body('name').notEmpty().withMessage('Category name is required'),
    body('description').optional().isString()
  ],
  async (req: Request<{}, {}, { name: string; description?: string }>, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { name, description } = req.body;

      // Check if category with same name already exists
      const existing = await prisma.category.findFirst({
        where: { name }
      });

      if (existing) {
        res.status(400).json({ error: 'Category with this name already exists' });
        return;
      }

      const category = await prisma.category.create({
        data: {
          name,
          description: description || null
        }
      });

      res.status(201).json({ category });
    } catch (error) {
      console.error('Create category error:', error);
      res.status(500).json({ error: 'Failed to create category' });
    }
  }
);

// POST /api/v1/admin/categories/update
router.post('/update',
  [
    body('id').isUUID().withMessage('Invalid category ID'),
    body('name').optional().notEmpty(),
    body('description').optional().isString()
  ],
  async (req: Request<{}, {}, { id: string; name?: string; description?: string }>, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { id, name, description } = req.body;
      const updateData: Prisma.CategoryUpdateInput = {};

      // Build update object with only provided fields
      if (name !== undefined) {
        // Check if another category with this name exists
        const existing = await prisma.category.findFirst({
          where: {
            name,
            NOT: { id }
          }
        });

        if (existing) {
          res.status(400).json({ error: 'Category with this name already exists' });
          return;
        }

        updateData.name = name;
      }
      if (description !== undefined) {
        updateData.description = description;
      }

      const category = await prisma.category.update({
        where: { id },
        data: updateData
      });

      res.json({ category });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        res.status(404).json({ error: 'Category not found' });
        return;
      }
      console.error('Update category error:', error);
      res.status(500).json({ error: 'Failed to update category' });
    }
  }
);

// POST /api/v1/admin/categories/delete
router.post('/delete',
  [
    body('id').isUUID().withMessage('Invalid category ID')
  ],
  async (req: Request<{}, {}, { id: string }>, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { id } = req.body;

      // Check if category has products
      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              products: true
            }
          }
        }
      });

      if (!category) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }

      if (category._count.products > 0) {
        res.status(400).json({ 
          error: 'Cannot delete category with existing products. Please remove or reassign products first.' 
        });
        return;
      }

      await prisma.category.delete({
        where: { id }
      });

      res.json({ 
        success: true,
        message: 'Category deleted successfully' 
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        res.status(404).json({ error: 'Category not found' });
        return;
      }
      console.error('Delete category error:', error);
      res.status(500).json({ error: 'Failed to delete category' });
    }
  }
);

export default router;
