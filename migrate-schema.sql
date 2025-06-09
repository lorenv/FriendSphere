-- Add new columns to friends table
ALTER TABLE friends ADD COLUMN first_name text;
ALTER TABLE friends ADD COLUMN last_name text;
ALTER TABLE friends ADD COLUMN how_we_met text;

-- Migrate existing name data to first_name
UPDATE friends SET first_name = split_part(name, ' ', 1);
UPDATE friends SET last_name = CASE 
  WHEN array_length(string_to_array(name, ' '), 1) > 1 
  THEN array_to_string(string_to_array(name, ' ')[2:], ' ')
  ELSE NULL
END;

-- Make first_name not null after migration
ALTER TABLE friends ALTER COLUMN first_name SET NOT NULL;

-- Drop the old name column
ALTER TABLE friends DROP COLUMN name;