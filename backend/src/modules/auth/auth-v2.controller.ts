import type { Router } from '../../http/router.ts';
import type { V2AuthService } from './auth-v2.service.ts';

export function authV2Routes(router: Router, auth: V2AuthService) {
  router.on('GET', '/api/auth/me', async ({ request }) => ({ user: await auth.currentUser(request) }));
  router.on('POST', '/api/auth/register', ({ body, response }) => auth.register(body, response), 201);
  router.on('POST', '/api/auth/login', ({ body, response }) => auth.login(body, response));
  router.on('POST', '/api/auth/logout', ({ request, response }) => auth.logout(request, response));
}
