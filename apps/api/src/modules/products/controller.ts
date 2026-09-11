import type { RequestHandler } from 'express';
import type { createProductService } from './service.js';
import { productQuery, slugParam } from './validation.js';

export function createProductController(service: ReturnType<typeof createProductService>) {
  const list: RequestHandler = async (req, res) => { res.json(await service.list(productQuery.parse(req.query))); };
  const detail: RequestHandler = async (req, res) => { res.json(await service.detail(slugParam.parse(req.params.slug))); };
  return { list, detail };
}
