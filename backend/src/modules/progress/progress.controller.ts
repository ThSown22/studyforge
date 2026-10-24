import type { Router } from '../../http/router.ts';
import type { AuthService } from '../auth/auth.service.ts';
import type { LearningService } from '../curriculum/curriculum.service.ts';
import type { AssessmentService } from '../assessment/assessment.service.ts';

export function progressRoutes(router: Router, auth: AuthService, learning: LearningService, assessment: AssessmentService) {
  router.on('GET', '/api/dashboard', ({ request }) => learning.dashboard(auth.currentUser(request)));
  router.on('GET', '/api/review', ({ request }) => assessment.review(auth.requireUser(request)));
  router.on('POST', '/api/review/:id/resolve', ({ request, params, body }) => assessment.resolveReview(params.id, auth.requireUser(request), body));
}
