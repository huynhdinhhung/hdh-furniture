import {test,expect} from '@playwright/test';
import {randomUUID,randomBytes} from 'node:crypto';
import {db} from '../../apps/api/src/db';
import {hashPassword,digest} from '../../apps/api/src/modules/auth/security';
const suffix=randomUUID();const password='Browser-fixture-123';
let categoryId:string,productId:string,variantId:string,adminId:string,couponId:string;
const customerEmail=suffix+'@example.test',code='E2E'+randomBytes(6).toString('hex').toUpperCase();
const slug='browser-'+suffix;const adminToken=randomBytes(32).toString('hex');
test.beforeAll(async()=>{
 if(!/^furniture_test[a-z0-9_]*$/.test(new URL(process.env.DATABASE_URL||'http://invalid/').pathname.slice(1)))throw new Error('Commerce E2E requires DATABASE_URL pointing to dedicated furniture_test_* database');
 categoryId=(await db.category.create({data:{name:'Browser fixture '+suffix,slug}})).id;
 const product=await db.product.create({data:{name:'Ghế kiểm thử '+suffix,slug,description:'Dữ liệu giả chỉ dùng kiểm thử trình duyệt.',categoryId,variants:{create:{sku:'SKU-'+suffix,color:'Kem',material:'Vải',price:'100000',stock:5,widthMm:100,depthMm:100,heightMm:100}}},include:{variants:true}});productId=product.id;variantId=product.variants[0].id;
 adminId=(await db.user.create({data:{email:'admin-'+customerEmail,fullName:'Browser admin',passwordHash:await hashPassword(password),role:'ADMIN'}})).id;
 await db.session.create({data:{userId:adminId,tokenHash:digest(adminToken),expiresAt:new Date(Date.now()+3600000)}});
 couponId=(await db.coupon.create({data:{code,kind:'PERCENT',value:'10',minSubtotal:'0',startsAt:new Date(Date.now()-60000),expiresAt:new Date(Date.now()+3600000),usageLimit:10}})).id;
});
test.afterAll(async()=>{
 const users=await db.user.findMany({where:{email:{in:[customerEmail,'admin-'+customerEmail]}},select:{id:true}});const ids=users.map(u=>u.id);
 await db.auditLog.deleteMany({where:{actorId:{in:ids}}});if(variantId){await db.inventoryMovement.deleteMany({where:{variantId}});await db.cartItem.deleteMany({where:{variantId}});}
 await db.orderItem.deleteMany({where:{order:{userId:{in:ids}}}});await db.order.deleteMany({where:{userId:{in:ids}}});await db.cart.deleteMany({where:{userId:{in:ids}}});await db.session.deleteMany({where:{userId:{in:ids}}});await db.user.deleteMany({where:{id:{in:ids}}});
 if(couponId)await db.coupon.delete({where:{id:couponId}});if(variantId)await db.productVariant.delete({where:{id:variantId}});if(productId)await db.product.delete({where:{id:productId}});if(categoryId)await db.category.delete({where:{id:categoryId}});await db.$disconnect();
});
test('guest cart → register → dated coupon → COD order → history → cancel',async({page},testInfo)=>{
 await page.goto('/san-pham/'+slug);await page.getByRole('button',{name:'Thêm vào giỏ hàng',exact:true}).click();await expect(page.getByRole('status')).toContainText('Đã thêm sản phẩm');
 await page.getByRole('link',{name:'Xem giỏ hàng'}).click();await page.getByRole('link',{name:'Đăng nhập để đặt hàng'}).click();await page.getByRole('button',{name:'Chưa có tài khoản? Đăng ký'}).click();
 await page.getByLabel('Họ và tên',{exact:true}).fill('Khách kiểm thử');await page.getByLabel('Email',{exact:true}).fill(customerEmail);await page.getByLabel('Mật khẩu',{exact:true}).fill(password);await page.getByRole('button',{name:'Đăng ký',exact:true}).click();
 await expect(page).toHaveURL(/gio-hang/);await page.getByRole('link',{name:'Tiến hành đặt hàng'}).click();await page.getByLabel('Số điện thoại').fill('0900000000');await page.getByLabel('Địa chỉ giao hàng').fill('123 Đường kiểm thử, Thành phố mẫu');await page.getByLabel('Mã giảm giá (nếu có)').fill(code);
 await page.getByRole('button',{name:'Áp dụng & Kiểm tra'}).click();await expect(page.getByLabel('Tổng thanh toán',{exact:true})).toContainText('140.000');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:testInfo.outputPath('checkout.png'),fullPage:true});
 await page.getByRole('button',{name:'Xác nhận đặt hàng'}).click();await expect(page).toHaveURL(/don-hang\/[a-f0-9-]+/);await expect(page.locator('.order-view')).toContainText('Chưa thanh toán');
 await page.goto('/don-hang');await expect(page.getByRole('main')).toContainText('HF-');await page.getByRole('main').getByRole('link',{name:/HF-/}).click();
 page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Hủy đơn hàng'}).click();await expect(page.locator('.order-badge')).toHaveText('Đã hủy');expect((await db.productVariant.findUniqueOrThrow({where:{id:variantId}})).stock).toBe(5);
 await page.goto('/admin');await expect(page.getByRole('main')).toContainText('Bạn cần tài khoản quản trị');
});
test('admin edits inventory and dated coupon through forms and sees audit',async({page,baseURL},testInfo)=>{
 await page.context().addCookies([{name:'hf_session',value:adminToken,url:baseURL!,httpOnly:true,sameSite:'Lax'}]);await page.goto('/admin');await expect(page.getByRole('heading',{name:'Quản trị hệ thống HDH'})).toBeVisible();
 await page.getByRole('button',{name:'Biến thể / tồn kho',exact:true}).click();await page.getByRole('textbox',{name:'Tìm kiếm',exact:true}).fill('SKU-'+suffix);await page.getByRole('button',{name:'Sửa',exact:true}).click();await page.getByLabel('Tồn kho',{exact:true}).fill('7');await page.getByRole('button',{name:'Lưu',exact:true}).click();await expect(page.getByRole('cell',{name:/Tồn: 7/})).toBeVisible();
 await page.getByRole('button',{name:'Mã giảm giá',exact:true}).click();await page.getByRole('textbox',{name:'Tìm kiếm',exact:true}).fill(code);await page.getByRole('button',{name:'Sửa',exact:true}).click();await page.getByLabel('Giá trị (% hoặc VND)',{exact:true}).fill('15');await page.getByRole('button',{name:'Lưu',exact:true}).click();await expect(page.locator('.admin-editor')).toHaveCount(0);expect((await db.coupon.findUniqueOrThrow({where:{id:couponId}})).value.toFixed(0)).toBe('15');
 await page.getByRole('button',{name:'Nhật ký',exact:true}).click();await expect(page.getByRole('table')).toContainText('PRICE_STOCK');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:testInfo.outputPath('admin.png'),fullPage:true});
});
