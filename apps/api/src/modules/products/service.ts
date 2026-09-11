import { HttpError } from '../../errors.js';
import type { ProductRepository } from './repository.js';
import type { ProductQuery } from './validation.js';

export function createProductService(repository: ProductRepository) {
  return {
    async list(query: ProductQuery) {
      const result = await repository.list(query);
      return { data: result.data, meta: { total: result.total, page: query.page, limit: query.limit, totalPages: Math.ceil(result.total / query.limit) } };
    },
    async detail(slug: string) {
      const product = await repository.detail(slug);
      if (!product) throw new HttpError(404, 'PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm.');
      return { data: product };
    },
  };
}
