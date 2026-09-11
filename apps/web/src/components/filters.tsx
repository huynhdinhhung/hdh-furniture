'use client';
import Link from 'next/link';
import { useRef } from 'react';
import type { Category } from '@/lib/api';
export type Search = Record<string, string | string[] | undefined>;
export function scalar(value: Search[string]) { return typeof value === 'string' ? value : ''; }
export function Filters({ categories, query }: { categories: Category[]; query: Search }) {
  const drawer = useRef<HTMLDialogElement>(null);
  const fields = (prefix: string) => <form action="/san-pham" className="filter-fields">
    {scalar(query.sort) && <input type="hidden" name="sort" value={scalar(query.sort)} />}
    {scalar(query.collection) && <input type="hidden" name="collection" value={scalar(query.collection)} />}
    <label htmlFor={prefix + '-q'}>Tìm sản phẩm<input id={prefix + '-q'} name="q" defaultValue={scalar(query.q)} placeholder="Tên sản phẩm" maxLength={100} /></label>
    <label htmlFor={prefix + '-category'}>Không gian & danh mục<select id={prefix + '-category'} name="category" defaultValue={scalar(query.category)}><option value="">Tất cả danh mục</option>{categories.map(c => <option key={c.id} value={c.slug}>{c.parentId ? '— ' : ''}{c.name}</option>)}</select></label>
    <div><span className="filter-label">Khoảng giá (VND)</span><div className="price-pair">
      <label htmlFor={prefix + '-min'}><span className="sr-only">Giá từ</span><input id={prefix + '-min'} name="minPrice" inputMode="numeric" pattern="[0-9]*" placeholder="Từ" defaultValue={scalar(query.minPrice)} /></label>
      <label htmlFor={prefix + '-max'}><span className="sr-only">Giá đến</span><input id={prefix + '-max'} name="maxPrice" inputMode="numeric" pattern="[0-9]*" placeholder="Đến" defaultValue={scalar(query.maxPrice)} /></label>
    </div></div>
    <label htmlFor={prefix + '-color'}>Màu sắc<input id={prefix + '-color'} name="color" defaultValue={scalar(query.color)} placeholder="Ví dụ: Kem, Nâu" maxLength={80} /></label>
    <label htmlFor={prefix + '-material'}>Chất liệu<input id={prefix + '-material'} name="material" defaultValue={scalar(query.material)} placeholder="Ví dụ: Gỗ sồi, Vải" maxLength={120} /></label>
    <button className="button" type="submit">Áp dụng bộ lọc</button><Link className="filter-clear" href="/san-pham">Xóa tất cả bộ lọc</Link>
  </form>;
  return <aside className="filter-panel" aria-label="Bộ lọc sản phẩm"><div className="desktop-filters"><h2>Bộ lọc</h2>{fields('desktop')}</div><button className="mobile-filter-trigger" onClick={() => drawer.current?.showModal()}>Lọc sản phẩm</button><dialog className="mobile-filters" ref={drawer} aria-labelledby="filter-drawer-title" onClick={event => { if (event.target === event.currentTarget) drawer.current?.close(); }}><div className="drawer-body"><div className="drawer-heading"><h2 id="filter-drawer-title">Bộ lọc</h2><button onClick={() => drawer.current?.close()} aria-label="Đóng bộ lọc">✕</button></div>{fields('mobile')}</div></dialog></aside>;
}
