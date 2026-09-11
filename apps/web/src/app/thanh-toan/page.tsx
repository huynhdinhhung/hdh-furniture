'use client';
import {useState,useRef} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {shop,useResource,type Cart,type User,type Settings,type Order} from '@/lib/shop';
import {formatVnd} from '@/lib/api';
type Payload={items:{variantId:string;quantity:number}[];shipping:{fullName:string;phone:string;address:string};paymentMethod:string;couponCode?:string};
type Quote={subtotal:string;discount:string;shippingFee:string;total:string;couponCode:string|null};
export default function CheckoutPage(){
 const router=useRouter();
 const cart=useResource<Cart>('/cart'),account=useResource<User|null>('/auth/me'),settings=useResource<Settings>('/settings');
 const [quote,setQuote]=useState<Quote|null>(null),[payload,setPayload]=useState<Payload|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const key=useRef('');
 async function review(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setMessage('');const f=new FormData(event.currentTarget);
 const input:Payload={items:cart.data!.items.map(i=>({variantId:i.variantId,quantity:i.quantity})),shipping:{fullName:String(f.get('fullName')),phone:String(f.get('phone')),address:String(f.get('address'))},paymentMethod:String(f.get('paymentMethod')),...(String(f.get('couponCode')).trim()?{couponCode:String(f.get('couponCode')).trim().toUpperCase()}:{})};
 try{const result=await shop<Quote>('/orders/quote','POST',input);setPayload(input);setQuote(result.data);key.current=crypto.randomUUID();}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}
 async function place(){if(!quote||!payload)return;setBusy(true);setMessage('');try{const result=await shop<Order>('/orders','POST',payload,{'Idempotency-Key':key.current,'X-Expected-Total':quote.total});router.push('/don-hang/'+result.data.id);}catch(e){setMessage((e as Error).message+' Nếu mất kết nối, bấm xác nhận lại với cùng nội dung để tránh tạo đơn trùng.');}finally{setBusy(false);}}
  if(cart.loading||account.loading||settings.loading)return <section className="min-h-[70vh] flex items-center justify-center" role="status"><div className="animate-pulse flex flex-col items-center gap-4"><div className="w-10 h-10 border-4 border-line border-t-wood rounded-full animate-spin"></div><p className="text-gray-500">Đang chuẩn bị thanh toán...</p></div></section>;
  if(!account.data)return <section className="max-w-[800px] mx-auto py-20 px-4 text-center"><div className="bg-paper border border-line rounded-2xl p-10 flex flex-col items-center gap-6"><h1 className="text-3xl font-serif">Đăng nhập để đặt hàng</h1><p className="text-gray-500">Bạn cần có tài khoản để theo dõi đơn hàng dễ dàng hơn.</p><Link className="bg-forest text-white px-8 py-3.5 rounded-lg hover:bg-forest/90 transition-colors" href="/tai-khoan">Đăng nhập ngay</Link></div></section>;
  if(cart.error||settings.error)return <section className="max-w-[800px] mx-auto py-20 px-4"><div className="bg-red-50 text-red-700 p-6 rounded-xl text-center" role="alert">{cart.error||settings.error}</div></section>;
  if(!cart.data?.canCheckout)return <section className="max-w-[800px] mx-auto py-20 px-4 text-center"><div className="bg-paper border border-line rounded-2xl p-10 flex flex-col items-center gap-6"><h1 className="text-3xl font-serif">Giỏ hàng chưa sẵn sàng</h1><p className="text-gray-500">Một số sản phẩm trong giỏ hàng đã hết hàng hoặc thay đổi giá.</p><Link className="bg-forest text-white px-8 py-3.5 rounded-lg hover:bg-forest/90 transition-colors" href="/gio-hang">Kiểm tra giỏ hàng</Link></div></section>;
  
  return (
    <section className="max-w-[1250px] mx-auto px-5 py-12 md:py-16 min-h-[70vh]">
      <h1 className="text-3xl md:text-4xl font-serif mb-10">Thông tin đặt hàng</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 lg:gap-16 items-start">
        <form className="flex flex-col gap-6" onSubmit={review} onChange={()=>{setQuote(null);setPayload(null);key.current='';}}>
          <div className="bg-white border border-line rounded-xl p-6 md:p-8 flex flex-col gap-5 shadow-sm">
            <h2 className="font-serif text-xl mb-2">Thông tin giao hàng</h2>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Họ và tên người nhận
              <input className="px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-wood focus:ring-1 focus:ring-wood transition-shadow" name="fullName" autoComplete="name" defaultValue={account.data.fullName} minLength={2} maxLength={120} required/>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Số điện thoại
              <input className="px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-wood focus:ring-1 focus:ring-wood transition-shadow" name="phone" autoComplete="tel" type="tel" pattern="[+]?[0-9]{9,15}" required/>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Địa chỉ giao hàng
              <textarea className="px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-wood focus:ring-1 focus:ring-wood transition-shadow min-h-[100px]" name="address" autoComplete="street-address" minLength={10} maxLength={500} required/>
            </label>
          </div>

          <div className="bg-white border border-line rounded-xl p-6 md:p-8 flex flex-col gap-5 shadow-sm">
            <h2 className="font-serif text-xl mb-2">Thanh toán</h2>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Phương thức thanh toán
              <select className="px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-wood focus:ring-1 focus:ring-wood bg-transparent transition-shadow" name="paymentMethod">
                <option value="COD">Thanh toán khi nhận hàng (COD)</option>
                {settings.data?.transfer&&<option value="BANK_TRANSFER">Chuyển khoản ngân hàng</option>}
              </select>
            </label>
            {settings.data?.transfer&&<div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm leading-relaxed border border-blue-100">
              Chuyển khoản đến <strong>{settings.data.transfer.bank}</strong> · Số TK: <strong>{settings.data.transfer.account}</strong> · Chủ TK: <strong>{settings.data.transfer.holder}</strong>.<br/>
              Sau khi đặt hàng, dùng mã đơn làm nội dung chuyển khoản. Admin xác nhận khi nhận được tiền.
            </div>}
            
            <label className="flex flex-col gap-2 text-sm font-medium mt-2">
              Mã giảm giá (nếu có)
              <div className="flex flex-col sm:flex-row gap-3">
                <input className="min-w-0 flex-1 px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-wood focus:ring-1 focus:ring-wood transition-shadow" name="couponCode" maxLength={40} placeholder="Nhập mã khuyến mãi"/>
                <button type="submit" className="px-6 py-3 bg-paper border border-line rounded-lg hover:bg-gray-50 transition-colors font-medium whitespace-nowrap" disabled={busy}>
                  {busy ? 'Đang...' : 'Áp dụng & Kiểm tra'}
                </button>
              </div>
            </label>
          </div>
        </form>

        <aside className="bg-paper p-6 md:p-8 rounded-2xl border border-line sticky top-32 shadow-sm">
          <h2 className="text-2xl font-serif mb-6">Đơn hàng của bạn</h2>
          
          <div className="flex flex-col gap-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
            {cart.data.items.map(i=><div key={i.id} className="flex justify-between items-start gap-4 text-sm">
              <div>
                <span className="font-medium text-ink">{i.name}</span> <span className="text-gray-500">× {i.quantity}</span>
              </div>
              <strong className="whitespace-nowrap">{formatVnd(i.lineTotal)}</strong>
            </div>)}
          </div>
          
          <div className="border-t border-line/60 pt-5 flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Tiền hàng</span>
              <strong>{formatVnd(quote?.subtotal||cart.data.subtotal)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Phí giao hàng</span>
              <strong>{formatVnd(quote?.shippingFee||settings.data!.shippingFee)}</strong>
            </div>
            {quote && quote.discount !== '0' && (
              <div className="flex justify-between text-forest">
                <span>Giảm giá {quote.couponCode ? `(${quote.couponCode})` : ''}</span>
                <strong>−{formatVnd(quote.discount)}</strong>
              </div>
            )}
          </div>

          <div className="border-t border-line/60 mt-5 pt-5 flex justify-between items-center mb-8">
            <span className="font-medium">Tổng thanh toán</span>
            <strong aria-label="Tổng thanh toán" className="text-2xl text-wood">{formatVnd(quote?.total || (BigInt(cart.data.subtotal) + BigInt(settings.data!.shippingFee)).toString())}</strong>
          </div>

          {quote ? (
            <div className="flex flex-col gap-4">
              <button className="w-full bg-forest text-white py-4 rounded-lg hover:bg-forest/90 transition-colors font-medium text-lg flex justify-center items-center gap-2" disabled={busy} onClick={place}>
                {busy ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Xác nhận đặt hàng'}
              </button>
              <p className="text-xs text-gray-500 text-center">Kiểm tra tổng tiền trước khi xác nhận. Bằng việc đặt hàng, bạn đồng ý với các điều khoản của chúng tôi.</p>
            </div>
          ) : (
            <p className="bg-blue-50 text-blue-700 p-4 rounded-lg text-sm text-center">
              Nhấn <strong>&quot;Áp dụng & Kiểm tra&quot;</strong> để xem tổng tiền chính xác trước khi xác nhận.
            </p>
          )}
        </aside>
      </div>
      
      {message && <div role="alert" className="fixed bottom-6 right-6 bg-red-600 text-white px-6 py-4 rounded-xl shadow-xl z-50 flex items-center gap-3 animate-in slide-in-from-bottom-5"><p>{message}</p><button onClick={() => setMessage('')} className="ml-auto bg-white/20 hover:bg-white/30 rounded-full p-1 text-xl leading-none">×</button></div>}
    </section>
  );
}
