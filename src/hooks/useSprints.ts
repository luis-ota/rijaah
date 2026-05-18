import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Sprint } from '../types';

export function useSprints(projectId: string | null) {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSprints = useCallback(async () => {
    if (!projectId) { setLoading(false); return; }
    const { data } = await supabase
      .from('sprints')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
    if (data) setSprints(data as Sprint[]);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchSprints(); }, [fetchSprints]);

  async function createSprint(name: string, goal?: string) {
    if (!projectId) return null;
    const { data } = await supabase
      .from('sprints')
      .insert({ project_id: projectId, name, goal: goal ?? '' })
      .select()
      .single();
    await fetchSprints();
    return data as Sprint;
  }

  async function updateSprint(id: string, update: Partial<Sprint>) {
    await supabase.from('sprints').update(update).eq('id', id);
    await fetchSprints();
  }

  async function deleteSprint(id: string) {
    await supabase.from('sprints').delete().eq('id', id);
    await fetchSprints();
  }

  return { sprints, loading, createSprint, updateSprint, deleteSprint, refetch: fetchSprints };
}
