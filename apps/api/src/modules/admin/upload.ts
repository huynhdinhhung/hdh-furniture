import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { RequestHandler } from 'express';
import { HttpError } from '../../errors.js';
import { identity, audit } from '../auth/security.js';
import type { PrismaClient } from '@prisma/client';
export const uploadDirectory = fileURLToPath(new URL('../../../uploads/', import.meta.url));
export function uploadImage(db: PrismaClient): RequestHandler {
  return async (req,res) => {
    const mime=req.get('Content-Type')?.split(';')[0];
    if (!['image/jpeg','image/png','image/webp'].includes(mime || '') || !Buffer.isBuffer(req.body) || !req.body.length || req.body.length > 5*1024*1024) throw new HttpError(400,'INVALID_IMAGE','Chỉ nhận ảnh JPEG, PNG hoặc WebP tối đa 5 MB.');
    let output:Buffer;
    try {
      const processor=sharp(req.body,{limitInputPixels:25000000,failOn:'error'});
      const metadata=await processor.metadata();
      const expected=mime==='image/jpeg'?'jpeg':mime?.slice(6);
      if (metadata.format!==expected || (metadata.pages || 1)>1) throw new Error();
      output=await processor.rotate().resize({width:1920,height:1920,fit:'inside',withoutEnlargement:true}).webp({quality:85}).toBuffer();
    } catch { throw new HttpError(400,'INVALID_IMAGE','Nội dung ảnh không hợp lệ, quá lớn hoặc là ảnh động.'); }
    const name=randomUUID()+'.webp';
    await mkdir(uploadDirectory,{recursive:true});
    await writeFile(join(uploadDirectory,name),output,{flag:'wx'});
    await audit(db,identity(res).id,'image-file',name,'UPLOAD',{bytes:output.length});
    res.status(201).json({data:{url:'/api/media/'+name}});
  };
}
