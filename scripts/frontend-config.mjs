import { isIP } from 'node:net';

// Only these variables belong to the frontend process. Only PUBLIC_API_BASE_URL
// is serialized into browser-delivered config.js; proxy addresses stay server-side.
const keys = ['FE_PORT', 'FE_HOST', 'API_PROXY_TARGET', 'PUBLIC_API_BASE_URL'];

export function frontendConfig() {
  const values = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  const port = values.FE_PORT ?? '3000';
  if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) throw new Error('FE_PORT phải là số nguyên từ 1 đến 65535.');
  const host = values.FE_HOST || '127.0.0.1';
  if (host !== 'localhost' && !isIP(host)) throw new Error('FE_HOST phải là địa chỉ IP hoặc localhost.');
  let target;
  try { target = new URL(values.API_PROXY_TARGET || 'http://127.0.0.1:3001'); } catch { throw new Error('API_PROXY_TARGET phải là HTTP(S) origin hợp lệ.'); }
  if (!['http:', 'https:'].includes(target.protocol) || target.username || target.password || target.pathname !== '/' || target.search || target.hash) throw new Error('API_PROXY_TARGET chỉ nhận HTTP(S) origin, không có thông tin đăng nhập/path/query.');
  const publicBase = (values.PUBLIC_API_BASE_URL ?? '').trim().replace(/\/$/, '');
  if (publicBase) {
    let url;
    try { url = new URL(publicBase); } catch { throw new Error('PUBLIC_API_BASE_URL phải để trống hoặc là HTTP(S) URL tuyệt đối.'); }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error('PUBLIC_API_BASE_URL không được chứa credentials/query/hash.');
  }
  return { port: Number(port), host, backend: target.origin, publicConfig: { PUBLIC_API_BASE_URL: publicBase } };
}

export function browserConfigScript(publicConfig) {
  return `window.__STUDYFORGE_CONFIG__ = Object.freeze(${JSON.stringify(publicConfig).replace(/</g, '\\u003c')});\n`;
}
