import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ProjectMember, Profile } from '../types';

export function useMembers(projectId: string | null) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    if (!projectId) { setLoading(false); return; }
    const { data } = await supabase.from<ProjectMember>('project_members')
      .select('*')
      .eq('project_id', projectId);
    if (data) {
      const { data: profiles } = await supabase.from<Profile>('profiles').select('*');
      const map = new Map((profiles ?? []).map(p => [p.id, p]));
      setMembers(data.map(m => ({ ...m, profile: map.get(m.user_id) })));
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  return { members, loading, refetch: fetchMembers };
}
