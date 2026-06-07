import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { KanbanColumn } from '../types';

export function useKanbanColumns(projectId: string | null) {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchColumns = useCallback(async () => {
    if (!projectId) { setLoading(false); return; }
    const { data } = await supabase.from<KanbanColumn>('kanban_columns')
      .select('*')
      .eq('project_id', projectId);
    if (data) setColumns([...data].sort((a, b) => a.order - b.order));
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchColumns(); }, [fetchColumns]);

  async function createColumn(payload: { key: string; label: string; color: string; order: number }) {
    if (!projectId) return null;
    const { data } = await supabase.from<KanbanColumn>('kanban_columns')
      .insert({ ...payload, project_id: projectId, is_default: false })
      .select()
      .single();
    await fetchColumns();
    return data;
  }

  async function updateColumn(id: string, update: Partial<KanbanColumn>) {
    await supabase.from('kanban_columns').update(update).eq('id', id);
    await fetchColumns();
  }

  async function deleteColumn(id: string) {
    await supabase.from('kanban_columns').delete().eq('id', id);
    await fetchColumns();
  }

  async function reorderColumns(ids: string[]) {
    await supabase.from('kanban_columns').update({ order: 0 }).eq('project_id', projectId);
    // simpler: do all updates
    for (let i = 0; i < ids.length; i++) {
      await supabase.from('kanban_columns').update({ order: i }).eq('id', ids[i]);
    }
    await fetchColumns();
  }

  return { columns, loading, createColumn, updateColumn, deleteColumn, reorderColumns, refetch: fetchColumns };
}
