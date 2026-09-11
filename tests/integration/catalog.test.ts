import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { db } from '../../apps/api/src/db.js';
import { createApp } from '../../apps/api/src/app.js';

const app = createApp(db);
const token = randomUUID();
const categorySlug = 'test-' + token;
const ids: string[] = [];
let categoryId: string;
let childId: string;
let firstVariant: string;
beforeAll(async () => {
  if (!/^furniture_test[a-z0-9_]*$/.test(new URL(process.env.DATABASE_URL!).pathname.slice(1))) throw new Error('Test DB required');
  const category = await db.category.create({ data: { name: 'Integration ' + token, slug: categorySlug } });
  categoryId = category.id;
  childId = (await db.category.create({ data: { name: 'Child', slug: 'child-' + token, parentId: categoryId } })).id;
  for (let i = 0; i < 4; i++) {
    const product = await db.product.create({ data: {
      name: 'Test ' + token + ' ' + i, slug: 'test-' + token + '-' + i, description: 'Integration fixture', categoryId: childId, isActive: i !== 3,
      variants: { create: [
        { sku: token + '-' + i + '-A', color: 'Kem', material: 'Vải', price: String(1000 + i * 1000), stock: 2, widthMm: 1, depthMm: 1, heightMm: 1 },
        { sku: token + '-' + i + '-B', color: 'Nâu', material: 'Gỗ', price: '999999999999999999', stock: 0, widthMm: 1, depthMm: 1, heightMm: 1 },
        { sku: token + '-' + i + '-hidden', color: 'Đỏ', material: 'Vải', price: '1', stock: 10, widthMm: 1, depthMm: 1, heightMm: 1, isActive: false },
      ] },
    }, include: { variants: true } });
    ids.push(product.id);
    if (i === 0) firstVariant = product.variants[0].id;
  }
});
afterAll(async () => {
  await db.productImage.deleteMany({ where: { productId: { in: ids } } });
  await db.productVariant.deleteMany({ where: { productId: { in: ids } } });
  await db.product.deleteMany({ where: { id: { in: ids } } });
  if (childId) await db.category.delete({ where: { id: childId } });
  if (categoryId) await db.category.delete({ where: { id: categoryId } });
  await db.$disconnect();
});
describe('PostgreSQL catalog', () => {
  it('filters parent categories recursively, excludes inactive, sorts and paginates', async () => {
    const res = await request(app).get('/api/v1/products').query({ category: categorySlug, limit: 2, sort: 'price_desc' });
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(3);
    expect(res.body.data.map((p: { matchingPrice: string }) => p.matchingPrice)).toEqual(['3000', '2000']);
    const next = await request(app).get('/api/v1/products').query({ category: categorySlug, limit: 2, page: 2, sort: 'price_desc' });
    expect(next.body.data[0].matchingPrice).toBe('1000');
  });
  it('requires all variant filters on the same active SKU', async () => {
    const res = await request(app).get('/api/v1/products').query({ category: categorySlug, color: 'Nâu', maxPrice: '10000' });
    expect(res.body.meta.total).toBe(0);
    const hidden = await request(app).get('/api/v1/products').query({ category: categorySlug, color: 'Đỏ' });
    expect(hidden.body.meta.total).toBe(0);
  });
  it('serializes 18-digit prices as strings and hides inactive variants', async () => {
    const res = await request(app).get('/api/v1/products/test-' + token + '-0');
    expect(res.status).toBe(200);
    expect(res.body.data.variants).toHaveLength(2);
    expect(res.body.data.variants[1].price).toBe('999999999999999999');
  });
  it('returns 404 for inactive product', async () => {
    expect((await request(app).get('/api/v1/products/test-' + token + '-3')).status).toBe(404);
  });
  it('treats SQL and wildcard text literally', async () => {
    const res = await request(app).get('/api/v1/products').query({ q: "%' OR 1=1 --" });
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(0);
  });
  it('rejects negative price and stock at database boundary', async () => {
    await expect(db.productVariant.update({ where: { id: firstVariant }, data: { stock: -1 } })).rejects.toThrow();
    await expect(db.productVariant.update({ where: { id: firstVariant }, data: { price: '-1' } })).rejects.toThrow();
  });
  it('rejects image associated with a variant of another product', async () => {
    await expect(db.productImage.create({ data: { productId: ids[1], variantId: firstVariant, url: '/test.jpg', alt: 'test' } })).rejects.toThrow();
  });
  it('rejects category cycles', async () => {
    await expect(db.category.update({ where: { id: categoryId }, data: { parentId: childId } })).rejects.toThrow();
  });
});
