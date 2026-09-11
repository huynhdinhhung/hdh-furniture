import Link from 'next/link';
export function Unavailable() {
  return <div className="notice" role="status"><h2>Chưa thể tải sản phẩm</h2><p>Kết nối dữ liệu đang gián đoạn. Vui lòng thử tải lại sau.</p><Link className="text-link" href="/san-pham">Thử xem danh sách sản phẩm →</Link></div>;
}
