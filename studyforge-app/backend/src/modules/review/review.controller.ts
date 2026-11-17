import type { Router } from '../../http/router.ts';
import type { AuthService } from '../auth/auth.service.ts';
import type { ReviewService } from './review.service.ts';
export function reviewRoutes(router:Router,auth:AuthService,review:ReviewService){
  router.on('GET','/api/review/queue',async({request})=>{
    const collectionId=new URL(request.url??'/','http://studyforge.local').searchParams.get('collectionId')??undefined;
    return{words:await review.queue((await auth.requireUser(request)).id,collectionId)};
  });
  router.on('POST','/api/review/events',async({request,body})=>({event:await review.record((await auth.requireUser(request)).id,body)}),201);
}
