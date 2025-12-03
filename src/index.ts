import express, { type Request, type Response, type NextFunction, type ErrorRequestHandler } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import logger from './utils/logger.js';
import { requestLogger, errorLogger } from './middleware/logger.middleware.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import menuRoutes from './routes/menu.routes.js';
import adminProductRoutes from './routes/admin/products.routes.js';
import adminCategoryRoutes from './routes/admin/categories.routes.js';
import adminUploadRoutes from './routes/admin/upload.routes.js';
import orderRoutes from './routes/orders.routes.js';
import adminOrderRoutes from './routes/admin/orders.routes.js';
import paymentRoutes from './routes/payments.routes.js';
import webhookRoutes from './routes/webhook.routes.js';

// Load environment variables
dotenv.config();

// Initialize logger
logger.info('🚀 Starting Chocobar Backend API...');

// Initialize Prisma Client
export const prisma = new PrismaClient();

// Initialize Express app
const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature']
}));

// Request logging middleware (before other middleware)
app.use(requestLogger);

// Stripe webhook needs raw body, so mount it before JSON parser
app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json' }), webhookRoutes);

// JSON parser for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Chocobar API is running' });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/menu', menuRoutes);
app.use('/api/v1/admin/products', adminProductRoutes);
app.use('/api/v1/admin/categories', adminCategoryRoutes);
app.use('/api/v1/admin/upload', adminUploadRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/admin/orders', adminOrderRoutes);
app.use('/api/v1/payments', paymentRoutes);
// Note: webhook route is mounted above with raw body parser

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error logging middleware (before error handler)
app.use(errorLogger);

// Error handler
const errorHandler: ErrorRequestHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  const status = (err as any).status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Chocobar API server running on port ${PORT}`);
  logger.info(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🌐 Base URL: http://localhost:${PORT}`);
  logger.info(`📚 API Documentation: http://localhost:${PORT}/health`);
});

// Graceful shutdown
const shutdown = async (): Promise<void> => {
  logger.info('🛑 Shutting down server...');
  await prisma.$disconnect();
  logger.info('✅ Server shut down gracefully');
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Promise Rejection', { error: reason });
  throw reason;
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

