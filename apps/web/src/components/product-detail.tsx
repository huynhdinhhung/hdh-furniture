'use client';
import { useState } from 'react';
import { formatVnd, type Product } from '@/lib/api';
import { Photo } from './photo';
import { AddCart } from './add-cart';
export function ProductDetail({ product }: { product: Product }) {
  const [variantId, setVariantId] = useState(product.variants[0]?.id);
  const [imageId, setImageId] = useState<string | null>(null);
  const variant = product.variants.find(v => v.id === variantId) || product.variants[0];
  const gallery = product.images.filter(image => !image.variantId || image.variantId === variant?.id);
  const images = gallery.length ? gallery : product.images;
  const current = images.find(i => i.id === imageId) || images[0];
  return <>
    <div className="detail-grid"><div><Photo key={current?.id || 'empty'} className="gallery-main" src={current?.url} alt={current?.alt || product.name} eager /><div className="gallery-thumbs">{images.map((img,i) => <button key={img.id} aria-label={'Xem ảnh ' + (i+1)} aria-pressed={img.id === current?.id} onClick={() => setImageId(img.id)}><Photo src={img.url} alt={img.alt} /></button>)}</div><p className="product-options">Ảnh minh họa phong cách; không đại diện sản phẩm thực tế.</p></div>
      <div className="detail-info"><span className="eyebrow">{product.category.name}</span><h1>{product.name}</h1><p className="detail-price">{variant ? formatVnd(variant.price) : 'Chưa có giá'}</p>
        <fieldset><legend>Chọn màu & chất liệu</legend><div className="variant-buttons">{product.variants.map(v => <button key={v.id} aria-pressed={v.id === variant?.id} onClick={() => { setVariantId(v.id); setImageId(null); }}>{v.color}<small>{v.material}</small></button>)}</div></fieldset>
        {variant && <><p className="stock" aria-live="polite">{variant.stock > 0 ? 'Còn ' + variant.stock + ' sản phẩm' : 'Tạm hết hàng'} · SKU: {variant.sku}</p>
          <dl className="specs"><div><dt>Chất liệu</dt><dd>{variant.material}</dd></div><div><dt>Màu sắc</dt><dd>{variant.color}</dd></div><div><dt>Rộng × Sâu × Cao</dt><dd>{variant.widthMm} × {variant.depthMm} × {variant.heightMm} mm</dd></div></dl></>}
        {variant && <AddCart key={variant.id} variantId={variant.id} stock={variant.stock} />}
        <p className="demo-note">Giá và tồn kho sẽ được kiểm tra lại khi đặt hàng. Dữ liệu hiện tại là catalog minh họa.</p>
      </div>
    </div>
    <section className="description"><span className="eyebrow">VỀ THIẾT KẾ</span><h2>Giản dị, để dễ yêu.</h2><p>{product.description}</p></section>
  </>;
}
