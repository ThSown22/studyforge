CREATE TABLE vocabulary_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  license TEXT NOT NULL CHECK(license IN ('CC0-1.0','CC-BY-4.0','CC-BY-SA-4.0','authored')),
  license_url TEXT,
  attribution TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE vocabulary_imports (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES vocabulary_sources(id),
  input_sha256 TEXT NOT NULL,
  total_rows INTEGER NOT NULL CHECK(total_rows >= 0),
  inserted_count INTEGER NOT NULL CHECK(inserted_count >= 0),
  duplicate_count INTEGER NOT NULL CHECK(duplicate_count >= 0),
  importer_version TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(source_id,input_sha256)
);

CREATE TABLE flashcard_provenance (
  flashcard_id TEXT PRIMARY KEY REFERENCES flashcards(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL REFERENCES vocabulary_sources(id),
  import_id TEXT NOT NULL REFERENCES vocabulary_imports(id),
  source_entry_key TEXT NOT NULL,
  imported_at TEXT NOT NULL,
  UNIQUE(source_id,source_entry_key)
);

CREATE INDEX flashcard_provenance_source ON flashcard_provenance(source_id);
CREATE INDEX vocabulary_imports_source ON vocabulary_imports(source_id,created_at);
