import { z } from 'zod';

const integer = (fallback: number, max: number) => z.string().regex(/^[1-9]\d*$/).transform(Number).pipe(z.number().int().max(max)).default(fallback);
const money = z.string().regex(/^(0|[1-9]\d{0,17})$/, 'Giá phải là số nguyên VND không âm.').optional();
export const productQuery = z.object({
  page: integer(1, 100000), limit: integer(12, 48),
  q: z.string().trim().max(100).optional(),
  category: z.string().regex(/^[a-z0-9-]{1,160}$/).optional(),
  collection: z.string().regex(/^[a-z0-9-]{1,160}$/).optional(),
  color: z.string().trim().min(1).max(80).optional(),
  material: z.string().trim().min(1).max(120).optional(),
  minPrice: money, maxPrice: money,
  sort: z.enum(['newest', 'price_asc', 'price_desc']).default('newest'),
}).strict().refine(v => v.minPrice === undefined || v.maxPrice === undefined || BigInt(v.minPrice) <= BigInt(v.maxPrice), {
  message: 'Giá tối thiểu không được lớn hơn giá tối đa.', path: ['minPrice'],
});
export const pageQuery = z.object({ page: integer(1, 100000), limit: integer(48, 100) }).strict();
export const slugParam = z.string().regex(/^[a-z0-9-]{1,200}$/);
export type ProductQuery = z.infer<typeof productQuery>;
