import Link from 'next/link';
import type { Metadata } from 'next';
import { api, ApiError, type Category, type Page, type Product } from '@/lib/api';
import { ProductCard } from '@/components/product-card';
import { Filters, type Search } from '@/components/filters';
import { Sort } from '@/components/sort';
import { Unavailable } from '@/components/unavailable';
export const metadata: Metadata = { title: 'Khám phá nội thất' };
export const dynamic = 'force-dynamic';
const scalar = (value: Search[string]) => typeof value === 'string' ? value : '';
export default async function CatalogPage({ searchParams }: { searchParams: Promise<Search> }) {
  const query = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) value.forEach(v => params.append(key, v));
    else if (value?.trim()) params.set(key, value.trim());
  }
  const [products, categories] = await Promise.allSettled([api<Page<Product>>('/products?' + params), api<Page<Category>>('/categories?limit=100')]);
  const data = products.status === 'fulfilled' ? products.value : null;
  const invalid = products.status === 'rejected' && products.reason instanceof ApiError && products.reason.status === 400;
  const pageLink = (page: number) => { const p = new URLSearchParams(params); p.set('page', String(page)); return '/san-pham?' + p.toString(); };
  const current = data?.meta.page || 1;
  const last = data?.meta.totalPages || 0;
  const pages = Array.from(new Set([1, current - 1, current, current + 1, last])).filter(p => p >= 1 && p <= last).sort((a,b) => a-b);
  return <>
    <section className="section catalog-heading"><div className="breadcrumb"><Link href="/">Trang chủ</Link> / Nội thất</div><span className="eyebrow">CHỌN MỘT MÓN ĐỒ, VIẾT MỘT CÂU CHUYỆN</span><h1>Không gian của riêng bạn.</h1><p>Khám phá những thiết kế cho phòng khách và phòng ăn. Lựa chọn theo chất liệu, màu sắc và ngân sách của bạn.</p></section>
    <section className="section catalog-layout">
      <Filters query={query} categories={categories.status === 'fulfilled' ? categories.value.data : []} />
      <div>{categories.status === 'rejected' && <p role="status">Chưa tải được danh mục. Bạn vẫn có thể dùng các bộ lọc khác.</p>}
        <div className="results-toolbar"><span>{data ? data.meta.total + ' sản phẩm' : 'Danh sách sản phẩm'}</span><Sort value={['newest','price_asc','price_desc'].includes(scalar(query.sort)) ? scalar(query.sort) : 'newest'} query={params.toString()} /></div>
        {invalid ? <div role="alert" className="inline-error"><h2>Bộ lọc chưa hợp lệ</h2><p>Nhập giá nguyên không âm, giá từ không lớn hơn giá đến và số trang nguyên dương.</p><Link className="text-link" href="/san-pham">Đặt lại bộ lọc</Link></div> : data ? data.data.length ? <div className="product-grid">{data.data.map(p => <ProductCard key={p.id} product={p} />)}</div> : <div className="notice"><h2>{current > last && last > 0 ? 'Trang này không có sản phẩm' : 'Chưa tìm thấy sản phẩm phù hợp'}</h2><p>Thử thay đổi bộ lọc hoặc quay lại danh sách.</p><Link className="button" href={last > 0 ? pageLink(1) : '/san-pham'}>Xem lại sản phẩm</Link></div> : <Unavailable />}
        {last > 1 && <nav className="pagination" aria-label="Phân trang">{current > 1 && <Link href={pageLink(Math.min(current - 1, last))} aria-label="Trang trước">←</Link>}{pages.map((p,i) => <span className="pagination-item" key={p}>{i > 0 && p - pages[i - 1] > 1 && <span>…</span>}<Link href={pageLink(p)} aria-current={p === current ? 'page' : undefined} aria-label={'Trang ' + p}>{p}</Link></span>)}{current < last && <Link href={pageLink(current + 1)} aria-label="Trang sau">→</Link>}</nav>}
      </div>
    </section>
  </>;
}
