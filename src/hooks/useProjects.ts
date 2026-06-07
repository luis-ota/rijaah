import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Project } from '../types';
import { useAuth } from '../context/AuthContext';

export function useProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from<Project>('projects').select('*');
    if (data) setProjects(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  async function createProject(name: string, key: string, description: string, color: string) {
    if (!user) return null;
    const { data, error } = await supabase.from<Project>('projects')
      .insert({ name, key, description, owner_id: user.id, avatar_color: color })
      .select()
      .single();
    if (error || !data) return null;
    await supabase.from('project_members').insert({ project_id: data.id, user_id: user.id, role: 'owner' });
    await fetchProjects();
    return data;
  }

  return { projects, loading, createProject, refetch: fetchProjects };
}
