import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ProjectMember } from '../types';

export function useMembers(projectId: string | null) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    if (!projectId) { setLoading(false); return; }
    const { data } = await supabase
      .from('project_members')
      .select('*, profile:profiles(*)')
      .eq('project_id', projectId);
    if (data) setMembers(data as unknown as ProjectMember[]);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  return { members, loading, refetch: fetchMembers };
}
