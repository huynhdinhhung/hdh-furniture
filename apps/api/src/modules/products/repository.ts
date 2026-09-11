import { Prisma, type PrismaClient } from '@prisma/client';
import type { ProductQuery } from './validation.js';

export const publicInclude = {
  category: { select: { id: true, name: true, slug: true } },
  variants: { where: { isActive: true }, orderBy: [{ price: 'asc' }, { sku: 'asc' }] },
  images: { where: { OR: [{ variantId: null }, { variant: { isActive: true } }] }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
} satisfies Prisma.ProductInclude;

export function filterSql(q: ProductQuery) {
  const parts = [Prisma.sql`p."isActive" = true`, Prisma.sql`v."isActive" = true`];
  if (q.q) {
    const literal = q.q.replace(/[\\%_]/g, '\\$&');
    parts.push(Prisma.sql`p.name ILIKE ${'%' + literal + '%'}`);
  }
  if (q.category) parts.push(Prisma.sql`p."categoryId" IN (
    WITH RECURSIVE tree AS (
      SELECT id FROM categories WHERE slug = ${q.category}
      UNION SELECT c.id FROM categories c JOIN tree t ON c."parentId" = t.id
    ) SELECT id FROM tree
  )`);
  if (q.collection) parts.push(Prisma.sql`EXISTS (
    SELECT 1 FROM collection_products cp JOIN collections c ON c.id = cp."collectionId"
    WHERE cp."productId" = p.id AND c.slug = ${q.collection}
  )`);
  if (q.color) parts.push(Prisma.sql`LOWER(v.color) = LOWER(${q.color})`);
  if (q.material) parts.push(Prisma.sql`LOWER(v.material) = LOWER(${q.material})`);
  if (q.minPrice !== undefined) parts.push(Prisma.sql`v.price >= ${new Prisma.Decimal(q.minPrice)}`);
  if (q.maxPrice !== undefined) parts.push(Prisma.sql`v.price <= ${new Prisma.Decimal(q.maxPrice)}`);
  return Prisma.join(parts, ' AND ');
}

export function createProductRepository(db: PrismaClient) {
  return {
    async list(q: ProductQuery) {
      const where = filterSql(q);
      const order = q.sort === 'price_asc' ? Prisma.sql`price ASC, p.id ASC`
        : q.sort === 'price_desc' ? Prisma.sql`price DESC, p.id ASC`
        : Prisma.sql`p."createdAt" DESC, p.id ASC`;
      return db.$transaction(async tx => {
        const rows = await tx.$queryRaw<{ id: string; price: Prisma.Decimal }[]>(Prisma.sql`
          SELECT p.id, MIN(v.price) AS price FROM products p
          JOIN product_variants v ON v."productId" = p.id
          WHERE ${where} GROUP BY p.id ORDER BY ${order}
          LIMIT ${q.limit} OFFSET ${(q.page - 1) * q.limit}
        `);
        const [count] = await tx.$queryRaw<{ total: bigint }[]>(Prisma.sql`
          SELECT COUNT(DISTINCT p.id) AS total FROM products p
          JOIN product_variants v ON v."productId" = p.id WHERE ${where}
        `);
        const products = await tx.product.findMany({ where: { id: { in: rows.map(r => r.id) } }, include: publicInclude });
        return {
          data: rows.map(row => ({ ...products.find(p => p.id === row.id)!, matchingPrice: row.price.toFixed(0) })),
          total: Number(count.total),
        };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
    },
    detail(slug: string) {
      return db.product.findFirst({ where: { slug, isActive: true, variants: { some: { isActive: true } } }, include: publicInclude });
    },
  };
}
export type ProductRepository = ReturnType<typeof createProductRepository>;
