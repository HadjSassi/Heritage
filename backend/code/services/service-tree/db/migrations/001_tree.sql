CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS family_trees (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id    UUID NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS persons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id     UUID NOT NULL REFERENCES family_trees(id) ON DELETE CASCADE,
  first_name  VARCHAR(100) NOT NULL,
  last_name   VARCHAR(100) NOT NULL,
  birth_date  DATE,
  birth_place VARCHAR(255),
  death_date  DATE,
  death_place VARCHAR(255),
  gender      VARCHAR(20) DEFAULT 'UNKNOWN',
  photo_url   TEXT,
  biography   TEXT,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS life_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id   UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  type        VARCHAR(50) NOT NULL,
  date        DATE,
  place       VARCHAR(255),
  description TEXT,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_persons_tree ON persons(tree_id);
CREATE INDEX IF NOT EXISTS idx_life_events_person ON life_events(person_id);

