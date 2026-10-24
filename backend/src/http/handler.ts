import type { IncomingMessage, ServerResponse } from 'node:http';
import { RateLimiter, readJson, securityHeaders, validateOrigin } from './middleware.ts';
import { serveStatic } from './static.ts';
import type { Router } from './router.ts';
import { HttpError } from '../shared/errors.ts';

interface HandlerOptions { allowedOrigins: string[]; frontendDir: string }

export function createRequestHandler(router: Router, options: HandlerOptions) {
  const limiter = new RateLimiter();
  return async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    securityHeaders(response);
    try {
      const path = new URL(request.url ?? '/', 'http://studyforge.local').pathname;
      if (path.startsWith('/api/')) {
        validateOrigin(request, response, options.allowedOrigins);
        if (request.method === 'OPTIONS') {
          response.writeHead(204, { 'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
          response.end(); return;
        }
        const ip = request.socket.remoteAddress ?? 'unknown';
        limiter.check(`${ip}:all`, 1000, 15 * 60 * 1000, response);
        if (request.method === 'POST' && ['/api/auth/login', '/api/auth/register'].includes(path)) limiter.check(`${ip}:auth`, 30, 15 * 60 * 1000, response);
        if (request.method === 'POST' && path === '/api/support') limiter.check(`${ip}:support`, 10, 60 * 60 * 1000, response);
        const body = await readJson(request);
        if (await router.handle(request, response, path, body)) return;
        throw new HttpError(404, 'NOT_FOUND', 'API không tồn tại.');
      }
      if (await serveStatic(request, response, path, options.frontendDir)) return;
      throw new HttpError(404, 'NOT_FOUND', 'Không tìm thấy tài nguyên. Chạy npm run build để tạo frontend.');
    } catch (error) {
      const known = error instanceof HttpError;
      if (!known) console.error('[StudyForge API]', error instanceof Error ? error.message : 'Unexpected error');
      if (!response.headersSent) {
        response.statusCode = known ? error.status : 500;
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.end(JSON.stringify({ error: { code: known ? error.code : 'INTERNAL_ERROR', message: known ? error.message : 'Có lỗi xảy ra. Vui lòng thử lại.', ...(known && error.details !== undefined ? { details: error.details } : {}) } }));
      } else response.end();
    }
  };
}
