import type { IncomingMessage, ServerResponse } from 'node:http';
import { HttpError } from '../shared/errors.ts';

export async function readJson(request: IncomingMessage): Promise<unknown> {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method ?? 'GET')) return {};
  const contentType = request.headers['content-type'] ?? '';
  const length = Number(request.headers['content-length'] ?? 0);
  if (length > 65536) { request.resume(); throw new HttpError(413, 'BODY_TOO_LARGE', 'Nội dung vượt quá 64 KiB.'); }
  if (length > 0 && !contentType.toLowerCase().startsWith('application/json')) { request.resume(); throw new HttpError(415, 'JSON_REQUIRED', 'Vui lòng gửi application/json.'); }
  const chunks: Buffer[] = [];
  let bytes = 0;
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > 65536) { request.resume(); throw new HttpError(413, 'BODY_TOO_LARGE', 'Nội dung vượt quá 64 KiB.'); }
    chunks.push(buffer);
  }
  if (bytes === 0) return {};
  if (!contentType.toLowerCase().startsWith('application/json')) throw new HttpError(415, 'JSON_REQUIRED', 'Vui lòng gửi application/json.');
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new HttpError(400, 'INVALID_JSON', 'JSON không hợp lệ.'); }
}

export function securityHeaders(response: ServerResponse) {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
}

export function validateOrigin(request: IncomingMessage, response: ServerResponse, allowedOrigins: string[]) {
  const origin = request.headers.origin;
  const write = !['GET', 'HEAD', 'OPTIONS'].includes(request.method ?? 'GET');
  if (origin && !allowedOrigins.includes(origin)) throw new HttpError(403, 'ORIGIN_DENIED', 'Origin không được phép truy cập API.');
  if (write && request.headers['sec-fetch-site'] === 'cross-site') throw new HttpError(403, 'ORIGIN_DENIED', 'Yêu cầu thay đổi dữ liệu từ website khác bị từ chối.');
  if (origin) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Access-Control-Allow-Credentials', 'true');
    response.setHeader('Vary', 'Origin');
  }
}

export class RateLimiter {
  buckets = new Map<string, { count: number; reset: number }>();
  check(key: string, limit: number, windowMs: number, response: ServerResponse) {
    const now = Date.now();
    if (this.buckets.size > 10000) for (const [id, bucket] of this.buckets) if (bucket.reset <= now) this.buckets.delete(id);
    const old = this.buckets.get(key);
    const bucket = old && old.reset > now ? old : { count: 0, reset: now + windowMs };
    bucket.count++;
    this.buckets.set(key, bucket);
    if (bucket.count > limit) {
      response.setHeader('Retry-After', Math.ceil((bucket.reset - now) / 1000));
      throw new HttpError(429, 'RATE_LIMITED', 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.');
    }
  }
}
