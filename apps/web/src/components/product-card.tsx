import Link from 'next/link';
import { type Product, formatVnd } from '@/lib/api';
import { Photo } from './photo';
export function ProductCard({ product }: { product: Product }) {
  const price = product.matchingPrice ?? product.variants[0]?.price;
  const inStock = product.variants.some(v => v.stock > 0);
  
  return (
    <article className="relative group flex flex-col gap-3">
      <Link href={'/san-pham/' + product.slug} className="relative block overflow-hidden rounded-lg bg-[#eae5dd] aspect-[1/1.12]" aria-label={'Xem ' + product.name}>
        <Photo className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" src={product.images[0]?.url} alt={product.images[0]?.alt || product.name} />
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <span className="bg-white/90 backdrop-blur text-ink px-2.5 py-1 text-[10px] font-medium tracking-wider uppercase rounded-sm shadow-sm">
            {product.category.name}
          </span>
          {!inStock && (
            <span className="bg-red-500/90 backdrop-blur text-white px-2.5 py-1 text-[10px] font-medium tracking-wider uppercase rounded-sm shadow-sm">
              Hết hàng
            </span>
          )}
        </div>
      </Link>
      
      <div>
        <div className="flex justify-between items-start gap-4 mb-1">
          <h3 className="font-serif text-lg leading-tight group-hover:text-wood transition-colors">
            <Link href={'/san-pham/' + product.slug}>
              {product.name}
            </Link>
          </h3>
          <span className="text-gray-400 group-hover:text-wood transition-colors transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 duration-300" aria-hidden="true">↗</span>
        </div>
        
        <p className="text-ink font-medium mb-1.5">
          {price !== undefined ? formatVnd(price) : 'Chưa có giá'}
        </p>
        
        <p className="text-[12px] text-gray-500 flex items-center gap-2">
          <span>{product.variants.length} lựa chọn</span>
          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
          <span className={inStock ? "text-forest" : "text-gray-400"}>
            {inStock ? 'Còn hàng' : 'Tạm hết hàng'}
          </span>
        </p>
      </div>
    </article>
  );
}
