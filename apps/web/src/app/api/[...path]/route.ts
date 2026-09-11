import type { NextRequest } from 'next/server';
export const dynamic='force-dynamic';
async function proxy(request: NextRequest, context: {params:Promise<{path:string[]}>}) {
  const {path}=await context.params;
  if (!path.length || path.some(p=>!/^[a-zA-Z0-9_.-]+$/.test(p) || p==='..') || !['auth','cart','orders','admin','settings','media','products','categories','home','health'].includes(path[0])) return Response.json({error:{message:'Không tìm thấy đường dẫn.'}},{status:404});
  const mutation=!['GET','HEAD'].includes(request.method);
  const origin=process.env.WEB_ORIGIN || 'http://localhost:3000';
  if (mutation && (request.headers.get('origin')!==origin || request.headers.get('x-requested-with')!=='HungFurniture')) return Response.json({error:{message:'Yêu cầu không hợp lệ.'}},{status:403});
  const headers=new Headers();
  for(const name of ['cookie','content-type','origin','x-requested-with','idempotency-key','x-expected-total']) {
    const value=request.headers.get(name); if(value)headers.set(name,value);
  }
  let body:Uint8Array|undefined;
  if(mutation && request.body) {
    const reader=request.body.getReader(), chunks:Uint8Array[]=[];let size=0;
    while(true){const value=await reader.read();if(value.done)break;size+=value.value.length;if(size>6*1024*1024){await reader.cancel();return Response.json({error:{message:'Nội dung quá lớn.'}},{status:413});}chunks.push(value.value);}
    body=new Uint8Array(size);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length;}
  }
  try {
    const upstream=await fetch((process.env.API_URL || 'http://localhost:4000')+'/api/v1/'+path.map(encodeURIComponent).join('/')+request.nextUrl.search,{method:request.method,headers,body:body as BodyInit|undefined,cache:'no-store',signal:AbortSignal.timeout(30000),redirect:'manual'});
    const resultHeaders=new Headers({'Cache-Control':'no-store','Content-Type':upstream.headers.get('content-type') || 'application/json','X-Content-Type-Options':'nosniff'});
    for(const cookie of upstream.headers.getSetCookie())resultHeaders.append('set-cookie',cookie);
    return new Response(request.method==='HEAD'||upstream.status===204?null:await upstream.arrayBuffer(),{status:upstream.status,headers:resultHeaders});
  }catch{return Response.json({error:{message:'Không kết nối được máy chủ. Vui lòng thử lại.'}},{status:503});}
}
export {proxy as GET,proxy as POST,proxy as PUT,proxy as PATCH,proxy as DELETE};
