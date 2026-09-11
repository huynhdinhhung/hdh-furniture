import { z } from 'zod';
import { db } from '../../db.js';
import { audit } from './security.js';
async function run() {
  const email=z.string().trim().toLowerCase().email().parse(process.argv[2]);
  await db.$transaction(async tx=>{
    const user=await tx.user.update({where:{email},data:{role:'ADMIN'}});
    await tx.session.deleteMany({where:{userId:user.id}});
    await audit(tx,user.id,'user',user.id,'LOCAL_PROMOTE_ADMIN',{});
  });
  console.log('Đã cấp quyền ADMIN. Đăng nhập lại để sử dụng.');
}
run().catch(()=>{console.error('Không cấp được quyền. Kiểm tra email đã đăng ký và kết nối DB.');process.exitCode=1;}).finally(()=>db.$disconnect());
