import { randomUUID } from 'node:crypto';
import { Prisma, type PrismaClient, type OrderStatus, type PaymentStatus } from '@prisma/client';
import { HttpError } from '../../errors.js';
import { audit, digest, lock, type Identity } from '../auth/security.js';
import { discountFor, totalFor, transitions } from './money.js';
import type { Checkout, ShopSettings } from './validation.js';

export function requestHash(input: Checkout) {
  return digest(JSON.stringify({ items: [...input.items].sort((a,b) => a.variantId.localeCompare(b.variantId)), shipping: input.shipping, paymentMethod: input.paymentMethod, couponCode: input.couponCode || null }));
}
async function quote(tx: Prisma.TransactionClient, input: Checkout, settings: ShopSettings, reserve: boolean) {
  if (input.paymentMethod === 'BANK_TRANSFER' && !settings.transfer) throw new HttpError(409, 'TRANSFER_UNAVAILABLE', 'Chuyển khoản chưa được cấu hình. Vui lòng chọn COD.');
  const items = [];
  let subtotal = 0n;
  // Lock products first in a stable order, then variants, to avoid opposite lock
  // ordering when two baskets contain different variants of the same product.
  if (reserve) await tx.$queryRaw(Prisma.sql`SELECT p.id FROM products p WHERE p.id IN (SELECT v."productId" FROM product_variants v WHERE v.id IN (${Prisma.join(input.items.map(i=>Prisma.sql`${i.variantId}::uuid`))})) ORDER BY p.id FOR UPDATE`);
  for (const requested of [...input.items].sort((a,b) => a.variantId.localeCompare(b.variantId))) {
    if (reserve) await tx.$queryRaw`SELECT id FROM product_variants WHERE id=${requested.variantId}::uuid FOR UPDATE`;
    const variant = await tx.productVariant.findUnique({ where: { id: requested.variantId }, include: { product: true } });
    if (!variant || !variant.isActive || !variant.product.isActive || variant.stock < requested.quantity) throw new HttpError(409, 'OUT_OF_STOCK', 'Sản phẩm đã ngừng bán hoặc không đủ tồn kho. Hãy kiểm tra lại giỏ hàng.');
    const lineTotal = BigInt(variant.price.toFixed(0)) * BigInt(requested.quantity);
    subtotal += lineTotal;
    items.push({ variantId: variant.id, productNameSnapshot: variant.product.name, skuSnapshot: variant.sku, optionsSnapshot: { color: variant.color, material: variant.material, widthMm: variant.widthMm, depthMm: variant.depthMm, heightMm: variant.heightMm }, unitPrice: variant.price.toFixed(0), quantity: requested.quantity, lineTotal: lineTotal.toString() });
  }
  if (reserve && input.couponCode) await tx.$queryRaw`SELECT id FROM coupons WHERE code=${input.couponCode} FOR UPDATE`;
  const coupon = input.couponCode ? await tx.coupon.findUnique({ where: { code: input.couponCode } }) : null;
  const now = new Date();
  if (input.couponCode && (!coupon || !coupon.isActive || now < coupon.startsAt || now >= coupon.expiresAt || (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit))) throw new HttpError(409, 'COUPON_INVALID', 'Mã giảm giá không tồn tại, chưa đến hạn, đã hết hạn hoặc hết lượt.');
  const discount = discountFor(subtotal, coupon ? { kind: coupon.kind, value: coupon.value.toFixed(0), minSubtotal: coupon.minSubtotal.toFixed(0), maxDiscount: coupon.maxDiscount?.toFixed(0) } : null);
  const total = totalFor(subtotal, discount, BigInt(settings.shippingFee));
  return { items, subtotal: subtotal.toString(), discount: discount.toString(), shippingFee: settings.shippingFee, total: total.toString(), couponId: coupon?.id || null, couponCode: coupon?.code || null };
}
export function createOrderService(db: PrismaClient, settings: ShopSettings) {
  return {
    quote(input: Checkout) { return db.$transaction(tx => quote(tx, input, settings, false)); },
    create(userId: string, key: string, input: Checkout, expectedTotal: string) {
      return db.$transaction(async tx => {
        // The same lock serializes cart writes, checkout and retries for one customer.
        await lock(tx, userId);
        const hash = digest(requestHash(input) + ':' + expectedTotal);
        const previous = await tx.order.findUnique({ where: { userId_idempotencyKey: { userId, idempotencyKey: key } }, include: { items: true } });
        if (previous) {
          if (previous.requestHash !== hash) throw new HttpError(409, 'IDEMPOTENCY_CONFLICT', 'Mã yêu cầu đã được dùng cho nội dung đơn khác.');
          return previous;
        }
        const priced = await quote(tx, input, settings, true);
        if (priced.total !== expectedTotal) throw new HttpError(409, 'PRICE_CHANGED', 'Tổng tiền đã thay đổi. Vui lòng kiểm tra đơn hàng lại trước khi xác nhận.');
        for (const item of priced.items) {
          const changed = await tx.productVariant.updateMany({ where: { id: item.variantId, isActive: true, stock: { gte: item.quantity } }, data: { stock: { decrement: item.quantity } } });
          if (changed.count !== 1) throw new HttpError(409, 'OUT_OF_STOCK', 'Sản phẩm vừa hết hàng.');
        }
        if (priced.couponId) await tx.coupon.update({ where: { id: priced.couponId }, data: { usedCount: { increment: 1 } } });
        const order = await tx.order.create({ data: {
          ...priced, items: { create: priced.items }, userId, orderNumber: 'HF-' + randomUUID().replaceAll('-','').slice(0,16).toUpperCase(),
          paymentMethod: input.paymentMethod, shippingSnapshot: input.shipping, idempotencyKey: key, requestHash: hash,
        }, include: { items: true } });
        const cart = await tx.cart.findUnique({ where: { userId } });
        for (const item of priced.items) {
          await tx.inventoryMovement.create({ data: { orderId: order.id, variantId: item.variantId, actorId: userId, delta: -item.quantity, reason: 'SALE' } });
          if (cart) {
            const line = await tx.cartItem.findUnique({ where: { cartId_variantId: { cartId: cart.id, variantId: item.variantId } } });
            if (line && line.quantity <= item.quantity) await tx.cartItem.delete({ where: { id: line.id } });
            else if (line) await tx.cartItem.update({ where: { id: line.id }, data: { quantity: { decrement: item.quantity } } });
          }
        }
        await audit(tx, userId, 'order', order.id, 'CREATE', { total: priced.total });
        return order;
      }, { maxWait: 10000, timeout: 20000, isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
    },
    transition(actor: Identity, id: string, status: OrderStatus) {
      return db.$transaction(async tx => {
        await tx.$queryRaw`SELECT id FROM orders WHERE id=${id}::uuid FOR UPDATE`;
        const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
        if (!order || (actor.role !== 'ADMIN' && order.userId !== actor.id)) throw new HttpError(404, 'ORDER_NOT_FOUND', 'Không tìm thấy đơn hàng.');
        if (actor.role !== 'ADMIN' && status !== 'CANCELLED') throw new HttpError(403, 'FORBIDDEN', 'Bạn không được thay đổi trạng thái này.');
        if (order.status === status) return order;
        if (!transitions[order.status]?.includes(status)) throw new HttpError(409, 'INVALID_TRANSITION', 'Không thể chuyển trạng thái đơn hàng.');
        if (status === 'CANCELLED') {
          for (const item of [...order.items].sort((a,b) => a.variantId.localeCompare(b.variantId))) {
            await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
            await tx.inventoryMovement.create({ data: { orderId: id, variantId: item.variantId, actorId: actor.id, delta: item.quantity, reason: 'RETURN' } });
          }
          // Cancellation restores one coupon use; the locked order prevents a repeated restore.
          if (order.couponId) await tx.coupon.update({ where: { id: order.couponId }, data: { usedCount: { decrement: 1 } } });
        }
        await audit(tx, actor.id, 'order', id, 'STATUS', { from: order.status, to: status });
        return tx.order.update({ where: { id }, data: { status }, include: { items: true } });
      }, { timeout: 20000 });
    },
    payment(actor: Identity, id: string, paymentStatus: PaymentStatus) {
      return db.$transaction(async tx => {
        await tx.$queryRaw`SELECT id FROM orders WHERE id=${id}::uuid FOR UPDATE`;
        const order = await tx.order.findUnique({ where: { id } });
        if (!order) throw new HttpError(404, 'ORDER_NOT_FOUND', 'Không tìm thấy đơn hàng.');
        if (actor.role !== 'ADMIN') throw new HttpError(403, 'FORBIDDEN', 'Chỉ admin được xác nhận thanh toán.');
        if (order.paymentStatus === paymentStatus) return order;
        const valid = order.paymentStatus === 'UNPAID' && paymentStatus === 'PAID' && order.status !== 'CANCELLED'
          || order.paymentStatus === 'PAID' && paymentStatus === 'REFUNDED' && order.status === 'CANCELLED';
        if (!valid) throw new HttpError(409, 'INVALID_PAYMENT', 'Chuyển trạng thái thanh toán không hợp lệ.');
        await audit(tx, actor.id, 'order', id, 'PAYMENT', { from: order.paymentStatus, to: paymentStatus });
        return tx.order.update({ where: { id }, data: { paymentStatus } });
      });
    },
  };
}
export function safeOrder<T extends { requestHash: string; idempotencyKey: string }>(order: T) {
  const safe = { ...order } as Omit<T, 'requestHash' | 'idempotencyKey'> & Partial<Pick<T, 'requestHash' | 'idempotencyKey'>>;
  delete safe.requestHash;
  delete safe.idempotencyKey;
  return safe;
}
