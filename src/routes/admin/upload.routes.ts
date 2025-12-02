import express, { type Request, type Response } from 'express';
import multer, { type FileFilterCallback } from 'multer';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware.js';
import { uploadImage } from '../../services/supabase.service.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Extend Request type to include file
interface UploadRequest extends Request {
  file?: Express.Multer.File;
}

// POST /api/v1/admin/upload/image
router.post('/image',
  authenticate,
  requireAdmin,
  upload.single('image'),
  async (req: UploadRequest, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No image file provided' });
        return;
      }

      const fileName = (req.body as { fileName?: string }).fileName || req.file.originalname;
      const folder = (req.body as { folder?: string }).folder || 'products';

      const result = await uploadImage(req.file.buffer, fileName, folder);

      if (!result.success) {
        res.status(500).json({ error: result.error || 'Failed to upload image' });
        return;
      }

      res.json({
        success: true,
        url: result.url,
        message: 'Image uploaded successfully'
      });
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
      res.status(500).json({ error: errorMessage });
    }
  }
);

export default router;

