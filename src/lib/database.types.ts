export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          avatar_url?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string;
          avatar_url?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          name: string;
          key: string;
          description: string;
          owner_id: string;
          avatar_color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          key: string;
          description?: string;
          owner_id: string;
          avatar_color?: string;
        };
        Update: {
          name?: string;
          key?: string;
          description?: string;
          avatar_color?: string;
          updated_at?: string;
        };
      };
      project_members: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          role: string;
          joined_at: string;
        };
        Insert: {
          project_id: string;
          user_id: string;
          role?: string;
        };
        Update: {
          role?: string;
        };
      };
      sprints: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          goal: string;
          status: string;
          start_date: string | null;
          end_date: string | null;
          created_at: string;
        };
        Insert: {
          project_id: string;
          name: string;
          goal?: string;
          status?: string;
          start_date?: string | null;
          end_date?: string | null;
        };
        Update: {
          name?: string;
          goal?: string;
          status?: string;
          start_date?: string | null;
          end_date?: string | null;
        };
      };
      issues: {
        Row: {
          id: string;
          project_id: string;
          sprint_id: string | null;
          parent_id: string | null;
          title: string;
          description: string;
          type: string;
          status: string;
          priority: string;
          assignee_id: string | null;
          reporter_id: string | null;
          story_points: number | null;
          order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          project_id: string;
          sprint_id?: string | null;
          parent_id?: string | null;
          title: string;
          description?: string;
          type?: string;
          status?: string;
          priority?: string;
          assignee_id?: string | null;
          reporter_id?: string | null;
          story_points?: number | null;
          order?: number;
        };
        Update: {
          sprint_id?: string | null;
          parent_id?: string | null;
          title?: string;
          description?: string;
          type?: string;
          status?: string;
          priority?: string;
          assignee_id?: string | null;
          story_points?: number | null;
          order?: number;
          updated_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          issue_id: string;
          author_id: string;
          body: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          issue_id: string;
          author_id: string;
          body: string;
        };
        Update: {
          body?: string;
          updated_at?: string;
        };
      };
      labels: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          color: string;
        };
        Insert: {
          project_id: string;
          name: string;
          color?: string;
        };
        Update: {
          name?: string;
          color?: string;
        };
      };
      issue_labels: {
        Row: {
          issue_id: string;
          label_id: string;
        };
        Insert: {
          issue_id: string;
          label_id: string;
        };
        Update: Record<string, never>;
      };
    };
  };
}
