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

-- Add a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_submissions_updated_at 
    BEFORE UPDATE ON user_submissions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for better security
ALTER TABLE user_submissions ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to insert new submissions
CREATE POLICY "Allow public insert on user_submissions" ON user_submissions
    FOR INSERT WITH CHECK (true);

-- Create a policy that allows anyone to read submissions (for the game)
CREATE POLICY "Allow public read on user_submissions" ON user_submissions
    FOR SELECT USING (true);

-- Optional: Create a policy that allows users to update their own submissions
-- (You might want to add a user_id field later for this to work properly)
-- CREATE POLICY "Allow users to update own submissions" ON user_submissions
--     FOR UPDATE USING (auth.uid() = user_id);
