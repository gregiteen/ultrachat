ALTER TABLE messages
ADD COLUMN files text[] DEFAULT '{}'::text[];