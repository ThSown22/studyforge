import { createServer, request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { createReadStream } from 'node:fs';
import { stat, readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { frontendOutput } from './paths.mjs';
import { frontendConfig, browserConfigScript } from './frontend-config.mjs';

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };

export function createFrontendServer({ port, host, backend, liveReload = false } = {}) {
  const config = frontendConfig();
  port ??= config.port;
  host ??= config.host;
  backend ??= config.backend;
  const clients = new Set();
  const server = createServer(async (req, res) => {
    if (req.url === '/config.js' && ['GET', 'HEAD'].includes(req.method || 'GET')) {
      res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      res.end(req.method === 'HEAD' ? undefined : browserConfigScript(config.publicConfig));
      return;
    }
    if (req.url?.startsWith('/api/')) {
      const target = new URL(req.url, backend);
      const request = target.protocol === 'https:' ? httpsRequest : httpRequest;
      const upstream = request(target, { method: req.method, headers: { ...req.headers, host: new URL(backend).host } }, (response) => {
        res.writeHead(response.statusCode || 502, response.headers);
        response.pipe(res);
      });
      upstream.on('error', () => {
        if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { code: 'BACKEND_UNAVAILABLE', message: 'Backend chưa sẵn sàng. Kiểm tra terminal API.' } }));
      });
      req.pipe(upstream);
      return;
    }
    if (liveReload && req.url === '/__dev/events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      res.write(': connected\n\n'); clients.add(res);
      req.on('close', () => clients.delete(res));
      return;
    }
    try {
      const pathname = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname);
      const candidate = resolve(frontendOutput, `.${pathname}`);
      if (candidate !== frontendOutput && !candidate.startsWith(frontendOutput + sep)) { res.writeHead(403); res.end('Forbidden'); return; }
      let file = candidate;
      let info;
      try { info = await stat(file); } catch { /* SPA history fallback below. */ }
      if (!info?.isFile()) {
        if (extname(pathname)) { res.writeHead(404); res.end('Not found'); return; }
        file = resolve(frontendOutput, 'index.html');
      }
      res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      if (liveReload && extname(file) === '.html') {
        const html = await readFile(file, 'utf8');
        res.end(html.replace('</body>', '<script>new EventSource("/__dev/events").onmessage=()=>location.reload()</script></body>'));
      } else createReadStream(file).pipe(res);
    } catch {
      if (!res.headersSent) res.writeHead(500);
      res.end('Frontend chưa build. Chạy npm run build trước.');
    }
  });
  return {
    server, clients,
    listen: () => new Promise((done, reject) => {
      server.once('error', reject);
      server.listen(port, host, () => {
        server.removeListener('error', reject);
        const address = server.address();
        console.log(`StudyForge frontend: http://${host}:${typeof address === 'object' && address ? address.port : port}`);
        done();
      });
    }),
    reload: () => { for (const client of clients) client.write('data: reload\n\n'); },
    close: () => { for (const client of clients) client.end(); server.close(); },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await createFrontendServer().listen();
