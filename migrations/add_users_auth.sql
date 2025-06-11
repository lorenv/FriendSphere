-- Add users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  photo TEXT,
  phone TEXT,
  location TEXT,
  bio TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add userId column to existing tables
ALTER TABLE friends ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE relationships ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS user_id INTEGER;

-- Create contact shares table
CREATE TABLE IF NOT EXISTS contact_shares (
  id SERIAL PRIMARY KEY,
  from_user_id INTEGER NOT NULL,
  to_user_id INTEGER NOT NULL,
  share_data TEXT NOT NULL,
  message TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  is_accepted BOOLEAN DEFAULT FALSE
);

-- Add foreign key constraints
ALTER TABLE friends ADD CONSTRAINT fk_friends_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE relationships ADD CONSTRAINT fk_relationships_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE activities ADD CONSTRAINT fk_activities_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE contact_shares ADD CONSTRAINT fk_contact_shares_from_user FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE contact_shares ADD CONSTRAINT fk_contact_shares_to_user FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_relationships_user_id ON relationships(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_shares_from_user ON contact_shares(from_user_id);
CREATE INDEX IF NOT EXISTS idx_contact_shares_to_user ON contact_shares(to_user_id);