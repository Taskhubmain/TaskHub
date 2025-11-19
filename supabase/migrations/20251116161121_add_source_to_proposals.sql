/*
  # Add source tracking to proposals

  1. Changes
    - Add `source` column to `proposals` table
      - Values: 'manual', 'recommendation'
      - Default: 'manual'
      - Tracks if proposal was created from AI recommendation
    
  2. Security
    - No changes to RLS policies needed
*/

-- Add source column to proposals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'source'
  ) THEN
    ALTER TABLE proposals ADD COLUMN source text DEFAULT 'manual' CHECK (source IN ('manual', 'recommendation'));
  END IF;
END $$;

-- Create index for filtering by source
CREATE INDEX IF NOT EXISTS idx_proposals_source ON proposals(source);
