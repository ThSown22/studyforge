import type { Router } from '../../http/router.ts';
import type { AuthService } from '../auth/auth.service.ts';
import type { DictionaryService } from './dictionary.service.ts';

export function dictionaryRoutes(router: Router, auth: AuthService, dictionary: DictionaryService) {
  router.on('GET', '/api/dictionary/:term', async ({ params, request }) => dictionary.lookup(params.term,(await auth.currentUser(request))?.id));
}
