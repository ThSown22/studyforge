import type { Router } from '../../http/router.ts';
import type { AuthService } from '../auth/auth.service.ts';
import type { LearningService } from './curriculum.service.ts';

export function curriculumRoutes(router: Router, auth: AuthService, learning: LearningService) {
  router.on('GET', '/api/catalog', ({ request }) => learning.catalog(auth.currentUser(request)));
  router.on('GET', '/api/units/:id', ({ request, params }) => learning.unit(params.id, auth.currentUser(request)));
  router.on('GET', '/api/lessons/:id', ({ request, params }) => learning.detail(params.id, auth.currentUser(request)));
  router.on('POST', '/api/lessons/:id/learn', ({ request, params }) => learning.markLearned(params.id, auth.currentUser(request)));
}
