
/*
  # Fix foreign keys for PostgREST joins

  1. Problem
    - issues.assignee_id and issues.reporter_id reference auth.users, not profiles
    - PostgREST can't resolve `assignee:profiles!issues_assignee_id_fkey`
      because the FK points to auth.users, not public.profiles
    - project_members.user_id references auth.users, not profiles

  2. Solution
    - Drop existing FKs from issues to auth.users for assignee_id and reporter_id
    - Add new FKs from issues to profiles for assignee_id and reporter_id
    - Drop existing FK from project_members to auth.users for user_id
    - Add new FK from project_members to profiles for user_id
    - This allows PostgREST to resolve the join paths
*/

-- Fix issues.assignee_id -> profiles.id
ALTER TABLE issues DROP CONSTRAINT IF EXISTS issues_assignee_id_fkey;
ALTER TABLE issues ADD CONSTRAINT issues_assignee_id_fkey
  FOREIGN KEY (assignee_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Fix issues.reporter_id -> profiles.id
ALTER TABLE issues DROP CONSTRAINT IF EXISTS issues_reporter_id_fkey;
ALTER TABLE issues ADD CONSTRAINT issues_reporter_id_fkey
  FOREIGN KEY (reporter_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Fix project_members.user_id -> profiles.id
ALTER TABLE project_members DROP CONSTRAINT IF EXISTS project_members_user_id_fkey;
ALTER TABLE project_members ADD CONSTRAINT project_members_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Fix comments.author_id -> profiles.id
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_author_id_fkey;
ALTER TABLE comments ADD CONSTRAINT comments_author_id_fkey
  FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE;
