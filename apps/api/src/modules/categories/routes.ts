import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import { pageQuery } from '../products/validation.js';

export function categoryRoutes(db: PrismaClient) {
  const routes = Router();
  routes.get('/', async (req, res) => {
    const { page, limit } = pageQuery.parse(req.query);
    const [data, total] = await db.$transaction([
      db.category.findMany({ orderBy: [{ name: 'asc' }, { id: 'asc' }], skip: (page - 1) * limit, take: limit }),
      db.category.count(),
    ]);
    res.json({ data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  });
  return routes;
}
