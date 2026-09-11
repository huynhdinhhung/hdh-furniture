'use client';
import { useEffect,useState,useCallback } from 'react';
export type User={id:string;fullName:string;email:string;role:'CUSTOMER'|'ADMIN'};
export type CartLine={id:string;variantId:string;quantity:number;name:string;slug:string;sku:string;color:string;material:string;price:string;stock:number;available:boolean;lineTotal:string;image:string|null};
export type Cart={items:CartLine[];subtotal:string;canCheckout:boolean};
export type Settings={shippingFee:string;transfer:{bank:string;account:string;holder:string}|null};
export type Order={id:string;orderNumber:string;status:string;paymentStatus:string;paymentMethod:string;subtotal:string;discount:string;shippingFee:string;total:string;couponCode:string|null;createdAt:string;shippingSnapshot:{fullName:string;phone:string;address:string};items:{id:string;productNameSnapshot:string;skuSnapshot:string;quantity:number;unitPrice:string;lineTotal:string;optionsSnapshot:{color:string;material:string}}[]};
export type Envelope<T>={data:T;meta?:{page:number;limit:number;total:number;totalPages:number}};
async function perform<T>(path:string, method='GET', data?:unknown, extra:Record<string,string>={}):Promise<Envelope<T>> {
  const response=await fetch('/api'+path,{method,headers:{...(data!==undefined?{'Content-Type':'application/json'}:{}),...(method!=='GET'?{'X-Requested-With':'HungFurniture'}:{}),...extra},...(data!==undefined?{body:JSON.stringify(data)}:{}),cache:'no-store'});
  const result=await response.json();
  if(!response.ok)throw new Error(result.error?.fields?.map((f:{message:string})=>f.message).join(' ') || result.error?.message || 'Yêu cầu thất bại.');
  if(method!=='GET' && path!=='/orders/quote')window.dispatchEvent(new Event('shop:changed'));
  return result;
}
const reads=new Map<string,Promise<Envelope<unknown>>>();
export function shop<T>(path:string,method='GET',data?:unknown,extra:Record<string,string>={}):Promise<Envelope<T>>{
 if(method!=='GET')return perform<T>(path,method,data,extra);
 const canonical=['/cart','/auth/me'].includes(path.split('?')[0])?path.split('?')[0]:path;
 let pending=reads.get(canonical);
 if(!pending){pending=perform<unknown>(canonical).finally(()=>reads.delete(canonical));reads.set(canonical,pending);}
 return pending as Promise<Envelope<T>>;
}
export function useResource<T>(path:string) {
  const [version,setVersion]=useState(0);
  const [state,setState]=useState<{path:string;version:number;value:Envelope<T>|null;error:string}>({path:'',version:-1,value:null,error:''});
  useEffect(()=>{let active=true;shop<T>(path).then(value=>{if(active)setState({path,version,value,error:''});}).catch(error=>{if(active)setState({path,version,value:null,error:String(error.message)});});return()=>{active=false;};},[path,version]);
  const reload=useCallback(()=>setVersion(v=>v+1),[]);
  const pending=state.path!==path||state.version!==version;
  return {data:pending?null:state.value?.data,meta:pending?undefined:state.value?.meta,error:pending?'':state.error,loading:pending,reload};
}
export const statusText:Record<string,string>={PENDING:'Chờ xác nhận',CONFIRMED:'Đã xác nhận',SHIPPING:'Đang giao',COMPLETED:'Đã giao',CANCELLED:'Đã hủy',UNPAID:'Chưa thanh toán',PAID:'Đã thanh toán',REFUNDED:'Đã hoàn tiền',COD:'Thanh toán khi nhận hàng',BANK_TRANSFER:'Chuyển khoản'};
