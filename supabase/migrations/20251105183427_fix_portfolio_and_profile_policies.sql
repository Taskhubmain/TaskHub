/*
  # Fix Portfolio and Profile Policies

  1. Changes
    - Add INSERT policy for profiles so users can create their own profile
    - Make role column nullable with default value in profiles table
  
  2. Security
    - Allow authenticated users to create their own profile
    - Maintain existing SELECT policies for public access
*/

-- Make role column nullable with a default value
ALTER TABLE profiles 
ALTER COLUMN role DROP NOT NULL,
ALTER COLUMN role SET DEFAULT 'freelancer';

-- Add INSERT policy for profiles
CREATE POLICY "Users can create own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);