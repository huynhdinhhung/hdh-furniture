import type { Metadata } from 'next';
import Link from 'next/link';
import { AccountLinks } from '@/components/account-links';
import { SplashIntro } from '@/components/splash-intro';
import { ChatWidget } from '@/components/chat-widget';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'vietnamese'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin', 'vietnamese'], variable: '--font-playfair' });

export const metadata: Metadata = { title: { default: 'HDH Furniture — Không gian của riêng bạn', template: '%s | HDH Furniture' }, description: 'Khám phá nội thất HDH Furniture: sofa, ghế và bàn cho không gian sống của bạn.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi" data-scroll-behavior="smooth" className={`${inter.variable} ${playfair.variable}`}><body className="font-sans">
    <SplashIntro />
    <ChatWidget />
    <a className="skip-link" href="#main">Đến nội dung chính</a>
    <div className="announcement">Một chút tinh tế. Một mái nhà rất riêng.</div>
    <header className="sticky top-0 z-50 bg-paper/90 backdrop-blur-md border-b border-line px-5 py-4 md:py-5 md:px-[4.5%] flex items-center justify-between gap-4 transition-all">
      <div className="flex items-center gap-8">
        <Link className="brand text-3xl md:text-[38px] leading-none tracking-wider flex flex-col" href="/" aria-label="HDH Furniture, trang chủ">
          HDH<span className="font-sans text-[9px] md:text-[10px] leading-relaxed tracking-[0.36em] mt-1.5 md:mt-2">FURNITURE</span>
        </Link>
        <nav className="hidden lg:flex items-center gap-8 ml-4 text-[14px]" aria-label="Điều hướng chính">
          <Link className="hover:text-wood transition-colors" href="/san-pham">Nội thất</Link>
          <Link className="hover:text-wood transition-colors" href="/san-pham?category=phong-khach">Phòng khách</Link>
          <Link className="hover:text-wood transition-colors" href="/san-pham?category=phong-an">Phòng ăn</Link>
          <Link className="hover:text-wood transition-colors" href="/#bo-suu-tap">Bộ sưu tập</Link>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <form action="/san-pham" className="hidden md:flex items-center border-b border-gray-400 group focus-within:border-wood transition-colors w-[180px] lg:w-[220px]">
          <label className="sr-only" htmlFor="header-search">Tìm sản phẩm</label>
          <input className="w-full bg-transparent outline-none py-2 text-sm placeholder-gray-500" id="header-search" name="q" placeholder="Tìm kiếm..." maxLength={100} />
          <button type="submit" aria-label="Tìm kiếm" className="text-gray-500 group-hover:text-ink transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </button>
        </form>
        <AccountLinks />
        
        <details className="lg:hidden relative group">
          <summary className="list-none cursor-pointer p-2 -mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
          </summary>
          <nav aria-label="Điều hướng di động" className="absolute right-0 top-full mt-4 w-48 bg-white border border-line shadow-lg flex flex-col p-4 gap-4 z-50">
            <Link className="hover:text-wood transition-colors" href="/san-pham">Tất cả nội thất</Link>
            <Link className="hover:text-wood transition-colors" href="/san-pham?category=phong-khach">Phòng khách</Link>
            <Link className="hover:text-wood transition-colors" href="/san-pham?category=phong-an">Phòng ăn</Link>
            <Link className="hover:text-wood transition-colors" href="/#bo-suu-tap">Bộ sưu tập</Link>
          </nav>
        </details>
      </div>
    </header>
    <main id="main">{children}</main>
    <footer><div className="footer-top"><Link className="brand" href="/">HDH<span>FURNITURE</span></Link><p>Những món đồ giản dị.<br />Cho những ngày thật đẹp ở nhà.</p><nav aria-label="Thông tin"><Link href="/san-pham">Khám phá nội thất</Link><Link href="/#cau-chuyen">Câu chuyện thiết kế</Link><Link href="/nguon-anh">Nguồn ảnh</Link></nav></div><div className="footer-bottom"><span>© {new Date().getFullYear()} HDH Furniture</span><span>Dữ liệu mẫu · Ảnh minh họa · Phiên bản thử nghiệm</span></div></footer>
  </body></html>;
}
