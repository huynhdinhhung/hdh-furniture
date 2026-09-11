import { HttpError } from '../../errors.js';
const MAX = 999999999999999999n;
export function discountFor(subtotal: bigint, coupon: { kind: 'PERCENT' | 'FIXED'; value: string; maxDiscount?: string | null; minSubtotal: string } | null) {
  if (!coupon) return 0n;
  if (subtotal < BigInt(coupon.minSubtotal)) throw new HttpError(409, 'COUPON_MINIMUM', 'Giá trị đơn chưa đạt mức tối thiểu của mã giảm giá.');
  let discount = coupon.kind === 'PERCENT' ? subtotal * BigInt(coupon.value) / 100n : BigInt(coupon.value);
  if (coupon.maxDiscount !== null && coupon.maxDiscount !== undefined) discount = discount < BigInt(coupon.maxDiscount) ? discount : BigInt(coupon.maxDiscount);
  return discount < subtotal ? discount : subtotal;
}
export function totalFor(subtotal: bigint, discount: bigint, shipping: bigint) {
  const total = subtotal - discount + shipping;
  if (subtotal < 0n || discount < 0n || shipping < 0n || discount > subtotal || total > MAX || subtotal > MAX) throw new HttpError(409, 'MONEY_RANGE', 'Giá trị đơn hàng vượt giới hạn cho phép.');
  return total;
}
export const transitions: Record<string, string[]> = { PENDING: ['CONFIRMED','CANCELLED'], CONFIRMED: ['SHIPPING','CANCELLED'], SHIPPING: ['COMPLETED'], COMPLETED: [], CANCELLED: [] };
