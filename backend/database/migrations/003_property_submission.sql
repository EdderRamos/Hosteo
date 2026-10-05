BEGIN;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS submitted_at timestamptz;
COMMIT;
