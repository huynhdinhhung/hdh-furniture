import { z } from 'zod';
const text = (max = 200) => z.string().trim().min(1).max(max);
const slug = text(160).regex(/^[a-z0-9-]+$/);
const money = z.string().regex(/^(0|[1-9]\d{0,17})$/);
const id = z.string().uuid();
const imageUrl = z.string().max(2000).refine(v => /^\/api\/media\/[a-f0-9-]+\.webp$/.test(v) || /^https:\/\//.test(v) && (() => { try { const u = new URL(v); return !u.username && !u.password; } catch { return false; } })(), 'Dùng ảnh tải lên hoặc URL HTTPS.');
export const schemas = {
  categories: z.object({ name: text(160), slug, parentId: id.nullable() }).strict(),
  products: z.object({ name: text(), slug, description: text(10000), categoryId: id, isActive: z.boolean() }).strict(),
  variants: z.object({ productId: id, sku: text(100), color: text(80), material: text(120), widthMm: z.number().int().min(1).max(50000), depthMm: z.number().int().min(1).max(50000), heightMm: z.number().int().min(1).max(50000), price: money, stock: z.number().int().min(0).max(1000000), isActive: z.boolean() }).strict(),
  images: z.object({ productId: id, variantId: id.nullable(), url: imageUrl, alt: text(500), sortOrder: z.number().int().min(0).max(10000) }).strict(),
  banners: z.object({ title: text(), imageUrl, targetUrl: z.string().max(500).regex(/^\/san-pham(?:[/?][a-zA-Z0-9_/?=&%.-]*)?$/), sortOrder: z.number().int().min(0).max(10000), isActive: z.boolean() }).strict(),
  collections: z.object({ name: text(), slug, description: text(3000), imageUrl, productIds: z.array(id).max(100).refine(v => new Set(v).size === v.length) }).strict(),
  coupons: z.object({ code: text(40).toUpperCase().regex(/^[A-Z0-9_-]+$/), kind: z.enum(['PERCENT','FIXED']), value: money, maxDiscount: money.nullable(), minSubtotal: money, startsAt: z.iso.datetime({ offset: true }), expiresAt: z.iso.datetime({ offset: true }), usageLimit: z.number().int().min(1).max(1000000).nullable(), isActive: z.boolean() }).strict()
    .refine(v => BigInt(v.value) > 0n && (v.kind !== 'PERCENT' || BigInt(v.value) <= 100n), 'Giá trị giảm phải dương; phần trăm tối đa 100.')
    .refine(v => new Date(v.expiresAt) > new Date(v.startsAt), 'Thời gian kết thúc phải sau bắt đầu.'),
};
export const entityInput = z.enum(['categories','products','variants','images','banners','collections','coupons']);
export type Entity = z.infer<typeof entityInput>;
