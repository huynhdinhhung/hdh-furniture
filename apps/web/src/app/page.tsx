import Link from 'next/link';
import { api, type Home, type Category, type Page, type Product, heroImage } from '@/lib/api';
import { ProductCard } from '@/components/product-card';
import { Photo } from '@/components/photo';
import { Unavailable } from '@/components/unavailable';
import { HomeHero } from '@/components/home-hero';

export const dynamic = 'force-dynamic';
export default async function HomePage() {
  const [products, categories, home] = await Promise.allSettled([
    api<Page<Product>>('/products?limit=4'), api<Page<Category>>('/categories'), api<{ data: Home }>('/home'),
  ]);
  const banner = home.status === 'fulfilled' ? home.value.data.banners[0] : undefined;
  return <>
    <HomeHero banner={banner} fallbackImage={heroImage} />
    <section className="section intro"><span className="eyebrow">MỘT MÁI NHÀ, NHIỀU CẢM HỨNG</span><div><h2>Bắt đầu từ góc bạn yêu.</h2><p>Từ phòng khách quây quần đến bàn ăn ấm cúng, tìm một món đồ phù hợp với nhịp sống của bạn.</p></div></section>
    <section className="category-links section" aria-label="Danh mục nội thất">
      {categories.status === 'fulfilled' ? categories.value.data.filter(c => !c.parentId).map((c, i) => <Link key={c.id} href={'/san-pham?category=' + c.slug}><span className="category-number">0{i + 1}</span><h3>{c.name}</h3><span>Khám phá ↗</span></Link>) : <p role="status">Chưa tải được danh mục. Vui lòng thử lại sau.</p>}
    </section>
    <section className="section"><div className="section-title"><div><span className="eyebrow">DÀNH CHO KHÔNG GIAN CỦA BẠN</span><h2>Những thiết kế mới</h2></div><Link className="text-link" href="/san-pham">Xem tất cả ↗</Link></div>
      {products.status === 'fulfilled' ? products.value.data.length ? <div className="product-grid">{products.value.data.map(p => <ProductCard key={p.id} product={p} />)}</div> : <div className="notice"><p>Catalog đang được cập nhật.</p></div> : <Unavailable />}
    </section>
    <section className="section collections" id="bo-suu-tap"><div className="section-title"><div><span className="eyebrow">CÙNG MỘT NGÔN NGỮ THIẾT KẾ</span><h2>Bộ sưu tập</h2></div></div>
      {home.status === 'fulfilled' ? home.value.data.collections.length ? <div className="collection-grid">{home.value.data.collections.map(c => <Link className="collection" key={c.id} href={'/san-pham?collection=' + c.slug}><Photo src={c.imageUrl} alt={'Không gian minh họa bộ sưu tập ' + c.name} /><div><h3>{c.name}</h3><p>{c.description}</p><span className="text-link">Khám phá bộ sưu tập ↗</span></div></Link>)}</div> : <p>Bộ sưu tập đang được cập nhật.</p> : <p role="status">Chưa tải được bộ sưu tập. Vui lòng thử lại sau.</p>}
    </section>
    <section className="story section" id="cau-chuyen"><span className="eyebrow">TINH THẦN HDH FURNITURE</span><h2>Đẹp trong từng đường nét.<br />Gần gũi trong từng ngày.</h2><p>Chúng tôi hướng đến những thiết kế dễ kết hợp, màu sắc tự nhiên và công năng rõ ràng. Một không gian đẹp bắt đầu từ cách bạn sống trong đó.</p><Link className="button" href="/san-pham">Tìm cảm hứng cho nhà bạn <span>↗</span></Link></section>
  </>;
}
