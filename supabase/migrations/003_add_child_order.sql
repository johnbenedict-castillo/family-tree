-- Add child_order column for ordering children
ALTER TABLE family_members
  ADD COLUMN IF NOT EXISTS child_order INTEGER DEFAULT 0;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_family_members_child_order ON family_members(parent_id, child_order);

