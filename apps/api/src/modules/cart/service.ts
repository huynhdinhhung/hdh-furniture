import type { PrismaClient, Prisma } from '@prisma/client';
import { HttpError } from '../../errors.js';
import { lock } from '../auth/security.js';
export async function mergeGuestCart(db: PrismaClient, userId: string, guestTokenHash?: string) {
  return db.$transaction(async tx => {
    await lock(tx, userId);
    const target = await tx.cart.upsert({ where: { userId }, update: {}, create: { userId } });
    if (!guestTokenHash) return;
    const guest = await tx.cart.findUnique({ where: { guestTokenHash } });
    if (!guest || guest.id === target.id) return;
    await lock(tx, guest.id);
    const items = await tx.cartItem.findMany({ where: { cartId: guest.id }, include: { variant: { include: { product: true } } } });
    for (const item of items) {
      if (!item.variant.isActive || !item.variant.product.isActive || item.variant.stock <= 0) continue;
      const existing = await tx.cartItem.findUnique({ where: { cartId_variantId: { cartId: target.id, variantId: item.variantId } } });
      const quantity = Math.min(99, item.variant.stock, item.quantity + (existing?.quantity || 0));
      await tx.cartItem.upsert({ where: { cartId_variantId: { cartId: target.id, variantId: item.variantId } }, update: { quantity }, create: { cartId: target.id, variantId: item.variantId, quantity } });
    }
    await tx.cart.delete({ where: { id: guest.id } });
  });
}
export async function cartData(tx: Prisma.TransactionClient | PrismaClient, cartId: string) {
  const rows = await tx.cartItem.findMany({ where: { cartId }, include: { variant: { include: { product: { include: { images: { take: 1, orderBy: { sortOrder: 'asc' } } } } } } }, orderBy: { id: 'asc' } });
  let subtotal = 0n;
  const items = rows.map(i => {
    const available = i.variant.isActive && i.variant.product.isActive && i.variant.stock >= i.quantity;
    const lineTotal = BigInt(i.variant.price.toFixed(0)) * BigInt(i.quantity);
    subtotal += lineTotal;
    return { id: i.id, variantId: i.variantId, quantity: i.quantity, name: i.variant.product.name, slug: i.variant.product.slug, sku: i.variant.sku, color: i.variant.color, material: i.variant.material, price: i.variant.price.toFixed(0), stock: i.variant.stock, available, lineTotal: lineTotal.toString(), image: i.variant.product.images[0]?.url || null };
  });
  return { items, subtotal: subtotal.toString(), canCheckout: items.length > 0 && items.every(i => i.available) };
}
export async function setCartItem(db: PrismaClient, cartId: string, ownerKey: string, variantId: string, quantity: number, add: boolean) {
  return db.$transaction(async tx => {
    await lock(tx, ownerKey);
    const variant = await tx.productVariant.findUnique({ where: { id: variantId }, include: { product: true } });
    if (!variant || !variant.isActive || !variant.product.isActive) throw new HttpError(409, 'UNAVAILABLE', 'Sản phẩm đã ngừng bán.');
    const existing = await tx.cartItem.findUnique({ where: { cartId_variantId: { cartId, variantId } } });
    const desired = quantity + (add ? existing?.quantity || 0 : 0);
    if (desired > variant.stock || desired > 99) throw new HttpError(409, 'OUT_OF_STOCK', 'Số lượng vượt tồn kho hoặc giới hạn 99 sản phẩm.');
    if (!existing && await tx.cartItem.count({ where: { cartId } }) >= 50) throw new HttpError(409, 'CART_LIMIT', 'Giỏ hàng tối đa 50 loại sản phẩm.');
    await tx.cartItem.upsert({ where: { cartId_variantId: { cartId, variantId } }, update: { quantity: desired }, create: { cartId, variantId, quantity: desired } });
    return cartData(tx, cartId);
  });
}
