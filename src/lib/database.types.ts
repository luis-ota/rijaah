export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type GenericRelationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string | null;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string | null;
        };
        Relationships: GenericRelationship[];
      };
      projects: {
        Row: {
          id: string;
          name: string;
          key: string;
          description: string | null;
          owner_id: string;
          avatar_color: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          key: string;
          description?: string | null;
          owner_id: string;
          avatar_color?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          name?: string;
          key?: string;
          description?: string | null;
          owner_id?: string;
          avatar_color?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: GenericRelationship[];
      };
      project_members: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          role: string;
          joined_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          role?: string;
          joined_at?: string | null;
        };
        Update: {
          project_id?: string;
          user_id?: string;
          role?: string;
          joined_at?: string | null;
        };
        Relationships: GenericRelationship[];
      };
      sprints: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          goal: string | null;
          status: string;
          start_date: string | null;
          end_date: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          goal?: string | null;
          status?: string;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string | null;
        };
        Update: {
          project_id?: string;
          name?: string;
          goal?: string | null;
          status?: string;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string | null;
        };
        Relationships: GenericRelationship[];
      };
      issues: {
        Row: {
          id: string;
          project_id: string;
          sprint_id: string | null;
          parent_id: string | null;
          title: string;
          description: string | null;
          type: string;
          status: string;
          priority: string;
          assignee_id: string | null;
          reporter_id: string | null;
          story_points: number | null;
          order: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          sprint_id?: string | null;
          parent_id?: string | null;
          title: string;
          description?: string | null;
          type?: string;
          status?: string;
          priority?: string;
          assignee_id?: string | null;
          reporter_id?: string | null;
          story_points?: number | null;
          order?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          project_id?: string;
          sprint_id?: string | null;
          parent_id?: string | null;
          title?: string;
          description?: string | null;
          type?: string;
          status?: string;
          priority?: string;
          assignee_id?: string | null;
          reporter_id?: string | null;
          story_points?: number | null;
          order?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: GenericRelationship[];
      };
      comments: {
        Row: {
          id: string;
          issue_id: string;
          author_id: string;
          body: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          issue_id: string;
          author_id: string;
          body: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          issue_id?: string;
          author_id?: string;
          body?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: GenericRelationship[];
      };
      labels: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          color: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          color?: string | null;
        };
        Update: {
          project_id?: string;
          name?: string;
          color?: string | null;
        };
        Relationships: GenericRelationship[];
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
        Relationships: GenericRelationship[];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
