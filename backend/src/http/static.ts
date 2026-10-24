import type { IncomingMessage, ServerResponse } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const mime: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.json': 'application/json; charset=utf-8' };

export async function serveStatic(request: IncomingMessage, response: ServerResponse, pathname: string, directory: string): Promise<boolean> {
  if (!['GET', 'HEAD'].includes(request.method ?? 'GET')) return false;
  let decoded: string;
  try { decoded = decodeURIComponent(pathname); } catch { return false; }
  if (decoded.includes('\0') || decoded.includes('\\')) return false;
  const root = resolve(directory);
  let file = resolve(root, '.' + decoded);
  if (file !== root && !file.startsWith(root + sep)) return false;
  if (decoded.split('/').some(part => part.startsWith('.'))) return false;
  try {
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
  } catch {
    if (extname(decoded)) return false;
    file = resolve(root, 'index.html');
  }
  try {
    const content = await readFile(file);
    response.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream');
    response.setHeader('Content-Length', content.length);
    response.end(request.method === 'HEAD' ? undefined : content);
    return true;
  } catch { return false; }
}
