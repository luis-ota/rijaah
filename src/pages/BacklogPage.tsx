import { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, Search } from 'lucide-react';
import type { Project, Issue, Sprint, ProjectMember } from '../types';
import IssueTypeBadge from '../components/IssueTypeBadge';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import Avatar from '../components/Avatar';
import CreateIssueModal from '../components/CreateIssueModal';
import IssueDetailModal from '../components/IssueDetailModal';
import { useAuth } from '../context/AuthContext';

interface Props {
  project: Project;
  issues: Issue[];
  sprints: Sprint[];
  members: ProjectMember[];
  onCreateIssue: (payload: { title: string; type: string; status: string; priority: string; sprint_id?: string | null; assignee_id?: string | null; story_points?: number | null; description?: string; reporter_id?: string }) => Promise<unknown>;
  onUpdateIssue: (id: string, update: Partial<Issue>) => Promise<boolean>;
  onDeleteIssue: (id: string) => Promise<void>;
}

export default function BacklogPage({ project, issues, sprints, members, onCreateIssue, onUpdateIssue, onDeleteIssue }: Props) {
  const { user } = useAuth();
  const [expandedSprints, setExpandedSprints] = useState<Set<string>>(new Set(['backlog', ...sprints.map(s => s.id)]));
  const [showCreate, setShowCreate] = useState(false);
  const [createSprintId, setCreateSprintId] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [search, setSearch] = useState('');

  function toggleSprint(id: string) {
    setExpandedSprints(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openCreate(sprintId: string | null) {
    setCreateSprintId(sprintId);
    setShowCreate(true);
  }

  const filtered = issues.filter(i => i.title.toLowerCase().includes(search.toLowerCase()));

  const sprintIssues = (sprintId: string | null) =>
    filtered.filter(i => i.sprint_id === sprintId);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold text-slate-900">{project.name} — Backlog</h1>
          <button
            onClick={() => openCreate(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create issue
          </button>
        </div>
        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search backlog..."
            className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Sprints */}
        {sprints.map(sprint => {
          const sIssues = sprintIssues(sprint.id);
          const expanded = expandedSprints.has(sprint.id);
          const statusColors: Record<string, string> = {
            planned: 'bg-slate-100 text-slate-600',
            active: 'bg-blue-100 text-blue-700',
            completed: 'bg-emerald-100 text-emerald-700',
          };
          return (
            <div key={sprint.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => toggleSprint(sprint.id)}
              >
                <div className="flex items-center gap-2.5">
                  {expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <span className="font-medium text-sm text-slate-800">{sprint.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[sprint.status] || statusColors.planned}`}>
                    {sprint.status.charAt(0).toUpperCase() + sprint.status.slice(1)}
                  </span>
                  <span className="text-xs text-slate-400">{sIssues.length} issues</span>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); openCreate(sprint.id); }}
                  className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded hover:bg-blue-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {expanded && (
                <div className="divide-y divide-slate-100">
                  {sIssues.length === 0 ? (
                    <div className="px-10 py-4 text-sm text-slate-400 italic">No issues in this sprint</div>
                  ) : sIssues.map(issue => (
                    <IssueRow
                      key={issue.id}
                      issue={issue}
                      projectKey={project.key}
                      onClick={() => setSelectedIssue(issue)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Backlog */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div
            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
            onClick={() => toggleSprint('backlog')}
          >
            <div className="flex items-center gap-2.5">
              {expandedSprints.has('backlog') ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
              <span className="font-medium text-sm text-slate-800">Backlog</span>
              <span className="text-xs text-slate-400">{sprintIssues(null).length} issues</span>
            </div>
            <button
              onClick={e => { e.stopPropagation(); openCreate(null); }}
              className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded hover:bg-blue-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {expandedSprints.has('backlog') && (
            <div className="divide-y divide-slate-100">
              {sprintIssues(null).length === 0 ? (
                <div className="px-10 py-4 text-sm text-slate-400 italic">Backlog is empty</div>
              ) : sprintIssues(null).map(issue => (
                <IssueRow
                  key={issue.id}
                  issue={issue}
                  projectKey={project.key}
                  onClick={() => setSelectedIssue(issue)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <CreateIssueModal
          onClose={() => setShowCreate(false)}
          onCreate={onCreateIssue as Parameters<typeof CreateIssueModal>[0]['onCreate']}
          sprints={sprints}
          members={members}
          defaultSprintId={createSprintId}
          reporterId={user?.id}
        />
      )}

      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          projectKey={project.key}
          sprints={sprints}
          members={members}
          onClose={() => setSelectedIssue(null)}
          onUpdate={async (id, update) => {
            const ok = await onUpdateIssue(id, update);
            if (ok) setSelectedIssue(prev => prev ? { ...prev, ...update } : null);
            return ok;
          }}
          onDelete={onDeleteIssue}
        />
      )}
    </div>
  );
}

function IssueRow({ issue, projectKey, onClick }: { issue: Issue; projectKey: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors group"
    >
      <IssueTypeBadge type={issue.type} />
      <span className="text-xs text-slate-400 w-16 shrink-0">{projectKey}-{issue.order || '?'}</span>
      <span className="flex-1 text-sm text-slate-700 group-hover:text-blue-600 transition-colors truncate">{issue.title}</span>
      <div className="flex items-center gap-2 shrink-0">
        <PriorityBadge priority={issue.priority} />
        <StatusBadge status={issue.status} />
        {issue.story_points !== null && issue.story_points !== undefined && (
          <span className="text-xs bg-slate-100 text-slate-600 rounded px-1.5 py-0.5 font-medium">{issue.story_points}</span>
        )}
        {issue.assignee ? (
          <Avatar name={issue.assignee.full_name} url={issue.assignee.avatar_url} size="xs" />
        ) : (
          <div className="w-5 h-5 rounded-full border border-dashed border-slate-300" />
        )}
      </div>
    </div>
  );
}
