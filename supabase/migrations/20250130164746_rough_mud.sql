/*
  # Create locations table and admin features

  1. New Tables
    - `locations`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `address` (text)
      - `phone` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `active` (boolean)

  2. Security
    - Enable RLS on `locations` table
    - Add policies for:
      - Public read access for active locations
      - Admin-only write access
*/

CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  address text NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  active boolean DEFAULT true
);

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active locations
CREATE POLICY "Public can view active locations"
  ON locations
  FOR SELECT
  USING (active = true);

-- Allow admin users to manage locations
CREATE POLICY "Admins can manage locations"
  ON locations
  USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Add admin role to users table
ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (SELECT is_admin FROM auth.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;