import { resolve } from 'node:path';
import { isIP } from 'node:net';

export interface AppOptions {
  databasePath?: string;
  frontendDir?: string;
  allowedOrigins?: string[];
  secureCookies?: boolean;
}

export function getConfig(options: AppOptions = {}) {
  const parseInteger = (name: string, fallback: number, min: number, max: number) => {
    const raw = process.env[name];
    if (raw === undefined || raw === '') return fallback;
    const number = Number(raw);
    if (!/^\d+$/.test(raw) || !Number.isInteger(number) || number < min || number > max) throw new Error(`${name} phải là số nguyên từ ${min} đến ${max}.`);
    return number;
  };
  const secureValue = process.env.SECURE_COOKIES;
  if (secureValue !== undefined && !['true', 'false'].includes(secureValue)) throw new Error('SECURE_COOKIES phải là true hoặc false.');
  const config = {
    databasePath: options.databasePath ?? process.env.DATABASE_PATH ?? resolve('data/studyforge.sqlite'),
    frontendDir: options.frontendDir ?? process.env.FRONTEND_DIR ?? resolve('dist/frontend'),
    allowedOrigins: options.allowedOrigins ?? (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001').split(',').map(x => x.trim()),
    secureCookies: options.secureCookies ?? secureValue === 'true',
    sessionTtlSeconds: parseInteger('SESSION_TTL_SECONDS', 604800, 300, 2592000),
    port: parseInteger('API_PORT', 3001, 1, 65535),
    host: process.env.HOST || '127.0.0.1',
  };
  if (!config.databasePath.trim()) throw new Error('DATABASE_PATH không được để trống.');
  if (!config.frontendDir.trim()) throw new Error('FRONTEND_DIR không được để trống.');
  if (config.host !== 'localhost' && !isIP(config.host)) throw new Error('HOST phải là địa chỉ IP hoặc localhost.');
  if (config.allowedOrigins.length === 0) throw new Error('ALLOWED_ORIGINS cần ít nhất một origin.');
  for (const origin of config.allowedOrigins) {
    let parsed: URL;
    try { parsed = new URL(origin); } catch { throw new Error(`ALLOWED_ORIGINS chứa URL không hợp lệ: ${origin}`); }
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin) throw new Error('ALLOWED_ORIGINS chỉ chấp nhận origin http(s), không có đường dẫn.');
  }
  if (process.env.NODE_ENV === 'production' && !config.secureCookies) throw new Error('Production yêu cầu SECURE_COOKIES=true và reverse proxy HTTPS.');
  return config;
}
