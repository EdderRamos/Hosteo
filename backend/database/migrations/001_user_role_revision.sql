-- Apply before starting the HU-05 backend against an existing PostgreSQL schema.
BEGIN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_revision bigint NOT NULL DEFAULT 0;
COMMIT;
