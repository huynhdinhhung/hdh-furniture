import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { cookieToken, digest, setToken, lock } from '../auth/security.js';
import { cartData, setCartItem } from './service.js';

export function cartRoutes(db: PrismaClient) {
  const routes = Router();
  routes.use(async (req, res, next) => {
    const userId = res.locals.user?.id as string | undefined;
    let guest = cookieToken(req, 'hf_guest');
    if (!userId && !guest) { guest = randomBytes(32).toString('hex'); setToken(res, 'hf_guest', guest); }
    const where = userId ? { userId } : { guestTokenHash: digest(guest!) };
    const cart = await db.cart.upsert({ where, update: {}, create: where });
    res.locals.cartId = cart.id;
    res.locals.cartOwner = userId || cart.id;
    next();
  });
  routes.get('/', async (_req, res) => { res.json({ data: await cartData(db, res.locals.cartId) }); });
  const input = z.object({ variantId: z.string().uuid(), quantity: z.number().int().min(1).max(99) }).strict();
  routes.post('/items', async (req, res) => { const data = input.parse(req.body); res.json({ data: await setCartItem(db, res.locals.cartId, res.locals.cartOwner, data.variantId, data.quantity, true) }); });
  routes.put('/items/:variantId', async (req, res) => { const data = input.parse({ ...req.body, variantId: req.params.variantId }); res.json({ data: await setCartItem(db, res.locals.cartId, res.locals.cartOwner, data.variantId, data.quantity, false) }); });
  routes.delete('/items/:variantId', async (req, res) => {
    const variantId = z.string().uuid().parse(req.params.variantId);
    await db.$transaction(async tx => { await lock(tx, res.locals.cartOwner); await tx.cartItem.deleteMany({ where: { cartId: res.locals.cartId, variantId } }); });
    res.json({ data: await cartData(db, res.locals.cartId) });
  });
  return routes;
}
