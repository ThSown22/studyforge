import { createServer } from 'node:http';
import type { Server } from 'node:http';
import type { DatabaseSync } from 'node:sqlite';
import { getConfig } from './config/env.ts';
import type { AppOptions } from './config/env.ts';
import { connectDatabase, migrate } from './infrastructure/database/connection.ts';
import { Router } from './http/router.ts';
import { createRequestHandler } from './http/handler.ts';
import { AuthRepository } from './modules/auth/auth.repository.ts';
import { AuthService } from './modules/auth/auth.service.ts';
import { authRoutes } from './modules/auth/auth.controller.ts';
import { LearningRepository } from './modules/curriculum/curriculum.repository.ts';
import { LearningService } from './modules/curriculum/curriculum.service.ts';
import { AssessmentService } from './modules/assessment/assessment.service.ts';
import { curriculumRoutes } from './modules/curriculum/curriculum.controller.ts';
import { assessmentRoutes } from './modules/assessment/assessment.controller.ts';
import { progressRoutes } from './modules/progress/progress.controller.ts';
import { ProfileService } from './modules/profile/profile.service.ts';
import { profileRoutes } from './modules/profile/profile.controller.ts';
import { SupportService } from './modules/support/support.service.ts';
import { supportRoutes } from './modules/support/support.controller.ts';

export interface App { server: Server; db: DatabaseSync; close: () => Promise<void> }

export function createApp(options: AppOptions = {}): App {
  const config = getConfig(options);
  const db = connectDatabase(config.databasePath);
  try { migrate(db); }
  catch (error) { db.close(); throw error; }
  const authRepository = new AuthRepository(db);
  const auth = new AuthService(authRepository, config.secureCookies, config.sessionTtlSeconds);
  const learning = new LearningService(new LearningRepository(db));
  const assessment = new AssessmentService(learning);
  const profile = new ProfileService(authRepository);
  const support = new SupportService(db);
  const router = new Router();
  router.on('GET', '/api/health', () => ({ status: 'ok', service: 'StudyForge API', database: 'sqlite' }));
  authRoutes(router, auth);
  curriculumRoutes(router, auth, learning);
  assessmentRoutes(router, auth, learning, assessment);
  progressRoutes(router, auth, learning, assessment);
  profileRoutes(router, auth, profile);
  supportRoutes(router, auth, support);
  const server = createServer(createRequestHandler(router, config));
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  let closed = false;
  return { server, db, close: async () => {
    if (closed) return;
    closed = true;
    if (server.listening) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    db.close();
  } };
}
