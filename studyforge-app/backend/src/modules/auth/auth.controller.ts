import type { Router } from '../../http/router.ts';
import type { AuthService } from './auth.service.ts';

export function authRoutes(router: Router, auth: AuthService) {
  router.on('GET', '/api/auth/me', async ({ request }) => ({ user: await auth.currentUser(request) }));
  router.on('POST', '/api/auth/register', ({ body, response }) => auth.register(body, response), 201);
  router.on('POST', '/api/auth/login', ({ body, response }) => auth.login(body, response));
  router.on('POST', '/api/auth/logout', ({ request, response }) => auth.logout(request, response));
}
