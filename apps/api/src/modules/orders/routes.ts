import { Router } from 'express';
import { z } from 'zod';
import type { PrismaClient } from '@prisma/client';
import { identity } from '../auth/security.js';
import { checkoutInput, type ShopSettings } from './validation.js';
import { createOrderService, safeOrder } from './service.js';
import { pageQuery } from '../products/validation.js';
import { HttpError } from '../../errors.js';

export function orderRoutes(db: PrismaClient, settings: ShopSettings) {
  const router = Router(), service = createOrderService(db, settings);
  router.use((_req, res, next) => { identity(res); next(); });
  router.post('/quote', async (req, res) => { res.json({ data: await service.quote(checkoutInput.parse(req.body)) }); });
  router.post('/', async (req, res) => {
    const key = z.string().min(8).max(80).regex(/^[a-zA-Z0-9-]+$/).parse(req.get('Idempotency-Key'));
    const expectedTotal = z.string().regex(/^(0|[1-9]\d{0,17})$/).parse(req.get('X-Expected-Total'));
    const order = await service.create(identity(res).id, key, checkoutInput.parse(req.body), expectedTotal);
    res.status(201).json({ data: safeOrder(order) });
  });
  router.get('/', async (req, res) => {
    const { page, limit } = pageQuery.parse(req.query), userId = identity(res).id;
    const [data,total] = await db.$transaction([db.order.findMany({ where: { userId }, orderBy: [{ createdAt:'desc' },{id:'asc'}], take:limit, skip:(page-1)*limit, include:{items:true} }), db.order.count({where:{userId}})]);
    res.json({data:data.map(safeOrder),meta:{page,limit,total,totalPages:Math.ceil(total/limit)}});
  });
  router.get('/:id', async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const order = await db.order.findFirst({ where: { id, userId: identity(res).id }, include:{items:true} });
    if (!order) throw new HttpError(404,'ORDER_NOT_FOUND','Không tìm thấy đơn hàng.');
    res.json({data:safeOrder(order)});
  });
  router.post('/:id/cancel', async (req, res) => {
    res.json({data:safeOrder(await service.transition(identity(res),z.string().uuid().parse(req.params.id),'CANCELLED'))});
  });
  return router;
}
