import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { PrismaClient } from '@prisma/client';
import { productQuery } from '../../apps/api/src/modules/products/validation.js';
import { createProductService } from '../../apps/api/src/modules/products/service.js';
import { filterSql, type ProductRepository } from '../../apps/api/src/modules/products/repository.js';
import { createApp } from '../../apps/api/src/app.js';

describe('catalog input', () => {
  it('has bounded defaults', () => { expect(productQuery.parse({})).toEqual({ page: 1, limit: 12, sort: 'newest' }); });
  it.each([{ page: '0' }, { page: '1.5' }, { page: '100001' }, { limit: '49' }, { limit: '' }, { sort: 'random' }, { minPrice: '-1' }, { maxPrice: '0.1' }, { minPrice: '100', maxPrice: '50' }, { q: ['a', 'b'] }, { unknown: 'x' }])('rejects invalid query %j', query => {
    expect(productQuery.safeParse(query).success).toBe(false);
  });
  it('retains exact 18-digit prices without floats', () => {
    expect(productQuery.parse({ minPrice: '999999999999999998', maxPrice: '999999999999999999' }).minPrice).toBe('999999999999999998');
  });
  it('parameterizes user text and escapes LIKE wildcards', () => {
    const sql = filterSql(productQuery.parse({ q: "a%_' OR 1=1 --", color: 'Kem', maxPrice: '5000000' }));
    expect(sql.text).not.toContain("OR 1=1 --");
    expect(sql.values).toContain("%a\\%\\_' OR 1=1 --%");
    expect(sql.text).toContain('v.color');
    expect(sql.text).toContain('v.price');
  });
});

describe('catalog service and HTTP', () => {
  const repo = { list: vi.fn(), detail: vi.fn() } satisfies ProductRepository;
  it('calculates pagination and retains out-of-range empty results', async () => {
    repo.list.mockResolvedValue({ data: [], total: 25 });
    const result = await createProductService(repo).list(productQuery.parse({ page: '4' }));
    expect(result.meta).toEqual({ total: 25, limit: 12, page: 4, totalPages: 3 });
  });
  it('returns 404 for hidden or missing products', async () => {
    repo.detail.mockResolvedValue(null);
    await expect(createProductService(repo).detail('missing')).rejects.toMatchObject({ status: 404 });
  });
  it('returns health without DB access and does not disclose internals', async () => {
    const response = await request(createApp({} as PrismaClient)).get('/api/v1/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
  it('rejects malformed query before calling DB', async () => {
    const response = await request(createApp({} as PrismaClient)).get('/api/v1/products?limit=500');
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_INPUT');
  });
  it('returns a safe error for DB failures', async () => {
    const response = await request(createApp({ category: { findMany() { throw new Error('postgresql://secret'); } } } as unknown as PrismaClient)).get('/api/v1/categories');
    expect(response.status).toBe(503);
    expect(JSON.stringify(response.body)).not.toContain('secret');
  });
  it('restricts CORS to configured web origin', async () => {
    const response = await request(createApp({} as PrismaClient)).get('/api/v1/health').set('Origin', 'https://untrusted.example');
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });
});
