import type { Router } from '../../http/router.ts';
import type { AuthService } from '../auth/auth.service.ts';
import type { DictionaryService } from './dictionary.service.ts';

export function dictionaryRoutes(router: Router, auth: AuthService, dictionary: DictionaryService) {
  router.on('GET', '/api/dictionary/:term', async ({ params, request }) => {
    const language = new URL(request.url ?? '/', 'http://studyforge.local').searchParams.get('language') ?? 'en';
    return dictionary.lookup(params.term, (await auth.currentUser(request))?.id, language);
  });
}
