import type { Prisma } from '@prisma/client';
import { schemas, type Entity } from './validation.js';
import { audit } from '../auth/security.js';
import { HttpError } from '../../errors.js';
export async function saveEntity(tx: Prisma.TransactionClient, entity: Entity, id: string | undefined, body: unknown, actorId: string) {
  let result: { id: string };
  switch (entity) {
    case 'categories': { const data = schemas.categories.parse(body); result = id ? await tx.category.update({where:{id},data}) : await tx.category.create({data}); break; }
    case 'products': { const data = schemas.products.parse(body); result = id ? await tx.product.update({where:{id},data}) : await tx.product.create({data}); break; }
    case 'variants': {
      const data = schemas.variants.parse(body);
      if (id) await tx.$queryRaw`SELECT id FROM product_variants WHERE id=${id}::uuid FOR UPDATE`;
      const before = id ? await tx.productVariant.findUnique({where:{id}}) : null;
      if (before && before.productId !== data.productId) throw new HttpError(409,'VARIANT_PRODUCT','Không chuyển biến thể sang sản phẩm khác.');
      result = id ? await tx.productVariant.update({where:{id},data}) : await tx.productVariant.create({data});
      if (data.stock !== (before?.stock || 0)) await tx.inventoryMovement.create({data:{variantId:result.id,actorId,delta:data.stock-(before?.stock || 0),reason:'ADJUSTMENT'}});
      await audit(tx,actorId,'variant',result.id,'PRICE_STOCK',{before:before?{price:before.price.toFixed(0),stock:before.stock}:null,after:{price:data.price,stock:data.stock}});
      break;
    }
    case 'images': { const data = schemas.images.parse(body); result = id ? await tx.productImage.update({where:{id},data}) : await tx.productImage.create({data}); break; }
    case 'banners': { const data = schemas.banners.parse(body); result = id ? await tx.banner.update({where:{id},data}) : await tx.banner.create({data}); break; }
    case 'coupons': {
      const data = schemas.coupons.parse(body);
      if (id) {
        await tx.$queryRaw`SELECT id FROM coupons WHERE id=${id}::uuid FOR UPDATE`;
        const existing = await tx.coupon.findUnique({where:{id}});
        if (existing && data.usageLimit !== null && data.usageLimit < existing.usedCount) throw new HttpError(409,'COUPON_LIMIT','Giới hạn không được nhỏ hơn số lượt đã dùng.');
      }
      result = id ? await tx.coupon.update({where:{id},data}) : await tx.coupon.create({data}); break;
    }
    case 'collections': {
      const {productIds,...data} = schemas.collections.parse(body);
      result = id ? await tx.collection.update({where:{id},data}) : await tx.collection.create({data});
      await tx.collectionProduct.deleteMany({where:{collectionId:result.id}});
      if (productIds.length) await tx.collectionProduct.createMany({data:productIds.map(productId=>({collectionId:result.id,productId}))});
      break;
    }
  }
  await audit(tx,actorId,entity,result.id,id?'UPDATE':'CREATE',{});
  return result;
}
export async function removeEntity(tx: Prisma.TransactionClient, entity: Entity, id: string, actorId: string) {
  switch(entity) {
    case 'products': await tx.product.update({where:{id},data:{isActive:false}}); break;
    case 'variants': await tx.productVariant.update({where:{id},data:{isActive:false}}); break;
    case 'coupons': await tx.coupon.update({where:{id},data:{isActive:false}}); break;
    case 'banners': await tx.banner.update({where:{id},data:{isActive:false}}); break;
    case 'categories': await tx.category.delete({where:{id}}); break;
    case 'images': await tx.productImage.delete({where:{id}}); break;
    case 'collections': await tx.collection.delete({where:{id}}); break;
  }
  await audit(tx,actorId,entity,id,'REMOVE_OR_DISABLE',{});
}
