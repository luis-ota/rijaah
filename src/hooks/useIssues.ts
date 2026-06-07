import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Issue, IssueStatus } from '../types';

export function useIssues(projectId: string | null) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIssues = useCallback(async () => {
    if (!projectId) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase.from<Issue>('issues')
      .select('*')
      .eq('project_id', projectId);
    if (data) setIssues(data);
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
    due_date?: string | null;
  }) {
    if (!projectId) return null;
    const { data, error } = await supabase.from<Issue>('issues')
      .insert({ ...payload, project_id: projectId })
      .select()
      .single();
    if (error || !data) return null;
    await fetchIssues();
    return data;
  }

  async function updateIssue(id: string, update: Partial<Issue>) {
    await supabase.from('issues').update(update).eq('id', id);
    await fetchIssues();
    return true;
  }

  async function deleteIssue(id: string) {
    await supabase.from('issues').delete().eq('id', id);
    await fetchIssues();
  }

  async function moveIssue(id: string, newStatus: IssueStatus) {
    await supabase.from('issues').update({ status: newStatus }).eq('id', id);
    await fetchIssues();
    return true;
  }

  return { issues, loading, createIssue, updateIssue, deleteIssue, moveIssue, refetch: fetchIssues };
}
