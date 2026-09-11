'use client';
import {use,useState} from 'react';
import Link from 'next/link';
import {shop,useResource,type Order,type Settings} from '@/lib/shop';
import {OrderView} from '@/components/order-view';
export default function OrderPage({params}:{params:Promise<{id:string}>}){
 const {id}=use(params),resource=useResource<Order>('/orders/'+id),settings=useResource<Settings>('/settings');
 const [message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 async function cancel(){if(!window.confirm('Hủy đơn hàng này? Tồn kho và lượt mã giảm giá sẽ được hoàn lại.'))return;setBusy(true);try{await shop('/orders/'+id+'/cancel','POST');resource.reload();}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}
 return <section className="section commerce-page"><Link className="text-link" href="/don-hang">← Đơn hàng của tôi</Link><h1>Chi tiết đơn hàng</h1>{resource.loading?<p role="status">Đang tải đơn hàng...</p>:resource.error?<p role="alert">{resource.error}</p>:resource.data&&<><OrderView order={resource.data}/>{resource.data.paymentMethod==='BANK_TRANSFER'&&resource.data.paymentStatus==='UNPAID'&&resource.data.status!=='CANCELLED'&&settings.data?.transfer&&<div className="notice"><h2>Thông tin chuyển khoản</h2><p>{settings.data.transfer.bank} · {settings.data.transfer.account} · {settings.data.transfer.holder}</p><p>Nội dung: <strong>{resource.data.orderNumber}</strong>. Đơn chỉ được ghi nhận đã thanh toán sau khi admin kiểm tra tiền nhận.</p></div>}{['PENDING','CONFIRMED'].includes(resource.data.status)&&<button className="button danger" disabled={busy} onClick={cancel}>Hủy đơn hàng</button>}{resource.data.status==='CANCELLED'&&resource.data.paymentStatus==='PAID'&&<p>Đơn đã hủy, đang chờ cửa hàng xử lý hoàn tiền.</p>}</>}{message&&<p role="alert" className="inline-error">{message}</p>}</section>;
}
