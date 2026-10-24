-- Dictionary content is optional. A live-only source can be registered for API lookup,
-- but its definitions, examples, translations and related terms cannot be persisted here.
CREATE TABLE dictionary_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(60) NOT NULL UNIQUE,
  display_name varchar(150) NOT NULL,
  license_name varchar(120),
  license_url text,
  attribution_text text,
  storage_policy varchar(24) NOT NULL DEFAULT 'live_only'
    CHECK (storage_policy IN ('live_only', 'licensed_persist')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE dictionary_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lexeme_id uuid NOT NULL REFERENCES lexemes(id) ON DELETE RESTRICT,
  source_id uuid NOT NULL REFERENCES dictionary_sources(id) ON DELETE RESTRICT,
  provider_entry_key varchar(255) NOT NULL,
  part_of_speech varchar(60) NOT NULL,
  grammar_label varchar(160),
  display_order integer NOT NULL DEFAULT 1 CHECK (display_order > 0),
  fetched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_id, provider_entry_key)
);
CREATE INDEX dictionary_entries_lookup ON dictionary_entries(lexeme_id, source_id, display_order);

CREATE TABLE dictionary_pronunciations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES dictionary_entries(id) ON DELETE CASCADE,
  ipa varchar(160),
  region_code varchar(12),
  audio_token varchar(160),
  display_order integer NOT NULL DEFAULT 1 CHECK (display_order > 0),
  CHECK (ipa IS NOT NULL OR audio_token IS NOT NULL),
  UNIQUE (entry_id, display_order)
);

CREATE TABLE dictionary_senses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES dictionary_entries(id) ON DELETE CASCADE,
  display_order integer NOT NULL CHECK (display_order > 0),
  sense_number varchar(40),
  sense_path varchar(160),
  definition_en text NOT NULL CHECK (length(trim(definition_en)) > 0),
  usage_labels jsonb,
  UNIQUE (entry_id, display_order)
);

CREATE TABLE sense_examples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sense_id uuid NOT NULL REFERENCES dictionary_senses(id) ON DELETE CASCADE,
  example_en text NOT NULL CHECK (length(trim(example_en)) > 0),
  display_order integer NOT NULL CHECK (display_order > 0),
  UNIQUE (sense_id, display_order)
);

CREATE TABLE sense_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sense_id uuid NOT NULL REFERENCES dictionary_senses(id) ON DELETE CASCADE,
  language_code varchar(12) NOT NULL DEFAULT 'vi',
  translated_definition text NOT NULL CHECK (length(trim(translated_definition)) > 0),
  translation_method varchar(20) NOT NULL
    CHECK (translation_method IN ('human', 'machine', 'dictionary')),
  reviewed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sense_id, language_code)
);

CREATE TABLE related_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lexeme_id uuid NOT NULL REFERENCES lexemes(id) ON DELETE RESTRICT,
  source_id uuid NOT NULL REFERENCES dictionary_sources(id) ON DELETE RESTRICT,
  related_term varchar(255) NOT NULL,
  normalized_related_term varchar(255) NOT NULL,
  part_of_speech varchar(60),
  relation_kind varchar(30) NOT NULL DEFAULT 'derived'
    CHECK (relation_kind IN ('derived', 'inflection', 'related')),
  display_order integer NOT NULL DEFAULT 1 CHECK (display_order > 0),
  UNIQUE (lexeme_id, source_id, normalized_related_term, relation_kind)
);

CREATE FUNCTION enforce_dictionary_storage_policy() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM dictionary_sources
    WHERE id = NEW.source_id AND storage_policy = 'licensed_persist'
  ) THEN
    RAISE EXCEPTION 'Dictionary source does not allow persistent content';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER dictionary_entries_storage_policy
  BEFORE INSERT OR UPDATE OF source_id ON dictionary_entries
  FOR EACH ROW EXECUTE FUNCTION enforce_dictionary_storage_policy();
CREATE TRIGGER related_terms_storage_policy
  BEFORE INSERT OR UPDATE OF source_id ON related_terms
  FOR EACH ROW EXECUTE FUNCTION enforce_dictionary_storage_policy();

CREATE FUNCTION prevent_dictionary_policy_downgrade() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.storage_policy = 'live_only' AND OLD.storage_policy = 'licensed_persist'
     AND (EXISTS (SELECT 1 FROM dictionary_entries WHERE source_id = OLD.id)
          OR EXISTS (SELECT 1 FROM related_terms WHERE source_id = OLD.id)) THEN
    RAISE EXCEPTION 'Remove persisted content before changing source to live_only';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER dictionary_source_policy_downgrade
  BEFORE UPDATE OF storage_policy ON dictionary_sources
  FOR EACH ROW EXECUTE FUNCTION prevent_dictionary_policy_downgrade();
