'use client';
import Link from 'next/link';
import { useState } from 'react';
import { shop, useResource, type Cart, type User } from '@/lib/shop';
import { formatVnd } from '@/lib/api';
import { Photo } from '@/components/photo';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartPage() {
  const cart = useResource<Cart>('/cart');
  const account = useResource<User | null>('/auth/me');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function update(id: string, quantity: number) {
    setBusy(true);
    setMessage('');
    try {
      await shop('/cart/items/' + id, quantity === 0 ? 'DELETE' : 'PUT', quantity === 0 ? undefined : { quantity });
      cart.reload();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="max-w-[1250px] mx-auto px-5 py-12 md:py-16 min-h-[70vh]">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link href="/" className="hover:text-wood transition-colors">Trang chủ</Link>
        <span>/</span>
        <span className="text-ink">Giỏ hàng</span>
      </div>
      
      <h1 className="text-3xl md:text-4xl font-serif mb-10">Giỏ hàng của bạn</h1>

      {cart.loading ? (
        <div className="animate-pulse flex flex-col gap-8">
          <div className="h-32 bg-gray-100 rounded-xl"></div>
          <div className="h-32 bg-gray-100 rounded-xl"></div>
        </div>
      ) : cart.error ? (
        <div className="bg-red-50 text-red-700 p-6 rounded-xl flex flex-col items-center gap-4">
          <p>{cart.error}</p>
          <button className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700" onClick={cart.reload}>Thử lại</button>
        </div>
      ) : !cart.data?.items.length ? (
        <div className="flex flex-col items-center justify-center py-20 bg-paper rounded-2xl border border-line text-center px-4">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm text-gray-300">
            <ShoppingBag size={40} strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-serif mb-3">Giỏ hàng đang trống</h2>
          <p className="text-gray-500 mb-8 max-w-md">Chưa có sản phẩm nào trong giỏ hàng của bạn. Hãy khám phá các bộ sưu tập nội thất mới nhất của chúng tôi.</p>
          <Link className="inline-flex items-center gap-3 bg-forest text-white px-8 py-3.5 rounded-lg hover:bg-forest/90 transition-colors" href="/san-pham">
            Khám phá nội thất <ArrowRight size={18} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 lg:gap-16 items-start">
          <div className="flex flex-col gap-6">
            <AnimatePresence>
              {cart.data.items.map(item => (
                <motion.article 
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex gap-6 p-4 rounded-xl border border-line bg-white/50 hover:bg-white transition-colors"
                >
                  <Link href={'/san-pham/' + item.slug} className="block w-[120px] h-[140px] shrink-0 rounded-lg overflow-hidden bg-[#eae5dd]">
                    <Photo className="w-full h-full object-cover" src={item.image || undefined} alt={item.name} />
                  </Link>
                  
                  <div className="flex flex-col flex-1 py-1">
                    <div className="flex justify-between gap-4 mb-1">
                      <h2 className="font-serif text-lg leading-tight">
                        <Link href={'/san-pham/' + item.slug} className="hover:text-wood transition-colors">{item.name}</Link>
                      </h2>
                      <strong className="text-lg">{formatVnd(item.lineTotal)}</strong>
                    </div>
                    
                    <p className="text-sm text-gray-500 mb-2">{item.color} · {item.material}</p>
                    <p className="text-xs font-medium mb-auto">
                      {item.available ? (
                        <span className="text-forest bg-forest/10 px-2 py-0.5 rounded">Còn {item.stock} sản phẩm</span>
                      ) : (
                        <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded">Không đủ tồn kho</span>
                      )}
                    </p>
                    
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-line/50">
                      <div className="flex items-center border border-line rounded-lg overflow-hidden bg-white">
                        <button 
                          className="px-3 py-2 text-gray-500 hover:text-ink hover:bg-gray-50 disabled:opacity-50 transition-colors" 
                          aria-label={'Giảm số lượng ' + item.name} 
                          disabled={busy || item.quantity <= 1} 
                          onClick={() => update(item.variantId, item.quantity - 1)}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-sm font-medium" aria-label="Số lượng">{item.quantity}</span>
                        <button 
                          className="px-3 py-2 text-gray-500 hover:text-ink hover:bg-gray-50 disabled:opacity-50 transition-colors" 
                          aria-label={'Tăng số lượng ' + item.name} 
                          disabled={busy || item.quantity >= Math.min(item.stock, 99)} 
                          onClick={() => update(item.variantId, item.quantity + 1)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button 
                        disabled={busy} 
                        className="text-sm text-gray-400 hover:text-red-500 flex items-center gap-1.5 transition-colors" 
                        onClick={() => update(item.variantId, 0)}
                      >
                        <Trash2 size={16} /> <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>

          <aside className="bg-paper p-8 rounded-2xl border border-line sticky top-32">
            <h2 className="text-2xl font-serif mb-6">Tóm tắt đơn hàng</h2>
            <div className="flex justify-between items-center py-4 border-b border-line/60">
              <span className="text-gray-600">Tiền hàng</span>
              <strong className="text-xl">{formatVnd(cart.data.subtotal)}</strong>
            </div>
            <p className="text-sm text-gray-500 mt-4 mb-8 leading-relaxed">
              Phí giao hàng và mã giảm giá sẽ được áp dụng ở bước đặt hàng tiếp theo. Lưu ý: Giỏ hàng không giữ chỗ tồn kho.
            </p>
            
            {cart.data.canCheckout ? (
              <Link 
                className="flex items-center justify-center gap-2 w-full bg-forest text-white py-4 rounded-lg hover:bg-forest/90 transition-colors font-medium text-lg" 
                href={account.data ? '/thanh-toan' : '/tai-khoan'}
              >
                {account.data ? 'Tiến hành đặt hàng' : 'Đăng nhập để đặt hàng'} <ArrowRight size={20} />
              </Link>
            ) : (
              <p className="bg-red-50 text-red-700 p-4 rounded-lg text-sm text-center">
                Vui lòng điều chỉnh các sản phẩm không đủ tồn kho trước khi đặt hàng.
              </p>
            )}
          </aside>
        </div>
      )}

      {message && (
        <div className="fixed bottom-6 right-6 bg-red-600 text-white px-6 py-4 rounded-xl shadow-xl z-50 flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <p>{message}</p>
          <button onClick={() => setMessage('')} className="ml-auto bg-white/20 hover:bg-white/30 rounded-full p-1"><Plus size={16} className="rotate-45" /></button>
        </div>
      )}
    </section>
  );
}
