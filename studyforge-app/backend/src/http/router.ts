import type { IncomingMessage, ServerResponse } from 'node:http';
import { HttpError } from '../shared/errors.ts';

export interface Context { request: IncomingMessage; response: ServerResponse; params: Record<string, string>; body: unknown }
type Handler = (context: Context) => unknown | Promise<unknown>;
interface Route { method: string; pattern: RegExp; keys: string[]; handler: Handler; status: number }

export class Router {
  routes: Route[] = [];
  on(method: string, path: string, handler: Handler, status = 200) {
    const keys: string[] = [];
    const pattern = new RegExp('^' + path.split('/').map(part => {
      if (part.startsWith(':')) { keys.push(part.slice(1)); return '([^/]+)'; }
      return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }).join('/') + '/?$');
    this.routes.push({ method, pattern, keys, handler, status });
  }
  async handle(request: IncomingMessage, response: ServerResponse, path: string, body: unknown) {
    for (const route of this.routes) {
      const match = path.match(route.pattern);
      if (!match || request.method !== route.method) continue;
      const params: Record<string, string> = {};
      route.keys.forEach((key, i) => {
        try { params[key] = decodeURIComponent(match[i + 1]); }
        catch { throw new HttpError(400, 'INVALID_PATH', 'Đường dẫn không hợp lệ.'); }
      });
      const result = await route.handler({ request, response, params, body });
      response.statusCode = route.status;
      response.setHeader('Content-Type', 'application/json; charset=utf-8');
      response.end(JSON.stringify(result));
      return true;
    }
    return false;
  }
}
