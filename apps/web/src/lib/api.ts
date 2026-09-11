export type Category = { id: string; name: string; slug: string; parentId: string | null };
export type Variant = { id: string; sku: string; color: string; material: string; price: string; stock: number; widthMm: number; depthMm: number; heightMm: number };
export type ProductImage = { id: string; url: string; alt: string; variantId: string | null };
export type Product = { id: string; name: string; slug: string; description: string; category: Category; variants: Variant[]; images: ProductImage[]; matchingPrice?: string };
export type Page<T> = { data: T[]; meta: { total: number; page: number; limit: number; totalPages: number } };
export type Home = { banners: { id: string; title: string; imageUrl: string; targetUrl: string }[]; collections: { id: string; name: string; slug: string; description: string; imageUrl: string }[] };
export class ApiError extends Error {
  constructor(public status: number) { super('Không thể tải dữ liệu.'); }
}
export async function api<T>(path: string): Promise<T> {
  try {
    const res = await fetch((process.env.API_URL || 'http://localhost:4000') + '/api/v1' + path, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new ApiError(res.status);
    return await res.json() as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(503);
  }
}
export function formatVnd(value: string) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(BigInt(value));
}
export const heroImage = 'https://images.pexels.com/photos/10486238/pexels-photo-10486238.jpeg?cs=srgb&fm=jpg';
