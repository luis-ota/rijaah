import { useState, FormEvent } from 'react';
import { X } from 'lucide-react';
import type { IssueType, IssuePriority, IssueStatus, Sprint, ProjectMember } from '../types';

interface Props {
  onClose: () => void;
  onCreate: (payload: {
    title: string;
    type: string;
    status: string;
    priority: string;
    sprint_id?: string | null;
    assignee_id?: string | null;
    story_points?: number | null;
    description?: string;
    reporter_id?: string;
  }) => Promise<unknown>;
  sprints: Sprint[];
  members: ProjectMember[];
  defaultStatus?: IssueStatus;
  defaultSprintId?: string | null;
  reporterId?: string;
}

const TYPES: IssueType[] = ['task', 'bug', 'story', 'epic', 'subtask'];
const PRIORITIES: IssuePriority[] = ['lowest', 'low', 'medium', 'high', 'highest'];
const STATUSES: IssueStatus[] = ['todo', 'in_progress', 'in_review', 'done'];

const STATUS_LABELS: Record<IssueStatus, string> = {
  todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review', done: 'Done'
};

export default function CreateIssueModal({ onClose, onCreate, sprints, members, defaultStatus = 'todo', defaultSprintId = null, reporterId }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<IssueType>('task');
  const [status, setStatus] = useState<IssueStatus>(defaultStatus);
  const [priority, setPriority] = useState<IssuePriority>('medium');
  const [sprintId, setSprintId] = useState<string | null>(defaultSprintId);
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [storyPoints, setStoryPoints] = useState<string>('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    await onCreate({
      title: title.trim(),
      description: description.trim(),
      type,
      status,
      priority,
      sprint_id: sprintId,
      assignee_id: assigneeId,
      story_points: storyPoints ? parseInt(storyPoints) : null,
      reporter_id: reporterId,
    });
    setLoading(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <h2 className="font-semibold text-slate-900">Create issue</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Summary <span className="text-red-500">*</span></label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Issue summary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="Add a description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as IssueType)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white capitalize"
              >
                {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as IssuePriority)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white capitalize"
              >
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as IssueStatus)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Story points</label>
              <input
                type="number"
                value={storyPoints}
                onChange={e => setStoryPoints(e.target.value)}
                min={0}
                max={100}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="—"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Sprint</label>
              <select
                value={sprintId ?? ''}
                onChange={e => setSprintId(e.target.value || null)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">Backlog</option>
                {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Assignee</label>
              <select
                value={assigneeId ?? ''}
                onChange={e => setAssigneeId(e.target.value || null)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.user_id} value={m.user_id}>{m.profile?.full_name}</option>)}
              </select>
            </div>
          </div>
        </form>

        <div className="flex gap-3 px-6 py-4 border-t border-slate-200 shrink-0">
          <button type="button" onClick={onClose} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit as unknown as React.MouseEventHandler}
            disabled={loading || !title.trim()}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? 'Creating...' : 'Create issue'}
          </button>
        </div>
      </div>
    </div>
  );
}
