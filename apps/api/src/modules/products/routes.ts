import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import { createProductRepository } from './repository.js';
import { createProductService } from './service.js';
import { createProductController } from './controller.js';
export function productRoutes(db: PrismaClient) {
  const routes = Router();
  const controller = createProductController(createProductService(createProductRepository(db)));
  routes.get('/', controller.list);
  routes.get('/:slug', controller.detail);
  return routes;
}
