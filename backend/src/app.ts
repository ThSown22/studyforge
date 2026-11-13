import { createServer } from 'node:http';
import type { Server } from 'node:http';
import type { Pool } from 'pg';
import { createPostgresPool } from './infrastructure/database/postgres.ts';
import { getConfig } from './config/env.ts';
import { Router } from './http/router.ts';
import { createRequestHandler } from './http/handler.ts';
import { PostgresAuthRepository } from './modules/auth/auth.repository.ts';
import { AuthService } from './modules/auth/auth.service.ts';
import { authRoutes } from './modules/auth/auth.controller.ts';
import { PostgresCollectionRepository } from './modules/collections/collections.repository.ts';
import { CollectionsService } from './modules/collections/collections.service.ts';
import { collectionRoutes } from './modules/collections/collections.controller.ts';
import { PostgresVocabularyRepository } from './modules/vocabulary/vocabulary.repository.ts';
import { VocabularyService } from './modules/vocabulary/vocabulary.service.ts';
import { vocabularyRoutes } from './modules/vocabulary/vocabulary.controller.ts';
import { DictionaryService } from './modules/dictionary/dictionary.service.ts';
import { MerriamClient } from './modules/dictionary/merriam.client.ts';
import { dictionaryRoutes } from './modules/dictionary/dictionary.controller.ts';
import { ReviewService } from './modules/review/review.service.ts';
import { reviewRoutes } from './modules/review/review.controller.ts';

export interface App { server: Server; db: Pool; close: () => Promise<void> }
export function createApp() : App {
  const config = getConfig();
  const db = createPostgresPool();
  const auth = new AuthService(new PostgresAuthRepository(db),config.secureCookies,config.sessionTtlSeconds);
  const collections = new CollectionsService(new PostgresCollectionRepository(db));
  const vocabulary = new VocabularyService(new PostgresVocabularyRepository(db));
  const dictionary = new DictionaryService(new MerriamClient(),new PostgresVocabularyRepository(db));
  const router = new Router();
  router.on('GET','/api/health',async () => {
    await db.query('SELECT 1');
    return { status:'ok',service:'StudyForge V2 API',database:'postgresql' };
  });
  authRoutes(router,auth);
  collectionRoutes(router,auth,collections);
  vocabularyRoutes(router,auth,vocabulary);
  dictionaryRoutes(router,auth,dictionary);
  reviewRoutes(router,auth,new ReviewService(db));
  const server=createServer(createRequestHandler(router,{ allowedOrigins:config.allowedOrigins,frontendDir:process.env.FRONTEND_DIR || '/app/empty-public' }));
  server.requestTimeout=15000; server.headersTimeout=10000;
  return {server,db,close:async()=>{
    if (server.listening) await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
    await db.end();
  }};
}
