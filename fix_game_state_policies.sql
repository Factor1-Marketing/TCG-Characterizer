-- Fix RLS policies for game_state table
-- Run this to fix "new row violates row-level security policy" error

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read on game_state" ON game_state;
DROP POLICY IF EXISTS "Allow authorized users to update game_state" ON game_state;

-- Create new policies that allow both read and write operations
CREATE POLICY "Allow public read on game_state" ON game_state FOR SELECT USING (true);
CREATE POLICY "Allow public insert on game_state" ON game_state FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on game_state" ON game_state FOR UPDATE USING (true);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'game_state';
