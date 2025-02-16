-- Add pinned column to threads table
ALTER TABLE threads
ADD COLUMN pinned BOOLEAN DEFAULT false,
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add index for pinned threads
CREATE INDEX idx_threads_pinned ON threads(pinned) WHERE pinned = true;

-- Add index for soft deletes
CREATE INDEX idx_threads_deleted_at ON threads(deleted_at) WHERE deleted_at IS NOT NULL;