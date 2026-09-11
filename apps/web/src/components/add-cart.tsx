'use client';
import {useState} from 'react';
import Link from 'next/link';
import {shop} from '@/lib/shop';
export function AddCart({variantId,stock}:{variantId:string;stock:number}){
 const [quantity,setQuantity]=useState(1),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[success,setSuccess]=useState(false);
 async function add(){setBusy(true);setMessage('');setSuccess(false);try{await shop('/cart/items','POST',{variantId,quantity});setMessage('Đã thêm sản phẩm vào giỏ hàng.');setSuccess(true);}catch(error){setMessage((error as Error).message);}finally{setBusy(false);}}
 return <div className="add-cart"><label>Số lượng<input aria-label="Số lượng mua" type="number" min={1} max={Math.min(99,stock)||1} value={quantity} onChange={e=>setQuantity(Number(e.target.value))}/></label><button className="button" disabled={busy||stock<1||quantity<1||quantity>stock} onClick={add}>{stock<1?'Tạm hết hàng':busy?'Đang thêm...':'Thêm vào giỏ hàng'}</button>{message&&<p role="status">{message} {success&&<Link className="text-link" href="/gio-hang">Xem giỏ hàng</Link>}</p>}</div>;
}
