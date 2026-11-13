import type { Router } from '../../http/router.ts';
import type { AuthService } from '../auth/auth.service.ts';
import type { CollectionsService } from './collections.service.ts';
import { HttpError } from '../../shared/errors.ts';

const uuid = (value: string) => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) throw new HttpError(400, 'INVALID_ID', 'ID không hợp lệ.');
  return value;
};
export function collectionRoutes(router: Router, auth: AuthService, collections: CollectionsService) {
  router.on('GET', '/api/collections', async ({ request }) => ({ collections: await collections.list((await auth.requireUser(request)).id) }));
  router.on('POST', '/api/collections', async ({ request, body }) => ({ collection: await collections.create((await auth.requireUser(request)).id,body) }), 201);
  router.on('PATCH', '/api/collections/:id', async ({ request, params, body }) => ({ collection: await collections.update((await auth.requireUser(request)).id,uuid(params.id),body) }));
  router.on('DELETE', '/api/collections/:id', async ({ request, params }) => collections.remove((await auth.requireUser(request)).id,uuid(params.id)));
}
