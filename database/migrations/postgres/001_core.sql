-- StudyForge V2: personal vocabulary foundation. Run only on PostgreSQL.
CREATE TYPE learning_status AS ENUM ('new', 'learning', 'known');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) NOT NULL,
  email_normalized varchar(255) NOT NULL UNIQUE,
  password_hash text NOT NULL,
  display_name varchar(100) NOT NULL CHECK (length(trim(display_name)) > 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_settings (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  preferred_definition_language varchar(5) NOT NULL DEFAULT 'en'
    CHECK (preferred_definition_language IN ('en', 'vi')),
  daily_review_goal integer NOT NULL DEFAULT 20 CHECK (daily_review_goal BETWEEN 1 AND 1000),
  timezone varchar(64) NOT NULL DEFAULT 'UTC',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE auth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash char(64) NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  CHECK (expires_at > created_at)
);
CREATE INDEX auth_sessions_user_expires ON auth_sessions(user_id, expires_at);

CREATE TABLE collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL CHECK (length(trim(name)) > 0),
  normalized_name varchar(100) NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, normalized_name),
  UNIQUE (user_id, id)
);

CREATE TABLE lexemes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language_code varchar(10) NOT NULL DEFAULT 'en',
  term varchar(255) NOT NULL CHECK (length(trim(term)) > 0),
  normalized_term varchar(255) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (language_code, normalized_term)
);

CREATE TABLE saved_words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lexeme_id uuid NOT NULL REFERENCES lexemes(id) ON DELETE RESTRICT,
  collection_id uuid NOT NULL,
  status learning_status NOT NULL DEFAULT 'new',
  personal_note text,
  saved_at timestamptz NOT NULL DEFAULT now(),
  status_changed_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lexeme_id),
  FOREIGN KEY (user_id, collection_id) REFERENCES collections(user_id, id) ON DELETE RESTRICT
);
CREATE INDEX saved_words_collection_list ON saved_words(user_id, collection_id, saved_at DESC);
CREATE INDEX saved_words_status ON saved_words(user_id, status);

CREATE TABLE review_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_word_id uuid NOT NULL REFERENCES saved_words(id) ON DELETE CASCADE,
  review_mode varchar(40) NOT NULL,
  prompt_type varchar(40),
  rating smallint CHECK (rating BETWEEN 1 AND 4),
  correct boolean,
  duration_ms integer CHECK (duration_ms >= 0),
  reviewed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX review_events_word_time ON review_events(saved_word_id, reviewed_at DESC);
