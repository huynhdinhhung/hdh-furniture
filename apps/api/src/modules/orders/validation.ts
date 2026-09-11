import { z } from 'zod';
export const checkoutInput = z.object({
  items: z.array(z.object({ variantId: z.string().uuid(), quantity: z.number().int().min(1).max(99) }).strict()).min(1).max(50),
  shipping: z.object({ fullName: z.string().trim().min(2).max(120), phone: z.string().trim().regex(/^\+?[0-9]{9,15}$/, 'Số điện thoại không hợp lệ.'), address: z.string().trim().min(10).max(500) }).strict(),
  paymentMethod: z.enum(['COD','BANK_TRANSFER']),
  couponCode: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{1,40}$/).optional(),
}).strict().refine(v => new Set(v.items.map(i => i.variantId)).size === v.items.length, 'Mỗi biến thể chỉ được xuất hiện một lần.');
export type Checkout = z.infer<typeof checkoutInput>;
export type ShopSettings = { shippingFee: string; transfer: { bank: string; account: string; holder: string } | null };
export function shopSettings(): ShopSettings {
  const fee = process.env.SHIPPING_FEE_VND || '50000';
  if (!/^(0|[1-9]\d{0,11})$/.test(fee)) throw new Error('SHIPPING_FEE_VND không hợp lệ');
  const { BANK_NAME: bank, BANK_ACCOUNT: account, BANK_HOLDER: holder } = process.env;
  return { shippingFee: fee, transfer: bank && account && holder ? { bank, account, holder } : null };
}
