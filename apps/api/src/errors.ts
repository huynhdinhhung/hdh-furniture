import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Tham số chưa hợp lệ.', fields: error.issues.map(i => ({ path: i.path.join('.'), message: i.message })) } });
    return;
  }
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: { code: error.code, message: error.message } });
    return;
  }
  if (['P2002', 'P2003', 'P2004', 'P2010', 'P2025'].includes(error?.code)) {
    res.status(409).json({ error: { code: 'DATA_CONFLICT', message: 'Dữ liệu trùng, không tồn tại hoặc đang được sử dụng. Kiểm tra lại thông tin.' } });
    return;
  }
  if (error?.type === 'entity.too.large' || error?.type === 'entity.parse.failed') {
    res.status(400).json({error:{code:'INVALID_BODY',message:'Nội dung yêu cầu không hợp lệ hoặc quá lớn.'}});
    return;
  }
  // Never serialize database errors, SQL, configuration, or credentials.
  if (error?.status === 404) {
    res.status(404).json({error:{code:'NOT_FOUND',message:'Không tìm thấy tài nguyên.'}});
    return;
  }
  res.status(503).json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Chưa thể tải dữ liệu. Vui lòng thử lại sau.' } });
};
