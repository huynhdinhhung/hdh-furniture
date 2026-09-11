import {randomUUID,randomBytes} from 'node:crypto';
import {unlink} from 'node:fs/promises';
import {join} from 'node:path';
import {beforeAll,afterAll,it,expect} from 'vitest';
import request from 'supertest';
import sharp from 'sharp';
import {db} from '../../apps/api/src/db.js';
import {createApp} from '../../apps/api/src/app.js';
import {createOrderService} from '../../apps/api/src/modules/orders/service.js';
import {digest,hashPassword} from '../../apps/api/src/modules/auth/security.js';
import {uploadDirectory} from '../../apps/api/src/modules/admin/upload.js';
import type {Checkout} from '../../apps/api/src/modules/orders/validation.js';
const app=createApp(db,'http://localhost:3000',{shippingFee:'50000',transfer:null});
const service=createOrderService(db,{shippingFee:'50000',transfer:null});
const headers={Origin:'http://localhost:3000','X-Requested-With':'HungFurniture'};
const suffix=randomUUID();const users:string[]=[],variantIds:string[]=[],couponIds:string[]=[],guestHashes:string[]=[],uploads:string[]=[];
const extraProducts:string[]=[];
let categoryId:string,productId:string,adminCookie:string,customerCookie:string;
const base:Omit<Checkout,'items'>={shipping:{fullName:'Fixture customer',phone:'0900000000',address:'123 Fixture Street, Test City'},paymentMethod:'COD'};
const payload=(id:string,quantity=1):Checkout=>({...base,items:[{variantId:id,quantity}]});
async function variant(stock=5){const v=await db.productVariant.create({data:{productId,sku:randomUUID(),color:'Kem',material:'Vải',price:'100000',stock,widthMm:100,depthMm:100,heightMm:100}});variantIds.push(v.id);return v.id;}
async function coupon(overrides:Record<string,unknown>={}){const c=await db.coupon.create({data:{code:'T'+randomBytes(8).toString('hex').toUpperCase(),kind:'PERCENT',value:'10',minSubtotal:'0',startsAt:new Date(Date.now()-60000),expiresAt:new Date(Date.now()+600000),usageLimit:1,...overrides}});couponIds.push(c.id);return c;}
beforeAll(async()=>{
 if(!/^furniture_test[a-z0-9_]*$/.test(new URL(process.env.DATABASE_URL!).pathname.slice(1)))throw new Error('Dedicated test DB required');
 categoryId=(await db.category.create({data:{name:'Commerce '+suffix,slug:'commerce-'+suffix}})).id;
 productId=(await db.product.create({data:{categoryId,name:'Commerce fixture',slug:'commerce-'+suffix,description:'Fake test fixture'}})).id;
 const passwordHash=await hashPassword('Fixture-password-123');
 for(let i=0;i<3;i++){const u=await db.user.create({data:{email:suffix+'-'+i+'@example.test',fullName:'Fixture '+i,passwordHash,role:i===0?'ADMIN':'CUSTOMER'}});users.push(u.id);const token=randomBytes(32).toString('hex');await db.session.create({data:{userId:u.id,tokenHash:digest(token),expiresAt:new Date(Date.now()+3600000)}});if(i===0)adminCookie='hf_session='+token;if(i===1)customerCookie='hf_session='+token;}
});
afterAll(async()=>{
 await db.auditLog.deleteMany({where:{actorId:{in:users}}});
 await db.inventoryMovement.deleteMany({where:{variantId:{in:variantIds}}});
 await db.orderItem.deleteMany({where:{order:{userId:{in:users}}}});
 await db.order.deleteMany({where:{userId:{in:users}}});
 await db.cart.deleteMany({where:{OR:[{userId:{in:users}},{guestTokenHash:{in:guestHashes}}]}});
 await db.session.deleteMany({where:{userId:{in:users}}});
 await db.user.deleteMany({where:{id:{in:users}}});
 await db.coupon.deleteMany({where:{id:{in:couponIds}}});
 await db.productVariant.deleteMany({where:{id:{in:variantIds}}});
 if(productId)await db.product.deleteMany({where:{id:{in:[productId,...extraProducts]}}});
 if(categoryId)await db.category.delete({where:{id:categoryId}});
 for(const file of uploads)await unlink(join(uploadDirectory,file));
 await db.$disconnect();
});
it('rejects CSRF and client-supplied role, enforces admin on every management route',async()=>{
 expect((await request(app).post('/api/v1/auth/register').send({})).status).toBe(403);
 expect((await request(app).post('/api/v1/auth/register').set(headers).send({email:'bad@example.test',password:'Fake-password-123',fullName:'Fake user',role:'ADMIN'})).status).toBe(400);
 for(const path of ['products','orders','audit','coupons']){
 expect((await request(app).get('/api/v1/admin/'+path)).status).toBe(401);
 expect((await request(app).get('/api/v1/admin/'+path).set('Cookie',customerCookie)).status).toBe(403);
 }
 expect((await request(app).post('/api/v1/admin/products').set(headers).set('Cookie',customerCookie).send({})).status).toBe(403);
});
it('merges guest cart on registration, uses hashed session/password and revokes logout session',async()=>{
 const agent=request.agent(app),id=await variant();
 const cart=await agent.get('/api/v1/cart');const cookie=String(cart.headers['set-cookie'][0]).split(';')[0];guestHashes.push(digest(cookie.split('=')[1]));
 expect((await agent.post('/api/v1/cart/items').set(headers).send({variantId:id,quantity:2})).status).toBe(200);
 const email=suffix+'-register@example.test';
 const registration=await agent.post('/api/v1/auth/register').set(headers).send({email,password:'Fixture-password-123',fullName:'Fixture customer'});
 expect(registration.status).toBe(201);users.push(registration.body.data.id);
 expect(registration.body.data.role).toBe('CUSTOMER');expect(registration.body.data.passwordHash).toBeUndefined();
 const sessionCookie=registration.headers['set-cookie'].find((c:string)=>c.startsWith('hf_session='));expect(sessionCookie).toContain('HttpOnly');expect(sessionCookie).toContain('SameSite=Lax');
 const stored=await db.user.findUniqueOrThrow({where:{email}});expect(stored.passwordHash).toMatch(/^scrypt:/);expect(stored.passwordHash).not.toContain('Fixture-password');
 expect((await agent.get('/api/v1/cart')).body.data.items[0].quantity).toBe(2);
 expect((await request(app).get('/api/v1/cart').set('Cookie',customerCookie)).body.data.items).toHaveLength(0);
 expect((await agent.post('/api/v1/auth/logout').set(headers)).status).toBe(200);
 expect((await request(app).get('/api/v1/auth/me').set('Cookie',sessionCookie.split(';')[0])).body.data).toBeNull();
 expect((await agent.post('/api/v1/auth/login').set(headers).send({email,password:'incorrect'})).status).toBe(401);
 expect((await agent.post('/api/v1/auth/login').set(headers).send({email,password:'Fixture-password-123'})).status).toBe(200);
});
it('validates quantities and stock without trusting client prices',async()=>{
 const id=await variant(1);
 for(const body of [{variantId:id,quantity:0},{variantId:id,quantity:1,price:'1'}])expect((await request(app).post('/api/v1/cart/items').set(headers).set('Cookie',customerCookie).send(body)).status).toBe(400);
 expect((await request(app).post('/api/v1/cart/items').set(headers).set('Cookie',customerCookie).send({variantId:id,quantity:2})).status).toBe(409);
});
it('prevents overselling the last unit across two customers',async()=>{
 const id=await variant(1),input=payload(id);
 const results=await Promise.allSettled([service.create(users[1],randomUUID(),input,'150000'),service.create(users[2],randomUUID(),input,'150000')]);
 expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect(results.filter(r=>r.status==='rejected')).toHaveLength(1);
 expect((await db.productVariant.findUniqueOrThrow({where:{id}})).stock).toBe(0);
 expect(await db.inventoryMovement.count({where:{variantId:id,reason:'SALE'}})).toBe(1);
});
it('serializes the last coupon use and rolls back the losing order stock',async()=>{
 const a=await variant(1),b=await variant(1),c=await coupon();
 const results=await Promise.allSettled([service.create(users[1],randomUUID(),{...payload(a),couponCode:c.code},'140000'),service.create(users[2],randomUUID(),{...payload(b),couponCode:c.code},'140000')]);
 expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
 expect((await db.coupon.findUniqueOrThrow({where:{id:c.id}})).usedCount).toBe(1);
 expect((await db.productVariant.findMany({where:{id:{in:[a,b]}}})).reduce((n,v)=>n+v.stock,0)).toBe(1);
});
it('replays one idempotent order, rejects changed input, and restores inventory/coupon only once',async()=>{
 const id=await variant(3),c=await coupon(),input={...payload(id,2),couponCode:c.code},key=randomUUID();
 const [a,b]=await Promise.all([service.create(users[1],key,input,'230000'),service.create(users[1],key,input,'230000')]);expect(a.id).toBe(b.id);
 await expect(service.create(users[1],key,{...input,shipping:{...base.shipping,address:'Changed address 123'}},'230000')).rejects.toMatchObject({code:'IDEMPOTENCY_CONFLICT'});
 const actor={id:users[1],role:'CUSTOMER' as const,email:'fixture@example.test',fullName:'Fixture'};
 await Promise.all([service.transition(actor,a.id,'CANCELLED'),service.transition(actor,a.id,'CANCELLED')]);
 expect((await db.productVariant.findUniqueOrThrow({where:{id}})).stock).toBe(3);
 expect((await db.coupon.findUniqueOrThrow({where:{id:c.id}})).usedCount).toBe(0);
 expect(await db.inventoryMovement.count({where:{orderId:a.id,reason:'RETURN'}})).toBe(1);
});
it('rejects expired/future coupons, unconfigured transfer and price changes without reserving stock',async()=>{
 const id=await variant(3),future=await coupon({startsAt:new Date(Date.now()+60000)}),expired=await coupon({startsAt:new Date(Date.now()-120000),expiresAt:new Date(Date.now()-60000)});
 for(const c of [future,expired])await expect(service.quote({...payload(id),couponCode:c.code})).rejects.toMatchObject({code:'COUPON_INVALID'});
 await expect(service.create(users[1],randomUUID(),payload(id),'1')).rejects.toMatchObject({code:'PRICE_CHANGED'});
 await expect(service.quote({...payload(id),paymentMethod:'BANK_TRANSFER'})).rejects.toMatchObject({code:'TRANSFER_UNAVAILABLE'});
 expect((await db.productVariant.findUniqueOrThrow({where:{id}})).stock).toBe(3);
});
it('enforces order ownership, immutable snapshots and payment/status transitions',async()=>{
 const id=await variant(),order=await service.create(users[2],randomUUID(),payload(id),'150000');
 expect((await request(app).get('/api/v1/orders/'+order.id).set('Cookie',customerCookie)).status).toBe(404);
 expect((await request(app).post('/api/v1/orders/'+order.id+'/cancel').set(headers).set('Cookie',customerCookie)).status).toBe(404);
 await db.productVariant.update({where:{id},data:{price:'200000'}});
 expect((await db.order.findUniqueOrThrow({where:{id:order.id},include:{items:true}})).items[0].unitPrice.toFixed(0)).toBe('100000');
 expect((await request(app).patch('/api/v1/admin/orders/'+order.id+'/status').set(headers).set('Cookie',adminCookie).send({status:'COMPLETED'})).status).toBe(409);
 for(const [path,body] of [['payment',{paymentStatus:'PAID'}],['status',{status:'CANCELLED'}],['payment',{paymentStatus:'REFUNDED'}]] as const)expect((await request(app).patch('/api/v1/admin/orders/'+order.id+'/'+path).set(headers).set('Cookie',adminCookie).send(body)).status).toBe(200);
 const list=await request(app).get('/api/v1/admin/orders').set('Cookie',adminCookie);expect(list.status).toBe(200);expect(list.body.data[0].requestHash).toBeUndefined();expect(list.body.data[0].idempotencyKey).toBeUndefined();
});
it('requires idempotency/total acknowledgement and rejects client total in payload',async()=>{
 const id=await variant();
 expect((await request(app).post('/api/v1/orders').set(headers).set('Cookie',customerCookie).send(payload(id))).status).toBe(400);
 expect((await request(app).post('/api/v1/orders').set(headers).set('Cookie',customerCookie).set('Idempotency-Key',randomUUID()).set('X-Expected-Total','150000').send({...payload(id),total:'1'})).status).toBe(400);
});
it('supports complete delivery lifecycle and configured bank transfer without auto-marking paid',async()=>{
 const id=await variant();
 const bankService=createOrderService(db,{shippingFee:'50000',transfer:{bank:'Fixture bank',account:'TEST-ONLY',holder:'Fixture recipient'}});
 const order=await bankService.create(users[2],randomUUID(),{...payload(id),paymentMethod:'BANK_TRANSFER'},'150000');expect(order.paymentStatus).toBe('UNPAID');
 const actor={id:users[0],role:'ADMIN' as const,email:'fixture@example.test',fullName:'Admin'};
 for(const status of ['CONFIRMED','SHIPPING','COMPLETED'] as const)expect((await service.transition(actor,order.id,status)).status).toBe(status);
 await expect(service.transition(actor,order.id,'CANCELLED')).rejects.toMatchObject({code:'INVALID_TRANSITION'});
 expect((await db.productVariant.findUniqueOrThrow({where:{id}})).stock).toBe(4);
});
it('round-trips admin catalog, images, banners, collections and coupons',async()=>{
 async function create(entity:string,body:unknown){const r=await request(app).post('/api/v1/admin/'+entity).set(headers).set('Cookie',adminCookie).send(body);expect(r.status).toBe(201);return r.body.data;}
 async function remove(entity:string,id:string){expect((await request(app).delete('/api/v1/admin/'+entity+'/'+id).set(headers).set('Cookie',adminCookie)).status).toBe(200);}
 const category=await create('categories',{name:'Admin fixture',slug:'admin-'+suffix,parentId:null});
 expect((await request(app).put('/api/v1/admin/categories/'+category.id).set(headers).set('Cookie',adminCookie).send({name:'Updated fixture',slug:'admin-'+suffix,parentId:null})).status).toBe(200);await remove('categories',category.id);
 const product=await create('products',{name:'Admin product fixture',slug:'admin-'+suffix,description:'Fixture only',categoryId,isActive:true});extraProducts.push(product.id);
 await remove('products',product.id);expect((await request(app).get('/api/v1/products/'+product.slug)).status).toBe(404);
 const image=await create('images',{productId,variantId:null,url:'https://example.com/fixture.jpg',alt:'Fixture image',sortOrder:0});await remove('images',image.id);
 const collection=await create('collections',{name:'Fixture collection',slug:'admin-'+suffix,description:'Fixture only',imageUrl:'https://example.com/fixture.jpg',productIds:[productId]});
 expect(await db.collectionProduct.count({where:{collectionId:collection.id}})).toBe(1);await remove('collections',collection.id);expect(await db.collectionProduct.count({where:{collectionId:collection.id}})).toBe(0);
 const banner=await create('banners',{title:'Fixture banner',imageUrl:'https://example.com/fixture.jpg',targetUrl:'/san-pham',sortOrder:0,isActive:true});await remove('banners',banner.id);expect((await db.banner.findUniqueOrThrow({where:{id:banner.id}})).isActive).toBe(false);await db.banner.delete({where:{id:banner.id}});
 const c=await create('coupons',{code:'ADMIN'+randomBytes(6).toString('hex'),kind:'FIXED',value:'10000',maxDiscount:null,minSubtotal:'0',startsAt:new Date(Date.now()-60000).toISOString(),expiresAt:new Date(Date.now()+600000).toISOString(),usageLimit:1,isActive:true});couponIds.push(c.id);await remove('coupons',c.id);expect((await db.coupon.findUniqueOrThrow({where:{id:c.id}})).isActive).toBe(false);
});
it('audits admin updates, validates coupon limits, and verifies uploaded image contents',async()=>{
 const id=await variant(),v=await db.productVariant.findUniqueOrThrow({where:{id}});
 const update={productId,sku:v.sku,color:v.color,material:v.material,widthMm:v.widthMm,depthMm:v.depthMm,heightMm:v.heightMm,price:'120000',stock:9,isActive:true};
 expect((await request(app).put('/api/v1/admin/variants/'+id).set(headers).set('Cookie',adminCookie).send(update)).status).toBe(200);
 const audits=await db.auditLog.findMany({where:{entityId:id,actorId:users[0]}});expect(audits.map(a=>a.action).sort()).toEqual(['PRICE_STOCK','UPDATE']);expect((await db.inventoryMovement.findFirstOrThrow({where:{variantId:id,reason:'ADJUSTMENT'}})).delta).toBe(4);
 expect((await request(app).post('/api/v1/admin/upload').set(headers).set('Cookie',customerCookie).set('Content-Type','image/png').send(Buffer.from('fake'))).status).toBe(403);
 expect((await request(app).post('/api/v1/admin/upload').set(headers).set('Cookie',adminCookie).set('Content-Type','image/png').send(Buffer.from('<script>fake image</script>'))).status).toBe(400);
 const png=await sharp({create:{width:8,height:8,channels:3,background:'#ffffff'}}).png().toBuffer();
 const uploaded=await request(app).post('/api/v1/admin/upload').set(headers).set('Cookie',adminCookie).set('Content-Type','image/png').send(png);
 expect(uploaded.status).toBe(201);uploads.push(uploaded.body.data.url.split('/').pop());
 expect((await request(app).get(uploaded.body.data.url.replace('/api/','/api/v1/'))).status).toBe(200);
 const c=await coupon();const bad={code:c.code,kind:'PERCENT',value:'101',maxDiscount:null,minSubtotal:'0',startsAt:c.startsAt.toISOString(),expiresAt:c.expiresAt.toISOString(),usageLimit:1,isActive:true};
 expect((await request(app).put('/api/v1/admin/coupons/'+c.id).set(headers).set('Cookie',adminCookie).send(bad)).status).toBe(400);
});
