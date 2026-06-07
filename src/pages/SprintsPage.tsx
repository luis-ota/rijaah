import { useState, FormEvent } from 'react';
import { Plus, Play, CheckCircle, Trash2, Calendar } from 'lucide-react';
import type { Project, Sprint, Issue, SprintStatus } from '../types';

interface Props {
  project: Project;
  sprints: Sprint[];
  issues: Issue[];
  onCreateSprint: (name: string, goal?: string, start_date?: string | null, end_date?: string | null) => Promise<unknown>;
  onUpdateSprint: (id: string, update: Partial<Sprint>) => Promise<void>;
  onDeleteSprint: (id: string) => Promise<void>;
  onStartSprint?: (id: string) => Promise<void>;
}

export default function SprintsPage({ project, sprints, issues, onCreateSprint, onUpdateSprint, onDeleteSprint, onStartSprint }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    await onCreateSprint(
      newName.trim(),
      newGoal.trim() || undefined,
      newStart || null,
      newEnd || null,
    );
    setNewName('');
    setNewGoal('');
    setNewStart('');
    setNewEnd('');
    setShowForm(false);
    setLoading(false);
  }

  function issueCount(sprintId: string) {
    return issues.filter(i => i.sprint_id === sprintId).length;
  }

  function doneCount(sprintId: string) {
    return issues.filter(i => i.sprint_id === sprintId && i.status === 'done').length;
  }

  const statusOrder: Record<SprintStatus, number> = { active: 0, planned: 1, completed: 2 };
  const sorted = [...sprints].sort((a, b) => (statusOrder[a.status] ?? 1) - (statusOrder[b.status] ?? 1));

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-900">{project.name} — Sprints</h1>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New sprint
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {showForm && (
          <form onSubmit={handleCreate} className="bg-white border border-blue-300 rounded-xl p-5 mb-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">New sprint</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Sprint name</label>
                <input
                  autoFocus
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Sprint 1"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Sprint goal (optional)</label>
                <input
                  value={newGoal}
                  onChange={e => setNewGoal(e.target.value)}
                  placeholder="What do we want to achieve?"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Start date</label>
                  <input
                    type="date"
                    value={newStart}
                    onChange={e => setNewStart(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">End date</label>
                  <input
                    type="date"
                    value={newEnd}
                    onChange={e => setNewEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:bg-blue-400 transition-colors">
                  {loading ? 'Creating...' : 'Create sprint'}
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {sorted.length === 0 && !showForm && (
            <div className="text-center py-16">
              <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No sprints yet</p>
              <p className="text-slate-400 text-xs mt-1">Create your first sprint to get started</p>
            </div>
          )}
          {sorted.map(sprint => {
            const total = issueCount(sprint.id);
            const done = doneCount(sprint.id);
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            const statusConfig = {
              planned: { label: 'Planned', color: 'bg-slate-100 text-slate-600', icon: null },
              active: { label: 'Active', color: 'bg-blue-100 text-blue-700', icon: <Play className="w-3 h-3" /> },
              completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle className="w-3 h-3" /> },
            };
            const cfg = statusConfig[sprint.status] ?? statusConfig.planned;

            return (
              <div key={sprint.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 text-sm">{sprint.name}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                        {cfg.icon}{cfg.label}
                      </span>
                    </div>
                    {sprint.goal && <p className="text-xs text-slate-500 mb-3">{sprint.goal}</p>}

                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      <span>{total} issues</span>
                      <span>{done} done</span>
                      {sprint.start_date && <span>Start: {new Date(sprint.start_date).toLocaleDateString()}</span>}
                      {sprint.end_date && <span>End: {new Date(sprint.end_date).toLocaleDateString()}</span>}
                    </div>

                    {total > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-400">Progress</span>
                          <span className="text-xs font-medium text-slate-600">{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {sprint.status === 'planned' && (
                      <button
                        onClick={async () => {
                          if (onStartSprint) await onStartSprint(sprint.id);
                          else await onUpdateSprint(sprint.id, { status: 'active' });
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        <Play className="w-3 h-3" />
                        Start
                      </button>
                    )}
                    {sprint.status === 'active' && (
                      <button
                        onClick={() => onUpdateSprint(sprint.id, { status: 'completed' })}
                        className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Complete
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteSprint(sprint.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete sprint"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
