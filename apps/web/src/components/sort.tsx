'use client';
import { useRouter } from 'next/navigation';
export function Sort({ value, query }: { value: string; query: string }) {
  const router = useRouter();
  return <label>Sắp xếp<select className="sort-select" value={value} onChange={e => { const params = new URLSearchParams(query); params.set('sort', e.target.value); params.delete('page'); router.push('/san-pham?' + params.toString()); }}><option value="newest">Mới nhất</option><option value="price_asc">Giá tăng dần</option><option value="price_desc">Giá giảm dần</option></select></label>;
}
