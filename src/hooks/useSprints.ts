import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Sprint, SprintStatus } from '../types';

export function useSprints(projectId: string | null) {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSprints = useCallback(async () => {
    if (!projectId) { setLoading(false); return; }
    const { data } = await supabase.from<Sprint>('sprints')
      .select('*')
      .eq('project_id', projectId);
    if (data) setSprints(data);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchSprints(); }, [fetchSprints]);

  async function createSprint(name: string, goal?: string, start_date?: string | null, end_date?: string | null) {
    if (!projectId) return null;
    const { data } = await supabase.from<Sprint>('sprints')
      .insert({ project_id: projectId, name, goal: goal ?? '', start_date: start_date ?? null, end_date: end_date ?? null })
      .select()
      .single();
    await fetchSprints();
    return data;
  }

  async function updateSprint(id: string, update: Partial<Sprint>) {
    await supabase.from('sprints').update(update).eq('id', id);
    await fetchSprints();
  }

  async function deleteSprint(id: string) {
    await supabase.from('sprints').delete().eq('id', id);
    await fetchSprints();
  }

  async function startSprint(id: string) {
    // ensure only one active
    const active = sprints.find(s => s.status === 'active');
    if (active && active.id !== id) {
      await supabase.from('sprints').update({ status: 'completed' }).eq('id', active.id);
    }
    await supabase.from('sprints').update({ status: 'active' as SprintStatus }).eq('id', id);
    await fetchSprints();
  }

  return { sprints, loading, createSprint, updateSprint, deleteSprint, startSprint, refetch: fetchSprints };
}
