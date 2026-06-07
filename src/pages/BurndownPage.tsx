import { useState } from 'react';
import type { Project, Issue, Sprint } from '../types';
import BurndownChart from '../components/BurndownChart';

interface Props {
  project: Project;
  sprints: Sprint[];
  issues: Issue[];
}

export default function BurndownPage({ project, sprints, issues }: Props) {
  const sortedSprints = [...sprints].sort((a, b) => {
    const order = { active: 0, planned: 1, completed: 2 };
    return (order[a.status] ?? 1) - (order[b.status] ?? 1);
  });
  const [sprintId, setSprintId] = useState<string | null>(sortedSprints[0]?.id ?? null);
  const sprint = sprints.find(s => s.id === sprintId) ?? null;

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{project.name} — Burndown</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track story points completion over time</p>
        </div>
        {sortedSprints.length > 0 && (
          <select
            value={sprintId ?? ''}
            onChange={e => setSprintId(e.target.value || null)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {sortedSprints.map(s => <option key={s.id} value={s.id}>{s.name} ({s.status})</option>)}
          </select>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {!sprint ? (
          <div className="text-center py-20 text-sm text-slate-400">No sprints yet</div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="mb-4">
              <h2 className="font-semibold text-slate-800">{sprint.name}</h2>
              {sprint.goal && <p className="text-sm text-slate-500 mt-0.5">{sprint.goal}</p>}
            </div>
            <BurndownChart sprint={sprint} issues={issues} />
          </div>
        )}
      </div>
    </div>
  );
}
