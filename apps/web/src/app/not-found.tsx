import Link from 'next/link';
export default function NotFound() { return <section className="section notice"><span className="eyebrow">404</span><h1>Không tìm thấy trang</h1><p>Sản phẩm hoặc trang bạn tìm có thể đã ngừng hiển thị.</p><Link className="button" href="/san-pham">Về danh sách sản phẩm</Link></section>; }
