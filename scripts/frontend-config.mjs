import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';
import { isIP } from 'node:net';
import { root } from './paths.mjs';

// Only these variables belong to the frontend process. Only PUBLIC_API_BASE_URL
// is serialized into browser-delivered config.js; proxy addresses stay server-side.
const keys = ['FE_PORT', 'FE_HOST', 'API_PROXY_TARGET', 'PUBLIC_API_BASE_URL'];

export function frontendConfig() {
  const file = resolve(root, 'frontend/.env');
  const fileValues = existsSync(file) ? parseEnv(readFileSync(file, 'utf8')) : {};
  const values = Object.fromEntries(keys.map((key) => [key, process.env[key] ?? fileValues[key]]));
  if (!values.FE_PORT || !/^\d+$/.test(values.FE_PORT) || Number(values.FE_PORT) < 1 || Number(values.FE_PORT) > 65535) throw new Error('frontend/.env: FE_PORT phải là số nguyên từ 1 đến 65535.');
  const host = values.FE_HOST || '127.0.0.1';
  if (host !== 'localhost' && !isIP(host)) throw new Error('frontend/.env: FE_HOST phải là địa chỉ IP hoặc localhost.');
  if (values.PUBLIC_API_BASE_URL === undefined) throw new Error('frontend/.env: thiếu PUBLIC_API_BASE_URL (để trống để dùng cùng origin).');
  let target;
  try { target = new URL(values.API_PROXY_TARGET || ''); } catch { throw new Error('frontend/.env: API_PROXY_TARGET phải là HTTP(S) origin hợp lệ.'); }
  if (!['http:', 'https:'].includes(target.protocol) || target.username || target.password || target.pathname !== '/' || target.search || target.hash) throw new Error('frontend/.env: API_PROXY_TARGET chỉ nhận HTTP(S) origin, không có thông tin đăng nhập/path/query.');
  const publicBase = values.PUBLIC_API_BASE_URL.trim().replace(/\/$/, '');
  if (publicBase) {
    let url;
    try { url = new URL(publicBase); } catch { throw new Error('PUBLIC_API_BASE_URL phải để trống hoặc là HTTP(S) URL tuyệt đối.'); }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error('PUBLIC_API_BASE_URL không được chứa credentials/query/hash.');
  }
  return { port: Number(values.FE_PORT), host, backend: target.origin, publicConfig: { PUBLIC_API_BASE_URL: publicBase } };
}

export function browserConfigScript(publicConfig) {
  return `window.__STUDYFORGE_CONFIG__ = Object.freeze(${JSON.stringify(publicConfig).replace(/</g, '\\u003c')});\n`;
}
