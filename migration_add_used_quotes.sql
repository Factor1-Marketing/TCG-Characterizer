-- Migration: Add used_quotes column to existing game_state table
-- Run this if you get "column game_state.used_quotes does not exist" error

-- Add the used_quotes column to the existing game_state table
ALTER TABLE game_state 
ADD COLUMN IF NOT EXISTS used_quotes TEXT DEFAULT '[]';

-- Update any existing rows to have an empty used_quotes array
UPDATE game_state 
SET used_quotes = '[]' 
WHERE used_quotes IS NULL;

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'game_state' 
AND column_name = 'used_quotes';
