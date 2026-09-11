import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import type { Request, Response, RequestHandler } from 'express';
import type { PrismaClient, Prisma } from '@prisma/client';
import { HttpError } from '../../errors.js';

export const digest = (value: string) => createHash('sha256').update(value).digest('hex');
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const key = await derive(password, salt);
  return 'scrypt:' + salt + ':' + key.toString('hex');
}
function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => scrypt(password, salt, 64, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 }, (err, key) => err ? reject(err) : resolve(key)));
}
export async function verifyPassword(password: string, stored: string) {
  const [kind, salt, hash] = stored.split(':');
  if (kind !== 'scrypt' || !/^[a-f0-9]{32}$/.test(salt || '') || !/^[a-f0-9]{128}$/.test(hash || '')) return false;
  return timingSafeEqual(await derive(password, salt), Buffer.from(hash, 'hex'));
}
export function cookieToken(req: Request, name: string) {
  const entry = req.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith(name + '='));
  const value = entry?.slice(name.length + 1);
  return value && /^[a-f0-9]{64}$/.test(value) ? value : undefined;
}
export function setToken(res: Response, name: string, token: string) {
  res.cookie(name, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 7 * 86400000 });
}
export const publicUser = { id: true, fullName: true, email: true, role: true } as const;
export type Identity = { id: string; fullName: string; email: string; role: 'ADMIN' | 'CUSTOMER' };
export function authentication(db: PrismaClient): RequestHandler {
  return async (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    const token = cookieToken(req, 'hf_session');
    const session = token ? await db.session.findUnique({ where: { tokenHash: digest(token) }, include: { user: { select: publicUser } } }) : null;
    res.locals.user = session && session.expiresAt > new Date() ? session.user : null;
    next();
  };
}
export function identity(res: Response): Identity {
  if (!res.locals.user) throw new HttpError(401, 'LOGIN_REQUIRED', 'Vui lòng đăng nhập.');
  return res.locals.user as Identity;
}
export const requireAdmin: RequestHandler = (_req, res, next) => {
  if (identity(res).role !== 'ADMIN') throw new HttpError(403, 'FORBIDDEN', 'Bạn không có quyền quản trị.');
  next();
};
export function csrf(origin: string): RequestHandler {
  return (req, _res, next) => {
    if (!['GET','HEAD','OPTIONS'].includes(req.method) && (req.get('Origin') !== origin || req.get('X-Requested-With') !== 'HungFurniture')) throw new HttpError(403, 'CSRF_REJECTED', 'Yêu cầu không hợp lệ. Hãy tải lại trang.');
    next();
  };
}
export async function lock(tx: Prisma.TransactionClient, key: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`;
}
export async function audit(tx: Prisma.TransactionClient, actorId: string, entityType: string, entityId: string, action: string, safeMetadata: Prisma.InputJsonValue = {}) {
  await tx.auditLog.create({ data: { actorId, entityType, entityId, action, safeMetadata } });
}
export async function rateLimit(db: PrismaClient, key: string) {
  const hashed = digest(key);
  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO login_attempts ("key", count, "expiresAt") VALUES (${hashed}, 1, NOW() + interval '15 minutes')
    ON CONFLICT ("key") DO UPDATE SET count = CASE WHEN login_attempts."expiresAt" < NOW() THEN 1 ELSE login_attempts.count + 1 END,
    "expiresAt" = CASE WHEN login_attempts."expiresAt" < NOW() THEN NOW() + interval '15 minutes' ELSE login_attempts."expiresAt" END RETURNING count`;
  if (rows[0].count > 30) throw new HttpError(429, 'RATE_LIMIT', 'Quá nhiều lần thử. Vui lòng thử lại sau 15 phút.');
}
