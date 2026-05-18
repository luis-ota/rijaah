import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Issue, IssueStatus } from '../types';

export function useIssues(projectId: string | null) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIssues = useCallback(async () => {
    if (!projectId) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('issues')
      .select(`
        *,
        assignee:profiles!issues_assignee_id_fkey(id, full_name, avatar_url),
        reporter:profiles!issues_reporter_id_fkey(id, full_name, avatar_url)
      `)
      .eq('project_id', projectId)
      .order('order', { ascending: true });
    if (data) setIssues(data as unknown as Issue[]);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  async function createIssue(payload: {
    title: string;
    type: string;
    status: string;
    priority: string;
    sprint_id?: string | null;
    assignee_id?: string | null;
    story_points?: number | null;
    description?: string;
    reporter_id?: string;
  }) {
    if (!projectId) return null;
    const { data, error } = await supabase
      .from('issues')
      .insert({ ...payload, project_id: projectId })
      .select()
      .single();
    if (error || !data) return null;
    await fetchIssues();
    return data as Issue;
  }

  async function updateIssue(id: string, update: Partial<Issue>) {
    const { error } = await supabase
      .from('issues')
      .update({ ...update, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) await fetchIssues();
    return !error;
  }

  async function deleteIssue(id: string) {
    await supabase.from('issues').delete().eq('id', id);
    await fetchIssues();
  }

  async function moveIssue(id: string, newStatus: IssueStatus) {
    return updateIssue(id, { status: newStatus });
  }

  return { issues, loading, createIssue, updateIssue, deleteIssue, moveIssue, refetch: fetchIssues };
}
