import type { Router } from '../../http/router.ts';
import type { V2AuthService } from '../auth/auth-v2.service.ts';
import type { VocabularyService } from './vocabulary.service.ts';
import { HttpError } from '../../shared/errors.ts';

const uuid = (value: string) => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) throw new HttpError(400, 'INVALID_ID', 'ID không hợp lệ.');
  return value;
};
export function vocabularyRoutes(router: Router, auth: V2AuthService, vocabulary: VocabularyService) {
  router.on('GET', '/api/words', async ({ request }) => {
    const user = await auth.requireUser(request);
    const query = new URL(request.url ?? '/', 'http://studyforge.local').searchParams;
    const collectionId = query.get('collectionId') ?? undefined;
    if (collectionId) uuid(collectionId);
    const status = query.get('status') ?? undefined;
    const search = query.get('q') ?? undefined;
    return { words: await vocabulary.list(user.id,{ collectionId, status: status as 'new' | 'learning' | 'known' | undefined,query: search }) };
  });
  router.on('GET', '/api/words/stats', async ({ request }) => ({ stats: await vocabulary.stats((await auth.requireUser(request)).id) }));
  router.on('POST', '/api/words', async ({ request, body }) => vocabulary.save((await auth.requireUser(request)).id,body), 201);
  router.on('PATCH', '/api/words/:id/collection', async ({ request, params, body }) => ({ word: await vocabulary.move((await auth.requireUser(request)).id,uuid(params.id),body) }));
  router.on('PATCH', '/api/words/:id/status', async ({ request, params, body }) => ({ word: await vocabulary.setStatus((await auth.requireUser(request)).id,uuid(params.id),body) }));
}
