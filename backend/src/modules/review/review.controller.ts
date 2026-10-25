import type { Router } from '../../http/router.ts';
import type { V2AuthService } from '../auth/auth-v2.service.ts';
import type { ReviewService } from './review.service.ts';
export function reviewRoutes(router:Router,auth:V2AuthService,review:ReviewService){
  router.on('GET','/api/review/queue',async({request})=>({words:await review.queue((await auth.requireUser(request)).id)}));
  router.on('POST','/api/review/events',async({request,body})=>({event:await review.record((await auth.requireUser(request)).id,body)}),201);
}
