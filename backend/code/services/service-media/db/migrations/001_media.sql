CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS media (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type          VARCHAR(20) NOT NULL,
  url           TEXT NOT NULL,
  thumbnail_url TEXT,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  date          DATE,
  person_id     UUID,
  uploaded_by   UUID,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_person ON media(person_id);

