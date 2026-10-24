import type { Router } from '../../http/router.ts';
import type { AuthService } from '../auth/auth.service.ts';
import type { ProfileService } from './profile.service.ts';

export function profileRoutes(router: Router, auth: AuthService, profile: ProfileService): void {
  router.on('GET', '/api/profile', ({ request }) => profile.get(auth.requireUser(request)));
  router.on('PATCH', '/api/profile', ({ request, body }) => profile.update(auth.requireUser(request), body));
}
