-- Fix database constraints to allow same email with different roles

-- First, check what constraints exist on the users table
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'users'::regclass;

-- Drop the old unique constraint on email (if it exists)
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_email_key,
DROP CONSTRAINT IF EXISTS users_email_unique;

-- Add new composite unique constraint on email + role
ALTER TABLE users 
ADD CONSTRAINT users_email_role_key UNIQUE (email, role);

-- Verify the constraint was added
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'users'::regclass AND conname = 'users_email_role_key';
