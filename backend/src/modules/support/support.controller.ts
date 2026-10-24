import type { Router } from '../../http/router.ts';
import type { AuthService } from '../auth/auth.service.ts';
import type { SupportService } from './support.service.ts';

export function supportRoutes(router: Router, auth: AuthService, support: SupportService): void {
  router.on('POST', '/api/support', ({ request, body }) => support.submit(body, auth.currentUser(request)), 201);
}
