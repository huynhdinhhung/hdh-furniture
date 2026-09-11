import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { hashPassword, verifyPassword, digest, publicUser, setToken, cookieToken, rateLimit } from './security.js';
import { mergeGuestCart } from '../cart/service.js';
import { HttpError } from '../../errors.js';

const email = z.string().trim().toLowerCase().email().max(254);
const password = z.string().min(10, 'Mật khẩu ít nhất 10 ký tự.').max(128);
const loginInput = z.object({ email, password: z.string().min(1).max(128) }).strict();
const registerInput = z.object({ email, password, fullName: z.string().trim().min(2).max(120) }).strict();
export function authRoutes(db: PrismaClient) {
  const router = Router();
  router.get('/me', (_req, res) => res.json({ data: res.locals.user }));
  for (const mode of ['register','login'] as const) router.post('/' + mode, async (req, res) => {
    await rateLimit(db, (req.ip || 'unknown') + ':auth');
    const data = mode === 'register' ? registerInput.parse(req.body) : loginInput.parse(req.body);
    await rateLimit(db, data.email + ':auth');
    let user;
    if (mode === 'register') {
      const registration = registerInput.parse(data);
      user = await db.user.create({ data: { email: registration.email, passwordHash: await hashPassword(registration.password), fullName: registration.fullName, role: 'CUSTOMER' }, select: publicUser });
    } else {
      const stored = await db.user.findUnique({ where: { email: data.email } });
      const fallback = 'scrypt:' + '0'.repeat(32) + ':' + '0'.repeat(128);
      if (!await verifyPassword(data.password, stored?.passwordHash || fallback) || !stored) throw new HttpError(401, 'LOGIN_FAILED', 'Email hoặc mật khẩu không đúng.');
      user = { id: stored.id, email: stored.email, fullName: stored.fullName, role: stored.role };
    }
    const guest = cookieToken(req, 'hf_guest');
    await mergeGuestCart(db, user.id, guest ? digest(guest) : undefined);
    const old = cookieToken(req, 'hf_session');
    if (old) await db.session.deleteMany({ where: { tokenHash: digest(old) } });
    const token = randomBytes(32).toString('hex');
    await db.session.create({ data: { userId: user.id, tokenHash: digest(token), expiresAt: new Date(Date.now() + 7 * 86400000) } });
    setToken(res, 'hf_session', token);
    res.clearCookie('hf_guest', { path: '/' });
    res.status(mode === 'register' ? 201 : 200).json({ data: user });
  });
  router.post('/logout', async (req, res) => {
    const token = cookieToken(req, 'hf_session');
    if (token) await db.session.deleteMany({ where: { tokenHash: digest(token) } });
    res.clearCookie('hf_session', { path: '/' });
    res.json({ data: { loggedOut: true } });
  });
  return router;
}
