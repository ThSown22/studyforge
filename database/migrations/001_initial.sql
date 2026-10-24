CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL);
CREATE TABLE users (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL, xp INTEGER NOT NULL DEFAULT 0 CHECK(xp >= 0), created_at TEXT NOT NULL
);
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX sessions_user ON sessions(user_id);
CREATE TABLE units (
  id TEXT PRIMARY KEY, track TEXT NOT NULL CHECK(track IN ('grammar','vocabulary')),
  title TEXT NOT NULL, subtitle TEXT NOT NULL, description TEXT NOT NULL, position INTEGER NOT NULL,
  color TEXT NOT NULL, UNIQUE(track,position)
);
CREATE TABLE lessons (
  id TEXT PRIMARY KEY, unit_id TEXT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  title TEXT NOT NULL, category TEXT NOT NULL, description TEXT NOT NULL,
  position INTEGER NOT NULL, xp INTEGER NOT NULL DEFAULT 40, UNIQUE(unit_id,position)
);
CREATE TABLE lesson_sections (
  id TEXT PRIMARY KEY, lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  position INTEGER NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL, formula TEXT,
  examples_json TEXT NOT NULL, UNIQUE(lesson_id,position)
);
CREATE TABLE flashcards (
  id TEXT PRIMARY KEY, lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  position INTEGER NOT NULL, word TEXT NOT NULL, phonetic TEXT NOT NULL, part_of_speech TEXT NOT NULL,
  meaning TEXT NOT NULL, example TEXT NOT NULL, translation TEXT NOT NULL, UNIQUE(lesson_id,position)
);
CREATE TABLE questions (
  id TEXT PRIMARY KEY, lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  position INTEGER NOT NULL, prompt TEXT NOT NULL, type TEXT NOT NULL CHECK(type IN ('choice','text')),
  options_json TEXT, answer TEXT NOT NULL, explanation TEXT NOT NULL, UNIQUE(lesson_id,position)
);
CREATE TABLE progress (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  learned INTEGER NOT NULL DEFAULT 0, completed INTEGER NOT NULL DEFAULT 0,
  best_score INTEGER NOT NULL DEFAULT 0 CHECK(best_score BETWEEN 0 AND 100),
  completed_at TEXT, updated_at TEXT NOT NULL, PRIMARY KEY(user_id,lesson_id)
);
CREATE TABLE attempts (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id TEXT REFERENCES lessons(id), unit_id TEXT REFERENCES units(id),
  kind TEXT NOT NULL CHECK(kind IN ('lesson','challenge')), score INTEGER NOT NULL,
  passed INTEGER NOT NULL, xp_earned INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL,
  idempotency_key TEXT NOT NULL, request_hash TEXT NOT NULL, result_json TEXT NOT NULL,
  CHECK((lesson_id IS NOT NULL AND unit_id IS NULL) OR (lesson_id IS NULL AND unit_id IS NOT NULL)),
  UNIQUE(user_id,idempotency_key)
);
CREATE TABLE attempt_answers (
  attempt_id TEXT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id), answer TEXT NOT NULL,
  correct INTEGER NOT NULL, PRIMARY KEY(attempt_id,question_id)
);
CREATE TABLE review_items (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id), answer TEXT NOT NULL,
  created_at TEXT NOT NULL, resolved_at TEXT, UNIQUE(user_id,question_id)
);
CREATE TABLE unit_unlocks (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unit_id TEXT NOT NULL REFERENCES units(id), created_at TEXT NOT NULL,
  PRIMARY KEY(user_id,unit_id)
);
CREATE TABLE feedback (
  id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  category TEXT NOT NULL, message TEXT NOT NULL, email TEXT, created_at TEXT NOT NULL
);
CREATE TABLE seed_versions (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL);
