'use client';
import {useState} from 'react';
import Link from 'next/link';
import {useResource,statusText,type Order} from '@/lib/shop';
import {formatVnd} from '@/lib/api';
export default function OrdersPage(){
 const [page,setPage]=useState(1);const resource=useResource<Order[]>('/orders?page='+page+'&limit=10');
 return <section className="section commerce-page"><h1>Đơn hàng của tôi</h1>{resource.loading?<p role="status">Đang tải đơn hàng...</p>:resource.error?<div role="alert" className="notice">{resource.error}<p><Link href="/tai-khoan">Đăng nhập tài khoản</Link></p></div>:resource.data?.length?<><div className="orders-list">{resource.data.map(o=><Link className="order-list-item" href={'/don-hang/'+o.id} key={o.id}><div><strong>{o.orderNumber}</strong><p>{new Date(o.createdAt).toLocaleString('vi-VN')} · {o.items.length} sản phẩm</p></div><span>{statusText[o.status]}<br/>{formatVnd(o.total)}</span></Link>)}</div><div className="action-row"><button disabled={page===1} onClick={()=>setPage(p=>p-1)}>Trang trước</button><span>Trang {page}</span><button disabled={page>=(resource.meta?.totalPages||1)} onClick={()=>setPage(p=>p+1)}>Trang sau</button></div></>:<div className="notice"><h2>Bạn chưa có đơn hàng</h2><Link className="button" href="/san-pham">Xem sản phẩm</Link></div>}</section>;
}
