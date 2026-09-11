import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import type { PrismaClient } from '@prisma/client';
import { productRoutes } from './modules/products/routes.js';
import { categoryRoutes } from './modules/categories/routes.js';
import { errorHandler, HttpError } from './errors.js';
import { authentication, csrf, requireAdmin } from './modules/auth/security.js';
import { uploadImage, uploadDirectory } from './modules/admin/upload.js';
import { authRoutes } from './modules/auth/routes.js';
import { cartRoutes } from './modules/cart/routes.js';
import { orderRoutes } from './modules/orders/routes.js';
import { adminRoutes } from './modules/admin/routes.js';
import { shopSettings, type ShopSettings } from './modules/orders/validation.js';

export function createApp(db: PrismaClient, webOrigin = 'http://localhost:3000', settings: ShopSettings = shopSettings()) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: webOrigin, credentials: true, methods: ['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE'], allowedHeaders: ['Content-Type', 'X-Requested-With', 'Idempotency-Key', 'X-Expected-Total'] }));
  app.use('/api/v1', csrf(webOrigin));
  app.use(express.json({ limit: '100kb' }));
  app.get('/api/v1/settings', (_req, res) => res.json({ data: settings }));
  app.use(['/api/v1/auth', '/api/v1/cart', '/api/v1/orders', '/api/v1/admin'], authentication(db));
  app.post('/api/v1/admin/upload', requireAdmin, express.raw({ type: ['image/jpeg','image/png','image/webp'], limit: '5mb' }), uploadImage(db));
  app.use('/api/v1/media', express.static(uploadDirectory, { dotfiles: 'deny', fallthrough: false, index: false }));
  app.use('/api/v1/auth', authRoutes(db));
  app.use('/api/v1/cart', cartRoutes(db));
  app.use('/api/v1/orders', orderRoutes(db, settings));
  app.use('/api/v1/admin', adminRoutes(db, settings));
  app.get('/api/v1/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/v1/products', productRoutes(db));
  app.use('/api/v1/categories', categoryRoutes(db));
  app.get('/api/v1/home', async (_req, res) => {
    const [banners, collections] = await db.$transaction([
      db.banner.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }], take: 3 }),
      db.collection.findMany({ orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], take: 6 }),
    ]);
    res.json({ data: { banners, collections } });
  });
  app.use((_req, _res, next) => next(new HttpError(404, 'NOT_FOUND', 'Đường dẫn không tồn tại.')));
  app.use(errorHandler);
  return app;
}

