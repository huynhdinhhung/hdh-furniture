import { Router } from 'express';
import type { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';
import { identity, requireAdmin } from '../auth/security.js';
import { entityInput } from './validation.js';
import { saveEntity, removeEntity } from './service.js';
import { createOrderService, safeOrder } from '../orders/service.js';
import type { ShopSettings } from '../orders/validation.js';
const query = z.object({ page:z.coerce.number().int().min(1).max(100000).default(1),limit:z.coerce.number().int().min(1).max(100).default(20),q:z.string().trim().max(100).default(''),status:z.enum(['PENDING','CONFIRMED','SHIPPING','COMPLETED','CANCELLED']).optional() }).strict();
export function adminRoutes(db: PrismaClient, settings: ShopSettings) {
  const router = Router(), orders = createOrderService(db,settings);
  router.use(requireAdmin);
  router.get('/orders', async (req,res) => {
    const {page,limit,q,status}=query.parse(req.query);
    const where: Prisma.OrderWhereInput = { ...(status?{status}:{}), ...(q?{orderNumber:{contains:q,mode:'insensitive'}}:{}) };
    const [data,total]=await db.$transaction([db.order.findMany({where,take:limit,skip:(page-1)*limit,orderBy:[{createdAt:'desc'},{id:'asc'}],include:{items:true,user:{select:{fullName:true,email:true}}}}),db.order.count({where})]);
    res.json({data:data.map(safeOrder),meta:{page,limit,total,totalPages:Math.ceil(total/limit)}});
  });
  router.patch('/orders/:id/status',async(req,res)=>{
    const {status}=z.object({status:z.enum(['PENDING','CONFIRMED','SHIPPING','COMPLETED','CANCELLED'])}).strict().parse(req.body);
    res.json({data:safeOrder(await orders.transition(identity(res),z.string().uuid().parse(req.params.id),status))});
  });
  router.patch('/orders/:id/payment',async(req,res)=>{
    const {paymentStatus}=z.object({paymentStatus:z.enum(['PAID','REFUNDED'])}).strict().parse(req.body);
    res.json({data:safeOrder(await orders.payment(identity(res),z.string().uuid().parse(req.params.id),paymentStatus))});
  });
  router.get('/audit',async(req,res)=>{
    const {page,limit}=query.parse(req.query);
    const [data,total]=await db.$transaction([db.auditLog.findMany({take:limit,skip:(page-1)*limit,orderBy:[{createdAt:'desc'},{id:'asc'}],include:{actor:{select:{email:true}}}}),db.auditLog.count()]);
    res.json({data,meta:{page,limit,total,totalPages:Math.ceil(total/limit)}});
  });
  router.get('/:entity',async(req,res)=>{
    const entity=entityInput.parse(req.params.entity),{page,limit,q}=query.parse(req.query);
    const args={take:limit,skip:(page-1)*limit,orderBy:{id:'asc' as const}};
    const contains={contains:q,mode:'insensitive' as const};
    let data: unknown[], total:number;
    switch(entity) {
      case 'categories': [data,total]=await db.$transaction([db.category.findMany({...args,where:{name:contains}}),db.category.count({where:{name:contains}})]);break;
      case 'products': [data,total]=await db.$transaction([db.product.findMany({...args,where:{name:contains}}),db.product.count({where:{name:contains}})]);break;
      case 'variants': [data,total]=await db.$transaction([db.productVariant.findMany({...args,where:{sku:contains}}),db.productVariant.count({where:{sku:contains}})]);break;
      case 'images': [data,total]=await db.$transaction([db.productImage.findMany({...args,where:{alt:contains}}),db.productImage.count({where:{alt:contains}})]);break;
      case 'banners': [data,total]=await db.$transaction([db.banner.findMany({...args,where:{title:contains}}),db.banner.count({where:{title:contains}})]);break;
      case 'collections': {
        const [rows,count]=await db.$transaction([db.collection.findMany({...args,where:{name:contains},include:{products:true}}),db.collection.count({where:{name:contains}})]);
        data=rows.map(c=>({...c,productIds:c.products.map(p=>p.productId)}));total=count;break;
      }
      case 'coupons': [data,total]=await db.$transaction([db.coupon.findMany({...args,where:{code:contains}}),db.coupon.count({where:{code:contains}})]);break;
    }
    res.json({data,meta:{page,limit,total,totalPages:Math.ceil(total/limit)}});
  });
  router.post('/:entity',async(req,res)=>{
    const entity=entityInput.parse(req.params.entity);
    const result=await db.$transaction(tx=>saveEntity(tx,entity,undefined,req.body,identity(res).id));
    res.status(201).json({data:result});
  });
  router.put('/:entity/:id',async(req,res)=>{
    const entity=entityInput.parse(req.params.entity),id=z.string().uuid().parse(req.params.id);
    res.json({data:await db.$transaction(tx=>saveEntity(tx,entity,id,req.body,identity(res).id))});
  });
  router.delete('/:entity/:id',async(req,res)=>{
    const entity=entityInput.parse(req.params.entity),id=z.string().uuid().parse(req.params.id);
    await db.$transaction(tx=>removeEntity(tx,entity,id,identity(res).id));
    res.json({data:{removed:true}});
  });
  return router;
}
