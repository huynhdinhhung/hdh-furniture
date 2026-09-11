import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { api, ApiError, type Product, type Page } from '@/lib/api';
import { ProductDetail } from '@/components/product-detail';
import { ProductCard } from '@/components/product-card';

export const dynamic = 'force-dynamic';
const getProduct = cache(async (slug: string) => {
  if (!/^[a-z0-9-]{1,200}$/.test(slug)) notFound();
  try { return (await api<{ data: Product }>('/products/' + encodeURIComponent(slug))).data; }
  catch (error) { if (error instanceof ApiError && error.status === 404) notFound(); throw error; }
});
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getProduct((await params).slug);
  return { title: product.name, description: product.description.slice(0,160) };
}
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getProduct((await params).slug);
  const related = await api<Page<Product>>('/products?category=' + product.category.slug + '&limit=4').catch(() => null);
  return <div className="section"><div className="breadcrumb"><Link href="/">Trang chủ</Link> / <Link href="/san-pham">Nội thất</Link> / {product.name}</div><ProductDetail product={product} />
    {related && related.data.some(p => p.id !== product.id) && <section className="related"><div className="section-title"><h2>Cùng một cảm hứng</h2></div><div className="product-grid">{related.data.filter(p => p.id !== product.id).slice(0,3).map(p => <ProductCard product={p} key={p.id} />)}</div></section>}
  </div>;
}
