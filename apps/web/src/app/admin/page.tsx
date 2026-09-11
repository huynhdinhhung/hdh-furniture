'use client';
import Link from 'next/link';
import {useState,type FormEvent} from 'react';
import {shop,useResource,statusText,type User,type Order} from '@/lib/shop';
import {OrderView} from '@/components/order-view';
import {Photo} from '@/components/photo';
import { LayoutDashboard, ShoppingBag, Package, ListTree, Tags, Image as ImageIcon, ImagePlay, TicketPercent, ActivitySquare } from 'lucide-react';

type Row={id:string;[key:string]:unknown};
type Field={key:string;label:string;type?:'number'|'boolean'|'date'|'textarea'|'image'|'reference'|'multi'|'select';reference?:string;optional?:boolean;options?:string[]};
const f=(key:string,label:string,extra:Omit<Field,'key'|'label'>={}):Field=>({key,label,...extra});
const active=f('isActive','Đang hoạt động',{type:'boolean'});
const product=f('productId','Sản phẩm',{type:'reference',reference:'products'});
const configs:Record<string,{label:string;fields:Field[]}>= {
 categories:{label:'Danh mục',fields:[f('name','Tên danh mục'),f('slug','Đường dẫn'),f('parentId','Danh mục cha',{type:'reference',reference:'categories',optional:true})]},
 products:{label:'Sản phẩm',fields:[f('name','Tên sản phẩm'),f('slug','Đường dẫn'),f('description','Mô tả',{type:'textarea'}),f('categoryId','Danh mục',{type:'reference',reference:'categories'}),active]},
 variants:{label:'Biến thể / tồn kho',fields:[product,f('sku','Mã SKU'),f('color','Màu sắc'),f('material','Chất liệu'),f('widthMm','Rộng (mm)',{type:'number'}),f('depthMm','Sâu (mm)',{type:'number'}),f('heightMm','Cao (mm)',{type:'number'}),f('price','Giá (VND)'),f('stock','Tồn kho',{type:'number'}),active]},
 images:{label:'Ảnh sản phẩm',fields:[product,f('variantId','Biến thể (để trống: ảnh chung)',{type:'reference',reference:'variants',optional:true}),f('url','Ảnh',{type:'image'}),f('alt','Mô tả ảnh'),f('sortOrder','Thứ tự',{type:'number'})]},
 banners:{label:'Banner',fields:[f('title','Tiêu đề'),f('imageUrl','Ảnh',{type:'image'}),f('targetUrl','Liên kết (bắt đầu /san-pham)'),f('sortOrder','Thứ tự',{type:'number'}),active]},
 collections:{label:'Bộ sưu tập',fields:[f('name','Tên bộ sưu tập'),f('slug','Đường dẫn'),f('description','Mô tả',{type:'textarea'}),f('imageUrl','Ảnh',{type:'image'}),f('productIds','Sản phẩm trong bộ sưu tập',{type:'multi',reference:'products'})]},
 coupons:{label:'Mã giảm giá',fields:[f('code','Mã giảm giá'),f('kind','Kiểu giảm',{type:'select',options:['PERCENT','FIXED']}),f('value','Giá trị (% hoặc VND)'),f('maxDiscount','Giảm tối đa (VND)',{optional:true}),f('minSubtotal','Tiền hàng tối thiểu (VND)'),f('startsAt','Bắt đầu (giờ địa phương)',{type:'date'}),f('expiresAt','Kết thúc (giờ địa phương)',{type:'date'}),f('usageLimit','Số lượt tối đa',{type:'number',optional:true}),active]},
};
function label(row:Row){return String(row.name||row.sku||row.code||row.title||row.alt||row.id);}
function Reference({field,value,onChange}:{field:Field;value:unknown;onChange:(value:unknown)=>void}){
 const [q,setQ]=useState('');const rows=useResource<Row[]>('/admin/'+field.reference+'?limit=100&q='+encodeURIComponent(q));
 const selected=Array.isArray(value)?value as string[]:value?[String(value)]:[];
 return <div><input aria-label={'Tìm '+field.label} placeholder="Tìm theo tên hoặc SKU" value={q} onChange={e=>setQ(e.target.value)}/><select aria-label={field.label} multiple={field.type==='multi'} required={!field.optional&&field.type!=='multi'} value={field.type==='multi'?selected:String(value||'')} onChange={e=>onChange(field.type==='multi'?[...e.target.selectedOptions].map(o=>o.value):e.target.value)}>{field.type!=='multi'&&<option value="">— Chọn —</option>}{selected.filter(id=>!rows.data?.some(r=>r.id===id)).map(id=><option key={id} value={id}>{id}</option>)}{rows.data?.map(row=><option key={row.id} value={row.id}>{label(row)}</option>)}</select>{rows.error&&<small role="alert">{rows.error}</small>}{field.type==='multi'&&<small>Giữ Ctrl để chọn nhiều sản phẩm. Tối đa 100 kết quả mỗi lần tìm.</small>}</div>;
}
function Editor({entity,row,done,cancel}:{entity:string;row:Row|null;done:()=>void;cancel:()=>void}){
 const config=configs[entity];
 const [values,setValues]=useState<Record<string,unknown>>(()=>Object.fromEntries(config.fields.map(field=>{let v=row?.[field.key]??(field.type==='boolean'?true:field.type==='multi'?[]:field.key==='kind'?'PERCENT':field.key==='sortOrder'||field.key==='minSubtotal'?'0':'');if(field.type==='date'&&v){const d=new Date(String(v));v=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);}return[field.key,v];})));
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const change=(key:string,value:unknown)=>setValues(v=>({...v,[key]:value}));
 async function upload(key:string,file:File|undefined){if(!file)return;setBusy(true);setError('');try{const response=await fetch('/api/admin/upload',{method:'POST',headers:{'Content-Type':file.type,'X-Requested-With':'HungFurniture'},body:file});const result=await response.json();if(!response.ok)throw new Error(result.error?.message||'Không tải được ảnh.');change(key,result.data.url);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function save(e:FormEvent){e.preventDefault();setBusy(true);setError('');try{const body=Object.fromEntries(config.fields.map(field=>{const v=values[field.key];return[field.key,field.optional&&(v===''||v===undefined)?null:field.type==='number'?Number(v):field.type==='date'?new Date(String(v)).toISOString():v];}));await shop('/admin/'+entity+(row?'/'+row.id:''),row?'PUT':'POST',body);done();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <section className="admin-editor"><h2>{row?'Chỉnh sửa':'Thêm'} {config.label.toLowerCase()}</h2>{error&&<p role="alert" className="inline-error">{error}</p>}<form className="shop-form admin-form" onSubmit={save}>{config.fields.map(field=><div className="form-field" key={field.key}><label htmlFor={'edit-'+field.key}>{field.label}{field.optional?' (không bắt buộc)':''}</label>{field.type==='reference'||field.type==='multi'?<Reference field={field} value={values[field.key]} onChange={v=>change(field.key,v)}/>:field.type==='boolean'?<input id={'edit-'+field.key} type="checkbox" checked={Boolean(values[field.key])} onChange={e=>change(field.key,e.target.checked)}/>:field.type==='textarea'?<textarea id={'edit-'+field.key} required rows={5} value={String(values[field.key])} onChange={e=>change(field.key,e.target.value)}/>:field.type==='select'?<select id={'edit-'+field.key} value={String(values[field.key])} onChange={e=>change(field.key,e.target.value)}>{field.options?.map(o=><option key={o} value={o}>{o==='PERCENT'?'Phần trăm':'Số tiền cố định'}</option>)}</select>:<><input id={'edit-'+field.key} type={field.type==='date'?'datetime-local':field.type==='number'?'number':'text'} required={!field.optional} min={field.type==='number'?0:undefined} step={field.type==='number'?1:undefined} value={String(values[field.key]??'')} onChange={e=>change(field.key,e.target.value)}/>{field.type==='image'&&<label className="upload-label">Tải ảnh JPEG, PNG hoặc WebP (tối đa 5 MB)<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>void upload(field.key,e.target.files?.[0])}/></label>}</>}</div>)}<div className="actions"><button className="button" disabled={busy}>{busy?'Đang xử lý…':'Lưu'}</button><button type="button" onClick={cancel} disabled={busy}>Đóng</button></div></form></section>;
}
function Entities({entity}:{entity:string}){
 const [page,setPage]=useState(1),[q,setQ]=useState(''),[editor,setEditor]=useState<Row|null|undefined>(undefined),[error,setError]=useState('');
 const rows=useResource<Row[]>('/admin/'+entity+'?page='+page+'&q='+encodeURIComponent(q));
 async function remove(row:Row){const soft=['products','variants','coupons','banners'].includes(entity);if(!window.confirm((soft?'Ngừng hoạt động ':'Xóa ')+label(row)+'?'))return;try{await shop('/admin/'+entity+'/'+row.id,'DELETE');rows.reload();setError('');}catch(e){setError((e as Error).message);}}
 return <><div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-serif">{configs[entity].label}</h2><button className="bg-forest text-white px-4 py-2 rounded-lg text-sm hover:bg-forest/90 transition-colors" onClick={()=>setEditor(null)}>Thêm mới</button></div><div className="mb-6"><label htmlFor="admin-search" className="text-sm text-gray-500 mb-1 block">Tìm kiếm</label><input id="admin-search" className="w-full md:w-80 border border-line px-3 py-2 rounded-lg focus:outline-none focus:border-wood" value={q} onChange={e=>{setQ(e.target.value);setPage(1);}}/></div>{error&&<p role="alert" className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">{error}</p>}{editor!==undefined&&<Editor key={entity+(editor?.id||'new')} entity={entity} row={editor} cancel={()=>setEditor(undefined)} done={()=>{setEditor(undefined);rows.reload();}}/>}{rows.loading?<div className="py-10 flex justify-center"><div className="w-8 h-8 border-4 border-line border-t-wood rounded-full animate-spin"></div></div>:rows.error?<p role="alert" className="bg-red-50 text-red-600 p-4 rounded-lg">{rows.error}</p>:<div className="overflow-x-auto"><table className="w-full text-left border-collapse min-w-[600px]"><thead className="bg-paper/50 text-sm"><tr className="border-b border-line"><th className="py-3 px-4 font-medium text-gray-700 w-1/3">Tên / mã</th><th className="py-3 px-4 font-medium text-gray-700">Thông tin</th><th className="py-3 px-4 font-medium text-gray-700 w-24 text-right">Thao tác</th></tr></thead><tbody className="text-sm divide-y divide-line">{rows.data?.map(row=><tr key={row.id} className="hover:bg-gray-50/50"><td className="py-3 px-4 align-middle"><span className="font-medium">{label(row)}</span></td><td className="py-3 px-4 align-middle text-gray-600 flex items-center gap-3">{row.stock!==undefined?<span>Tồn: {String(row.stock)} &middot; {String(row.price)} VND</span>:row.usedCount!==undefined?<span>Đã dùng: {String(row.usedCount)} &middot; Hạn: {new Date(String(row.expiresAt)).toLocaleString('vi-VN')}</span>:(row.url||row.imageUrl)?<div className="flex items-center gap-3"><Photo key={String(row.url||row.imageUrl)} src={String(row.url||row.imageUrl)} alt="Preview" className="w-16 h-16 object-cover rounded border border-line bg-gray-50" /><span className="truncate max-w-xs" title={String(row.url||row.imageUrl)}>{String(row.slug||row.url||row.imageUrl||'')}</span></div>:<span>{String(row.slug||'')}</span>}{row.isActive!==undefined&&<span className={`ml-3 px-2 py-0.5 rounded text-xs ${row.isActive?'bg-green-100 text-green-700':'bg-gray-100 text-gray-600'}`}>{row.isActive?'Hoạt động':'Đã ngừng'}</span>}</td><td className="py-3 px-4 align-middle text-right"><div className="flex items-center justify-end gap-2"><button className="px-3 py-1.5 border border-line rounded text-gray-600 hover:bg-gray-50 transition-colors" onClick={()=>setEditor(row)}>Sửa</button><button className="px-3 py-1.5 border border-red-200 text-red-600 rounded hover:bg-red-50 transition-colors" onClick={()=>void remove(row)}>{['products','variants','coupons','banners'].includes(entity)?'Ngừng':'Xóa'}</button></div></td></tr>)}</tbody></table>{!rows.data?.length&&<p className="py-8 text-center text-gray-500">Chưa có dữ liệu.</p>}</div>}<Pager page={page} pages={rows.meta?.totalPages||0} setPage={setPage}/></>;
}
function Pager({page,pages,setPage}:{page:number;pages:number;setPage:(n:number)=>void}){return <div className="pagination"><button disabled={page<=1} onClick={()=>setPage(page-1)}>Trang trước</button><span>{page} / {Math.max(1,pages)}</span><button disabled={page>=pages} onClick={()=>setPage(page+1)}>Trang sau</button></div>;}
function Orders(){const [page,setPage]=useState(1),[error,setError]=useState(''),[busy,setBusy]=useState(false);const rows=useResource<Order[]>('/admin/orders?page='+page);const next:Record<string,string[]>={PENDING:['CONFIRMED','CANCELLED'],CONFIRMED:['SHIPPING','CANCELLED'],SHIPPING:['COMPLETED']};async function update(order:Order,kind:string,value:string){if(!window.confirm('Xác nhận '+statusText[value].toLowerCase()+' cho '+order.orderNumber+'?'))return;setBusy(true);try{await shop('/admin/orders/'+order.id+'/'+kind,'PATCH',{[kind==='status'?'status':'paymentStatus']:value});setError('');rows.reload();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}return <><h2>Đơn hàng</h2><p>Chỉ xác nhận đã thanh toán / hoàn tiền sau khi thực tế đã nhận / trả tiền.</p>{(error||rows.error)&&<p role="alert">{error||rows.error}</p>}{rows.loading&&<p>Đang tải…</p>}{rows.data?.map(order=><section key={order.id}><OrderView order={order}/><div className="actions">{next[order.status]?.map(s=><button disabled={busy} key={s} onClick={()=>void update(order,'status',s)}>{statusText[s]}</button>)}{order.paymentStatus==='UNPAID'&&order.status!=='CANCELLED'&&<button disabled={busy} onClick={()=>void update(order,'payment','PAID')}>Xác nhận đã nhận tiền</button>}{order.paymentStatus==='PAID'&&order.status==='CANCELLED'&&<button disabled={busy} onClick={()=>void update(order,'payment','REFUNDED')}>Xác nhận đã hoàn tiền</button>}</div></section>)}{rows.data?.length===0&&<p>Chưa có đơn hàng.</p>}<Pager page={page} pages={rows.meta?.totalPages||0} setPage={setPage}/></>;}
function Audit(){const [page,setPage]=useState(1);const rows=useResource<(Row&{actor:{email:string}|null})[]>('/admin/audit?page='+page);return <><h2>Nhật ký thay đổi</h2>{rows.error&&<p role="alert">{rows.error}</p>}<div className="table-scroll"><table><thead><tr><th>Thời gian</th><th>Người thực hiện</th><th>Hành động</th><th>Chi tiết</th></tr></thead><tbody>{rows.data?.map(row=><tr key={row.id}><td>{new Date(String(row.createdAt)).toLocaleString('vi-VN')}</td><td>{row.actor?.email||'Hệ thống'}</td><td>{String(row.entityType)} · {String(row.action)}</td><td><code>{JSON.stringify(row.safeMetadata)}</code></td></tr>)}</tbody></table></div><Pager page={page} pages={rows.meta?.totalPages||0} setPage={setPage}/></>;}

const icons: Record<string, React.ReactNode> = {
  orders: <ShoppingBag size={18} />,
  categories: <ListTree size={18} />,
  products: <Package size={18} />,
  variants: <Tags size={18} />,
  images: <ImageIcon size={18} />,
  banners: <ImagePlay size={18} />,
  collections: <LayoutDashboard size={18} />,
  coupons: <TicketPercent size={18} />,
  audit: <ActivitySquare size={18} />
};

export default function Admin(){
  const me=useResource<User|null>('/auth/me');
  const [tab,setTab]=useState('orders');
  
  if(me.loading)return <section className="min-h-screen flex justify-center pt-20"><div className="w-10 h-10 border-4 border-line border-t-wood rounded-full animate-spin"></div></section>;
  if(me.data?.role!=='ADMIN')return <section className="min-h-[60vh] flex flex-col items-center justify-center text-center p-5"><div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">⚠️ Khu vực hạn chế</div><h1 className="text-2xl font-serif mb-2">Truy cập bị từ chối</h1><p className="text-gray-500 mb-6">Bạn cần tài khoản quản trị viên để truy cập trang này.</p><Link className="bg-wood text-white px-6 py-2.5 rounded-lg hover:bg-wood/90 transition-colors" href="/tai-khoan">Quay lại đăng nhập</Link></section>;
  
  const menuItems = [
    ['orders','Đơn hàng'],
    ...Object.entries(configs).map(([key,v])=>[key,v.label]),
    ['audit','Nhật ký']
  ];
  
  return (
    <div className="min-h-screen bg-paper/30 pb-20">
      <div className="bg-forest text-white py-8 px-5">
        <div className="max-w-[1400px] mx-auto">
          <h1 className="text-3xl font-serif">Quản trị hệ thống HDH</h1>
          <p className="text-white/70 mt-2">Xứng đáng đẳng cấp nội thất của bạn</p>
        </div>
      </div>
      
      <div className="max-w-[1400px] mx-auto px-5 mt-8 flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64 shrink-0">
          <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto pb-4 lg:pb-0 scrollbar-hide bg-white p-3 border border-line rounded-xl shadow-sm sticky top-24" aria-label="Quản trị">
            {menuItems.map(([key,name])=> (
              <button 
                key={key} 
                aria-pressed={tab===key} 
                onClick={()=>setTab(key)}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-left whitespace-nowrap transition-colors ${tab === key ? 'bg-forest/5 text-forest' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <span className={`${tab === key ? 'text-forest' : 'text-gray-400'}`}>
                  {icons[key]}
                </span>
                {name}
              </button>
            ))}
          </nav>
        </aside>
        
        <section className="min-w-0 flex-1 bg-white border border-line rounded-xl shadow-sm p-6 overflow-x-auto">
          {tab==='orders'?<Orders/>:tab==='audit'?<Audit/>:<Entities key={tab} entity={tab}/>}
        </section>
      </div>
    </div>
  );
}
