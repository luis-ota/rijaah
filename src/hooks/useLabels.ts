import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Label } from '../types';

export function useLabels(projectId: string | null) {
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLabels = useCallback(async () => {
    if (!projectId) { setLoading(false); return; }
    const { data } = await supabase.from<Label>('labels').select('*').eq('project_id', projectId);
    if (data) setLabels(data);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchLabels(); }, [fetchLabels]);

  async function createLabel(name: string, color: string) {
    if (!projectId) return null;
    const { data } = await supabase.from<Label>('labels')
      .insert({ project_id: projectId, name, color })
      .select()
      .single();
    await fetchLabels();
    return data;
  }

  async function updateLabel(id: string, update: Partial<Label>) {
    await supabase.from('labels').update(update).eq('id', id);
    await fetchLabels();
  }

  async function deleteLabel(id: string) {
    await supabase.from('labels').delete().eq('id', id);
    await fetchLabels();
  }

  return { labels, loading, createLabel, updateLabel, deleteLabel, refetch: fetchLabels };
}
