
/*
  # Jira Clone Schema

  1. New Tables
    - `projects` - Software projects
      - id, name, key, description, owner_id, created_at
    - `project_members` - Users in projects with roles
      - id, project_id, user_id, role
    - `sprints` - Sprints inside a project
      - id, project_id, name, status, start_date, end_date
    - `issues` - Tasks/bugs/stories
      - id, project_id, sprint_id, title, description, type, status, priority, assignee_id, reporter_id, story_points, order, parent_id, created_at, updated_at
    - `comments` - Comments on issues
      - id, issue_id, author_id, body, created_at
    - `labels` - Labels for issues
      - id, project_id, name, color
    - `issue_labels` - Join table
      - issue_id, label_id

  2. Security
    - RLS enabled on all tables
    - Members can access their projects and related data
*/

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  key text NOT NULL,
  description text DEFAULT '',
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_color text DEFAULT '#0052CC',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Project Members
CREATE TABLE IF NOT EXISTS project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);

ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Sprints
CREATE TABLE IF NOT EXISTS sprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  goal text DEFAULT '',
  status text NOT NULL DEFAULT 'planned',
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;

-- Issues
CREATE TABLE IF NOT EXISTS issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sprint_id uuid REFERENCES sprints(id) ON DELETE SET NULL,
  parent_id uuid REFERENCES issues(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text DEFAULT '',
  type text NOT NULL DEFAULT 'task',
  status text NOT NULL DEFAULT 'todo',
  priority text NOT NULL DEFAULT 'medium',
  assignee_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  story_points integer,
  "order" integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Labels
CREATE TABLE IF NOT EXISTS labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#0052CC'
);

ALTER TABLE labels ENABLE ROW LEVEL SECURITY;

-- Issue Labels
CREATE TABLE IF NOT EXISTS issue_labels (
  issue_id uuid NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  label_id uuid NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (issue_id, label_id)
);

ALTER TABLE issue_labels ENABLE ROW LEVEL SECURITY;

-- User profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text DEFAULT '',
  avatar_url text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS Policies

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

-- Projects: visible to members and owners
CREATE POLICY "Project members can view project"
  ON projects FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = projects.id
      AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Project owner can update project"
  ON projects FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Project owner can delete project"
  ON projects FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Project Members
CREATE POLICY "Members can view project members"
  ON project_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
      AND projects.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM project_members pm2
      WHERE pm2.project_id = project_members.project_id
      AND pm2.user_id = auth.uid()
    )
  );

CREATE POLICY "Project owner can add members"
  ON project_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Project owner can remove members"
  ON project_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
      AND projects.owner_id = auth.uid()
    ) OR user_id = auth.uid()
  );

-- Sprints
CREATE POLICY "Project members can view sprints"
  ON sprints FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = sprints.project_id
      AND (
        projects.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Project members can create sprints"
  ON sprints FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = sprints.project_id
      AND (
        projects.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Project members can update sprints"
  ON sprints FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = sprints.project_id
      AND (
        projects.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = sprints.project_id
      AND (
        projects.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Project members can delete sprints"
  ON sprints FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = sprints.project_id
      AND (
        projects.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

-- Issues
CREATE POLICY "Project members can view issues"
  ON issues FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = issues.project_id
      AND (
        projects.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Project members can create issues"
  ON issues FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = issues.project_id
      AND (
        projects.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Project members can update issues"
  ON issues FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = issues.project_id
      AND (
        projects.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = issues.project_id
      AND (
        projects.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Project members can delete issues"
  ON issues FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = issues.project_id
      AND (
        projects.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

-- Comments
CREATE POLICY "Project members can view comments"
  ON comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM issues
      JOIN projects ON projects.id = issues.project_id
      WHERE issues.id = comments.issue_id
      AND (
        projects.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Project members can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Comment authors can update their comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Comment authors can delete their comments"
  ON comments FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- Labels
CREATE POLICY "Project members can view labels"
  ON labels FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = labels.project_id
      AND (
        projects.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Project members can manage labels"
  ON labels FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = labels.project_id
      AND (
        projects.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

-- Issue Labels
CREATE POLICY "Project members can view issue labels"
  ON issue_labels FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM issues
      JOIN projects ON projects.id = issues.project_id
      WHERE issues.id = issue_labels.issue_id
      AND (
        projects.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Project members can manage issue labels"
  ON issue_labels FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM issues
      JOIN projects ON projects.id = issues.project_id
      WHERE issues.id = issue_labels.issue_id
      AND (
        projects.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Project members can delete issue labels"
  ON issue_labels FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM issues
      JOIN projects ON projects.id = issues.project_id
      WHERE issues.id = issue_labels.issue_id
      AND (
        projects.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_issues_project_id ON issues(project_id);
CREATE INDEX IF NOT EXISTS idx_issues_sprint_id ON issues(sprint_id);
CREATE INDEX IF NOT EXISTS idx_issues_assignee_id ON issues(assignee_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_issue_id ON comments(issue_id);
