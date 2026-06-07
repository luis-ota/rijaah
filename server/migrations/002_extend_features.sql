-- 20260606000000_extend_features.sql

ALTER TABLE issues ADD COLUMN IF NOT EXISTS due_date date;
CREATE INDEX IF NOT EXISTS idx_issues_due_date ON issues(due_date);

CREATE TABLE IF NOT EXISTS kanban_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  key text NOT NULL,
  label text NOT NULL,
  color text DEFAULT '#94a3b8',
  "order" integer NOT NULL DEFAULT 0,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kanban_columns_project_id ON kanban_columns(project_id);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  type text NOT NULL,
  issue_id uuid,
  actor_id uuid,
  payload jsonb DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);

-- Trigger: notify on assignee change
CREATE OR REPLACE FUNCTION notify_on_assignee_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assignee_id IS DISTINCT FROM OLD.assignee_id AND NEW.assignee_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, issue_id, actor_id, payload)
    VALUES (
      NEW.assignee_id,
      'issue_assigned',
      NEW.id,
      NEW.reporter_id,
      jsonb_build_object('issue_title', NEW.title, 'project_id', NEW.project_id, 'issue_key', NEW.key)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_issue_assigned ON issues;
CREATE TRIGGER trg_issue_assigned
  AFTER UPDATE OF assignee_id ON issues
  FOR EACH ROW EXECUTE FUNCTION notify_on_assignee_change();

-- Seed default kanban columns for a project
CREATE OR REPLACE FUNCTION seed_default_kanban_columns(p_project_id uuid)
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM kanban_columns WHERE project_id = p_project_id) THEN
    INSERT INTO kanban_columns (project_id, key, label, color, "order", is_default) VALUES
      (p_project_id, 'todo', 'To Do', '#94a3b8', 0, true),
      (p_project_id, 'in_progress', 'In Progress', '#3b82f6', 1, true),
      (p_project_id, 'in_review', 'In Review', '#f59e0b', 2, true),
      (p_project_id, 'done', 'Done', '#10b981', 3, true);
  END IF;
END;
$$ LANGUAGE plpgsql;
