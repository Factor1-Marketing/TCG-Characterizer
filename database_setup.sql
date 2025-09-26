-- Create the user_submissions table in Supabase
-- Run this SQL in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS user_submissions (
    id BIGSERIAL PRIMARY KEY,
    one_liner TEXT NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    brand VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on created_at for better query performance
CREATE INDEX IF NOT EXISTS idx_user_submissions_created_at ON user_submissions(created_at);

-- Create an index on user_name for potential future queries
CREATE INDEX IF NOT EXISTS idx_user_submissions_user_name ON user_submissions(user_name);

-- Add a trigger to automatically update the updated_at timestamp (skip if already exists)
-- Note: If you get an error about the trigger already existing, you can safely ignore it
-- as the trigger is already working properly

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Only create trigger if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_submissions_updated_at') THEN
        CREATE TRIGGER update_user_submissions_updated_at 
            BEFORE UPDATE ON user_submissions 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Enable Row Level Security (RLS) for better security
ALTER TABLE user_submissions ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to insert new submissions
DROP POLICY IF EXISTS "Allow public insert on user_submissions" ON user_submissions;
CREATE POLICY "Allow public insert on user_submissions" ON user_submissions
    FOR INSERT WITH CHECK (true);

-- Create a policy that allows anyone to read submissions (for the game)
DROP POLICY IF EXISTS "Allow public read on user_submissions" ON user_submissions;
CREATE POLICY "Allow public read on user_submissions" ON user_submissions
    FOR SELECT USING (true);

-- Optional: Create a policy that allows users to update their own submissions
-- (You might want to add a user_id field later for this to work properly)
-- CREATE POLICY "Allow users to update own submissions" ON user_submissions
--     FOR UPDATE USING (auth.uid() = user_id);

-- Enable realtime for the user_submissions table (skip if already added)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'user_submissions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE user_submissions;
    END IF;
END $$;

-- Create game_state table for synchronized gameplay
CREATE TABLE IF NOT EXISTS game_state (
    id SERIAL PRIMARY KEY,
    current_round INTEGER DEFAULT 0,
    game_status VARCHAR(50) DEFAULT 'waiting', -- waiting, playing, showing_results
    current_quote_id BIGINT,
    time_remaining INTEGER DEFAULT 0,
    round_start_time TIMESTAMP WITH TIME ZONE,
    used_quotes TEXT DEFAULT '[]', -- JSON array of used quote IDs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create player_scores table to track individual scores
CREATE TABLE IF NOT EXISTS player_scores (
    id SERIAL PRIMARY KEY,
    player_name VARCHAR(255) NOT NULL,
    round_number INTEGER NOT NULL,
    selected_answer VARCHAR(255),
    correct_answer VARCHAR(255),
    is_correct BOOLEAN DEFAULT FALSE,
    response_time INTEGER, -- milliseconds to respond
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable realtime for game_state table (skip if already added)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'game_state'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE game_state;
    END IF;
END $$;

-- Enable realtime for player_scores table (skip if already added)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'player_scores'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE player_scores;
    END IF;
END $$;

-- Create policies for game_state
ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on game_state" ON game_state;
CREATE POLICY "Allow public read on game_state" ON game_state FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow authorized users to update game_state" ON game_state;
CREATE POLICY "Allow authorized users to update game_state" ON game_state FOR UPDATE USING (true);

-- Create policies for player_scores
ALTER TABLE player_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public insert on player_scores" ON player_scores;
CREATE POLICY "Allow public insert on player_scores" ON player_scores FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public read on player_scores" ON player_scores;
CREATE POLICY "Allow public read on player_scores" ON player_scores FOR SELECT USING (true);
