import { useState, useRef, useCallback, useMemo } from 'react';
import { Plus, Filter, Search } from 'lucide-react';
import type { Project, Issue, IssueStatus, Sprint, ProjectMember } from '../types';
import IssueCard from '../components/IssueCard';
import CreateIssueModal from '../components/CreateIssueModal';
import IssueDetailModal from '../components/IssueDetailModal';
import { useAuth } from '../context/AuthContext';
import { useKanbanColumns } from '../hooks/useKanbanColumns';
import { useIssueLabelsByProject } from '../hooks/useIssueLabels';
import { useLabels } from '../hooks/useLabels';

interface Props {
  project: Project;
  issues: Issue[];
  sprints: Sprint[];
  members: ProjectMember[];
  onCreateIssue: (payload: { title: string; type: string; status: string; priority: string; sprint_id?: string | null; assignee_id?: string | null; story_points?: number | null; description?: string; reporter_id?: string; due_date?: string | null }) => Promise<unknown>;
  onUpdateIssue: (id: string, update: Partial<Issue>) => Promise<boolean>;
  onDeleteIssue: (id: string) => Promise<void>;
  onMoveIssue?: (id: string, newStatus: IssueStatus) => Promise<boolean>;
}

export default function BoardPage({ project, issues, sprints, members, onCreateIssue, onUpdateIssue, onDeleteIssue, onMoveIssue }: Props) {
  const { user } = useAuth();
  const { columns } = useKanbanColumns(project.id);
  const { issueLabels, setLabelsForIssue } = useIssueLabelsByProject(project.id);
  const { labels: projectLabels, createLabel } = useLabels(project.id);
  const [showCreate, setShowCreate] = useState(false);
  const [createDefaultStatus, setCreateDefaultStatus] = useState<string>('todo');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [search, setSearch] = useState('');
  const [filterAssignee, setFilterAssignee] = useState<string>('');
  const [filterLabel, setFilterLabel] = useState<string>('');
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragCounterRef = useRef<Record<string, number>>({});

  const activeSprint = sprints.find(s => s.status === 'active');

  const labelsByIssue = useMemo(() => {
    const m = new Map<string, typeof issueLabels>();
    for (const il of issueLabels) {
      const arr = m.get(il.issue_id) ?? [];
      arr.push(il);
      m.set(il.issue_id, arr);
    }
    return m;
  }, [issueLabels]);

  const allLabels = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    for (const il of issueLabels) {
      if (!map.has(il.label_id)) map.set(il.label_id, { name: il.name, color: il.color });
    }
    return Array.from(map.entries()).map(([id, v]) => ({ id, ...v }));
  }, [issueLabels]);

  const filtered = issues.filter(i => {
    const matchSprint = activeSprint ? i.sprint_id === activeSprint.id : true;
    const matchSearch = i.title.toLowerCase().includes(search.toLowerCase());
    const matchAssignee = filterAssignee ? i.assignee_id === filterAssignee : true;
    const matchLabel = filterLabel ? (labelsByIssue.get(i.id) ?? []).some(l => l.label_id === filterLabel) : true;
    return matchSprint && matchSearch && matchAssignee && matchLabel;
  });

  function openCreateWithStatus(status: string) {
    setCreateDefaultStatus(status);
    setShowCreate(true);
  }

  const handleDragEnterColumn = useCallback((e: React.DragEvent, status: string) => {
    e.preventDefault();
    dragCounterRef.current[status] = (dragCounterRef.current[status] || 0) + 1;
    setDragOverColumn(status);
  }, []);

  const handleDragLeaveColumn = useCallback((e: React.DragEvent, status: string) => {
    e.preventDefault();
    dragCounterRef.current[status] = (dragCounterRef.current[status] || 0) - 1;
    if (dragCounterRef.current[status] <= 0) {
      dragCounterRef.current[status] = 0;
      setDragOverColumn(prev => prev === status ? null : prev);
      setDragOverIndex(null);
    }
  }, []);

  const handleDragOverItem = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetStatus: string, _targetIndex: number) => {
    e.preventDefault();
    const issueId = e.dataTransfer.getData('text/plain');
    if (!issueId) return;

    setDragOverColumn(null);
    setDragOverIndex(null);
    dragCounterRef.current = {};

    const issue = issues.find(i => i.id === issueId);
    if (!issue) return;

    if (issue.status === targetStatus) {
      return;
    }

    if (onMoveIssue) {
      await onMoveIssue(issueId, targetStatus as IssueStatus);
    } else {
      await onUpdateIssue(issueId, { status: targetStatus as IssueStatus });
    }
  }, [issues, onMoveIssue, onUpdateIssue]);

  const handleDragOverColumn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{project.name} — Board</h1>
            {activeSprint ? (
              <p className="text-xs text-slate-500 mt-0.5">Sprint: <span className="font-medium text-slate-700">{activeSprint.name}</span></p>
            ) : (
              <p className="text-xs text-slate-400 mt-0.5">No active sprint — showing all issues</p>
            )}
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create issue
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search issues..."
              className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-56"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterAssignee}
              onChange={e => setFilterAssignee(e.target.value)}
              className="border border-slate-200 rounded-lg text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All assignees</option>
              {members.map(m => <option key={m.user_id} value={m.user_id}>{m.profile?.full_name}</option>)}
            </select>
          </div>
          {allLabels.length > 0 && (
            <select
              value={filterLabel}
              onChange={e => setFilterLabel(e.target.value)}
              className="border border-slate-200 rounded-lg text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All labels</option>
              {allLabels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          )}
          <div className="ml-auto flex -space-x-2">
            {members.slice(0, 5).map(m => m.profile && (
              <button
                key={m.user_id}
                onClick={() => setFilterAssignee(filterAssignee === m.user_id ? '' : m.user_id)}
                title={m.profile.full_name}
                className={`w-7 h-7 rounded-full border-2 transition-all ${filterAssignee === m.user_id ? 'border-blue-500 scale-110' : 'border-white'}`}
              >
                <div className={`w-full h-full rounded-full flex items-center justify-center text-xs font-medium text-white ${getAvatarColor(m.profile.full_name)}`}>
                  {m.profile.full_name[0]?.toUpperCase()}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 p-6 h-full min-w-max">
          {columns.length === 0 && (
            <div className="flex-1 text-center text-sm text-slate-400 py-20">Loading columns...</div>
          )}
          {columns.map(col => {
            const colIssues = filtered.filter(i => i.status === col.key);
            const isOver = dragOverColumn === col.key;
            return (
              <div
                key={col.id}
                className={`w-72 flex flex-col rounded-xl transition-colors ${isOver ? 'bg-blue-50/60' : ''}`}
                onDragEnter={e => handleDragEnterColumn(e, col.key)}
                onDragLeave={e => handleDragLeaveColumn(e, col.key)}
                onDragOver={handleDragOverColumn}
                onDrop={e => handleDrop(e, col.key, colIssues.length)}
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: `${col.color}26`, color: col.color }}
                    >
                      {col.label}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{colIssues.length}</span>
                  </div>
                  <button
                    onClick={() => openCreateWithStatus(col.key)}
                    className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded hover:bg-slate-100"
                    title="Add issue"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 space-y-2 min-h-[100px] px-1">
                  {colIssues.map((issue, index) => (
                    <div key={issue.id}>
                      {dragOverColumn === col.key && dragOverIndex === index && (
                        <div className="h-1 rounded-full bg-blue-400 mb-2 mx-1 animate-pulse" />
                      )}
                      <div onDragOver={e => handleDragOverItem(e, index)}>
                        <IssueCard
                          issue={issue}
                          projectKey={project.key}
                          labels={labelsByIssue.get(issue.id)}
                          onClick={() => setSelectedIssue(issue)}
                        />
                      </div>
                    </div>
                  ))}
                  {dragOverColumn === col.key && (dragOverIndex === null || dragOverIndex >= colIssues.length) && (
                    <div className="h-1 rounded-full bg-blue-400 mb-2 mx-1 animate-pulse" />
                  )}
                  {colIssues.length === 0 && (
                    <div
                      onClick={() => openCreateWithStatus(col.key)}
                      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
                        isOver ? 'drop-target border-blue-300 bg-blue-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <p className="text-xs text-slate-400">Drop issues here or click to add</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showCreate && (
        <CreateIssueModal
          onClose={() => setShowCreate(false)}
          onCreate={onCreateIssue as Parameters<typeof CreateIssueModal>[0]['onCreate']}
          sprints={sprints}
          members={members}
          defaultStatus={createDefaultStatus}
          defaultSprintId={activeSprint?.id ?? null}
          reporterId={user?.id}
        />
      )}

      {selectedIssue && (
    <IssueDetailModal
      issue={selectedIssue}
      projectKey={project.key}
      sprints={sprints}
      members={members}
      projectLabels={projectLabels}
      issueLabels={issueLabels.filter(il => il.issue_id === selectedIssue.id)}
      onSetLabels={async (_issueId, labelIds) => {
        const currentLabelIds = issueLabels.filter(il => il.issue_id === _issueId).map(il => il.label_id);
        await setLabelsForIssue(_issueId, currentLabelIds, labelIds, projectLabels);
      }}
      onClose={() => setSelectedIssue(null)}
      onUpdate={async (id, update) => {
        const ok = await onUpdateIssue(id, update);
        if (ok) setSelectedIssue(prev => prev ? { ...prev, ...update } : null);
        return ok;
      }}
      onDelete={onDeleteIssue}
      onCreateLabel={(name) => createLabel(name, '#3b82f6')}
    />
      )}
    </div>
  );
}

function getAvatarColor(name: string) {
  const colors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
    'bg-cyan-500', 'bg-teal-500', 'bg-orange-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}
