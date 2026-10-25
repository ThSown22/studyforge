import type { Router } from '../../http/router.ts';
import type { V2AuthService } from '../auth/auth-v2.service.ts';
import type { DictionaryService } from './dictionary.service.ts';

export function dictionaryRoutes(router: Router, auth: V2AuthService, dictionary: DictionaryService) {
  router.on('GET', '/api/dictionary/:term', async ({ params, request }) => dictionary.lookup(params.term,(await auth.currentUser(request))?.id));
}
