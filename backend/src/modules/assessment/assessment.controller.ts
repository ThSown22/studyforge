import type { Router } from '../../http/router.ts';
import type { AuthService } from '../auth/auth.service.ts';
import type { LearningService } from '../curriculum/curriculum.service.ts';
import type { AssessmentService } from './assessment.service.ts';

export function assessmentRoutes(router: Router, auth: AuthService, learning: LearningService, assessment: AssessmentService) {
  router.on('GET', '/api/lessons/:id/quiz', ({ request, params }) => learning.quiz(params.id, auth.currentUser(request)));
  router.on('POST', '/api/lessons/:id/attempts', ({ request, params, body }) => assessment.submit('lesson', params.id, auth.currentUser(request), body));
  router.on('GET', '/api/units/:id/challenge', ({ request, params }) => learning.challenge(params.id, auth.requireUser(request)));
  router.on('POST', '/api/units/:id/attempts', ({ request, params, body }) => assessment.submit('challenge', params.id, auth.requireUser(request), body));
}
