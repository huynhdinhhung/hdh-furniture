'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useResource, type User, type Cart } from '@/lib/shop';
import { ShoppingBag, User as UserIcon, Settings } from 'lucide-react';
import { useEffect } from 'react';

export function AccountLinks() {
  const pathname = usePathname();
  const { data: user, reload:reloadUser } = useResource<User | null>('/auth/me?view=' + encodeURIComponent(pathname));
  const { data: cart, reload:reloadCart } = useResource<Cart>('/cart?view=' + encodeURIComponent(pathname));
  
  useEffect(() => { const refresh=()=>{reloadUser();reloadCart();};window.addEventListener('shop:changed',refresh);return()=>window.removeEventListener('shop:changed',refresh); }, [reloadUser,reloadCart]);
  
  const cartItemCount = cart?.items.reduce((acc, item) => acc + item.quantity, 0) || 0;


  return (
    <nav className="flex items-center gap-5 ml-4" aria-label="Tài khoản và mua hàng">
      <Link href="/gio-hang" aria-label={'Giỏ hàng, '+cartItemCount+' sản phẩm'} className="relative text-ink hover:text-wood transition-colors group">
        <ShoppingBag strokeWidth={1.5} size={22} className="group-hover:scale-105 transition-transform" />
        {cartItemCount > 0 && (
          <span className="absolute -top-1.5 -right-2 bg-wood text-white text-[10px] font-bold px-1.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center">
            {cartItemCount}
          </span>
        )}
      </Link>
      <Link href="/tai-khoan" className="text-ink hover:text-wood transition-colors" aria-label={user ? 'Tài khoản' : 'Đăng nhập'}>
        <UserIcon strokeWidth={1.5} size={22} />
      </Link>
      {user?.role === 'ADMIN' && (
        <Link href="/admin" className="text-ink hover:text-wood transition-colors" aria-label="Quản trị">
          <Settings strokeWidth={1.5} size={22} />
        </Link>
      )}
    </nav>
  );
}
