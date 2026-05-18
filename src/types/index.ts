export type IssueType = 'task' | 'bug' | 'story' | 'epic' | 'subtask';
export type IssueStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
export type IssuePriority = 'lowest' | 'low' | 'medium' | 'high' | 'highest';
export type SprintStatus = 'planned' | 'active' | 'completed';
export type MemberRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description: string;
  owner_id: string;
  avatar_color: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
  profile?: Profile;
}

export interface Sprint {
  id: string;
  project_id: string;
  name: string;
  goal: string;
  status: SprintStatus;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface Issue {
  id: string;
  project_id: string;
  sprint_id: string | null;
  parent_id: string | null;
  title: string;
  description: string;
  type: IssueType;
  status: IssueStatus;
  priority: IssuePriority;
  assignee_id: string | null;
  reporter_id: string | null;
  story_points: number | null;
  order: number;
  created_at: string;
  updated_at: string;
  assignee?: Profile;
  reporter?: Profile;
}

export interface Comment {
  id: string;
  issue_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  author?: Profile;
}

export interface Label {
  id: string;
  project_id: string;
  name: string;
  color: string;
}
