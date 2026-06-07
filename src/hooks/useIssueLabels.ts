import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { IssueLabel, Label } from '../types';

export function useIssueLabelsByProject(projectId: string | null) {
  const [issueLabels, setIssueLabels] = useState<IssueLabel[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!projectId) { setLoading(false); return; }
    const { data: labels } = await supabase.from<Label>('labels').select('*').eq('project_id', projectId);
    const { data: issueLabelsRows } = await supabase.from<{ issue_id: string; label_id: string }>('issue_labels').select('*');
    if (!labels || !issueLabelsRows) { setLoading(false); return; }
    const projectLabelIds = new Set(labels.map(l => l.id));
    const all: IssueLabel[] = [];
    for (const il of issueLabelsRows) {
      if (!projectLabelIds.has(il.label_id)) continue;
      const l = labels.find(lb => lb.id === il.label_id);
      if (l) all.push({ issue_id: il.issue_id, label_id: il.label_id, name: l.name, color: l.color });
    }
    setIssueLabels(all);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addIssueLabel = useCallback(async (issueId: string, label: Label) => {
    setIssueLabels(prev => prev.some(il => il.issue_id === issueId && il.label_id === label.id)
      ? prev
      : [...prev, { issue_id: issueId, label_id: label.id, name: label.name, color: label.color }]);
    const { error } = await supabase.from('issue_labels').insert({ issue_id: issueId, label_id: label.id });
    if (error) {
      setIssueLabels(prev => prev.filter(il => !(il.issue_id === issueId && il.label_id === label.id)));
    }
    return { error };
  }, []);

  const removeIssueLabel = useCallback(async (issueId: string, labelId: string) => {
    setIssueLabels(prev => prev.filter(il => !(il.issue_id === issueId && il.label_id === labelId)));
    const { error } = await supabase.from('issue_labels').delete().eq('issue_id', issueId).eq('label_id', labelId);
    if (error) {
      await fetch();
    }
    return { error };
  }, []);

  const setLabelsForIssue = useCallback(async (issueId: string, currentLabelIds: string[], targetLabelIds: string[], allProjectLabels: Label[]) => {
    const toAdd = targetLabelIds.filter(id => !currentLabelIds.includes(id));
    const toRemove = currentLabelIds.filter(id => !targetLabelIds.includes(id));
    setIssueLabels(prev => {
      let next = prev;
      for (const lid of toRemove) next = next.filter(il => !(il.issue_id === issueId && il.label_id === lid));
      for (const lid of toAdd) {
        if (next.some(il => il.issue_id === issueId && il.label_id === lid)) continue;
        const lbl = allProjectLabels.find(l => l.id === lid);
        if (lbl) next = [...next, { issue_id: issueId, label_id: lid, name: lbl.name, color: lbl.color }];
      }
      return next;
    });
    for (const lid of toAdd) {
      await supabase.from('issue_labels').insert({ issue_id: issueId, label_id: lid });
    }
    for (const lid of toRemove) {
      await supabase.from('issue_labels').delete().eq('issue_id', issueId).eq('label_id', lid);
    }
  }, []);

  return { issueLabels, loading, refetch: fetch, addIssueLabel, removeIssueLabel, setLabelsForIssue };
}
