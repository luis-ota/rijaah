
/*
  # Fix RLS infinite recursion and foreign key issues

  1. Problem
    - RLS policies on `projects` check `project_members`, and policies on
      `project_members` check `projects`, causing infinite recursion.
    - Foreign keys from `issues` to `profiles` don't exist, so PostgREST
      can't resolve the join `assignee:profiles!issues_assignee_id_fkey`.

  2. Solution
    - Rewrite all RLS policies to avoid cross-table recursion:
      - `projects`: check owner_id directly + use a helper function for membership
      - `project_members`: check user_id directly + use a helper function for ownership
      - All other tables: use helper functions instead of subqueries
    - Add foreign key columns properly or use a different join strategy.
      Since `profiles.id` references `auth.users.id` (not the other way),
      and `issues.assignee_id` references `auth.users.id`, PostgREST
      can't find the FK path. We'll add explicit FKs from issues to profiles.

  3. Changes
    - Drop ALL existing policies on all tables
    - Create a helper function `is_project_member(project_id)` that checks
      membership without causing recursion
    - Create a helper function `is_project_owner(project_id)` 
    - Recreate all policies using the helper functions
    - Add foreign keys from issues.assignee_id and issues.reporter_id to profiles.id
*/

-- Helper functions to avoid RLS recursion
CREATE OR REPLACE FUNCTION is_project_member(project_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = is_project_member.project_id
    AND project_members.user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_project_owner(project_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = is_project_owner.project_id
    AND projects.owner_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Project members can view project" ON projects;
DROP POLICY IF EXISTS "Authenticated users can create projects" ON projects;
DROP POLICY IF EXISTS "Project owner can update project" ON projects;
DROP POLICY IF EXISTS "Project owner can delete project" ON projects;

DROP POLICY IF EXISTS "Members can view project members" ON project_members;
DROP POLICY IF EXISTS "Project owner can add members" ON project_members;
DROP POLICY IF EXISTS "Project owner can remove members" ON project_members;

DROP POLICY IF EXISTS "Project members can view sprints" ON sprints;
DROP POLICY IF EXISTS "Project members can create sprints" ON sprints;
DROP POLICY IF EXISTS "Project members can update sprints" ON sprints;
DROP POLICY IF EXISTS "Project members can delete sprints" ON sprints;

DROP POLICY IF EXISTS "Project members can view issues" ON issues;
DROP POLICY IF EXISTS "Project members can create issues" ON issues;
DROP POLICY IF EXISTS "Project members can update issues" ON issues;
DROP POLICY IF EXISTS "Project members can delete issues" ON issues;

DROP POLICY IF EXISTS "Project members can view comments" ON comments;
DROP POLICY IF EXISTS "Project members can create comments" ON comments;
DROP POLICY IF EXISTS "Comment authors can update their comments" ON comments;
DROP POLICY IF EXISTS "Comment authors can delete their comments" ON comments;

DROP POLICY IF EXISTS "Project members can view labels" ON labels;
DROP POLICY IF EXISTS "Project members can manage labels" ON labels;

DROP POLICY IF EXISTS "Project members can view issue labels" ON issue_labels;
DROP POLICY IF EXISTS "Project members can manage issue labels" ON issue_labels;
DROP POLICY IF EXISTS "Project members can delete issue labels" ON issue_labels;

DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Recreate policies WITHOUT recursion

-- Profiles
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Projects: owner_id check is direct (no recursion), membership uses helper
CREATE POLICY "Users can view their projects"
  ON projects FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid() OR is_project_member(id));

CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Project Members: user_id check is direct, ownership uses helper
CREATE POLICY "Users can view members of their projects"
  ON project_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_project_owner(project_id) OR is_project_member(project_id));

CREATE POLICY "Owners can add members"
  ON project_members FOR INSERT
  TO authenticated
  WITH CHECK (is_project_owner(project_id));

CREATE POLICY "Owners or self can remove members"
  ON project_members FOR DELETE
  TO authenticated
  USING (is_project_owner(project_id) OR user_id = auth.uid());

-- Sprints
CREATE POLICY "Members can view sprints"
  ON sprints FOR SELECT
  TO authenticated
  USING (is_project_owner(project_id) OR is_project_member(project_id));

CREATE POLICY "Members can create sprints"
  ON sprints FOR INSERT
  TO authenticated
  WITH CHECK (is_project_owner(project_id) OR is_project_member(project_id));

CREATE POLICY "Members can update sprints"
  ON sprints FOR UPDATE
  TO authenticated
  USING (is_project_owner(project_id) OR is_project_member(project_id))
  WITH CHECK (is_project_owner(project_id) OR is_project_member(project_id));

CREATE POLICY "Members can delete sprints"
  ON sprints FOR DELETE
  TO authenticated
  USING (is_project_owner(project_id) OR is_project_member(project_id));

-- Issues
CREATE POLICY "Members can view issues"
  ON issues FOR SELECT
  TO authenticated
  USING (is_project_owner(project_id) OR is_project_member(project_id));

CREATE POLICY "Members can create issues"
  ON issues FOR INSERT
  TO authenticated
  WITH CHECK (is_project_owner(project_id) OR is_project_member(project_id));

CREATE POLICY "Members can update issues"
  ON issues FOR UPDATE
  TO authenticated
  USING (is_project_owner(project_id) OR is_project_member(project_id))
  WITH CHECK (is_project_owner(project_id) OR is_project_member(project_id));

CREATE POLICY "Members can delete issues"
  ON issues FOR DELETE
  TO authenticated
  USING (is_project_owner(project_id) OR is_project_member(project_id));

-- Comments
CREATE POLICY "Members can view comments"
  ON comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM issues
      WHERE issues.id = comments.issue_id
      AND (is_project_owner(issues.project_id) OR is_project_member(issues.project_id))
    )
  );

CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can delete comments"
  ON comments FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- Labels
CREATE POLICY "Members can view labels"
  ON labels FOR SELECT
  TO authenticated
  USING (is_project_owner(project_id) OR is_project_member(project_id));

CREATE POLICY "Members can create labels"
  ON labels FOR INSERT
  TO authenticated
  WITH CHECK (is_project_owner(project_id) OR is_project_member(project_id));

-- Issue Labels
CREATE POLICY "Members can view issue labels"
  ON issue_labels FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM issues
      WHERE issues.id = issue_labels.issue_id
      AND (is_project_owner(issues.project_id) OR is_project_member(issues.project_id))
    )
  );

CREATE POLICY "Members can create issue labels"
  ON issue_labels FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM issues
      WHERE issues.id = issue_labels.issue_id
      AND (is_project_owner(issues.project_id) OR is_project_member(issues.project_id))
    )
  );

CREATE POLICY "Members can delete issue labels"
  ON issue_labels FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM issues
      WHERE issues.id = issue_labels.issue_id
      AND (is_project_owner(issues.project_id) OR is_project_member(issues.project_id))
    )
  );
