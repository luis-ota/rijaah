import { useState, useEffect } from 'react';
import { X, Trash2, MessageCircle, Send } from 'lucide-react';
import type { Issue, IssueType, IssuePriority, IssueStatus, Sprint, ProjectMember, Comment } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import IssueTypeBadge from './IssueTypeBadge';
import PriorityBadge from './PriorityBadge';
import Avatar from './Avatar';

const STATUSES: IssueStatus[] = ['todo', 'in_progress', 'in_review', 'done'];
const STATUS_LABELS: Record<IssueStatus, string> = {
  todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review', done: 'Done',
};
const TYPES: IssueType[] = ['task', 'bug', 'story', 'epic', 'subtask'];
const PRIORITIES: IssuePriority[] = ['lowest', 'low', 'medium', 'high', 'highest'];

interface Props {
  issue: Issue;
  projectKey: string;
  sprints: Sprint[];
  members: ProjectMember[];
  onClose: () => void;
  onUpdate: (id: string, update: Partial<Issue>) => Promise<boolean>;
  onDelete: (id: string) => Promise<void>;
}

export default function IssueDetailModal({ issue, projectKey, sprints, members, onClose, onUpdate, onDelete }: Props) {
  const { user, profile } = useAuth();
  const [title, setTitle] = useState(issue.title);
  const [description, setDescription] = useState(issue.description || '');
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComment, setLoadingComment] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [issue.id]);

  async function fetchComments() {
    const { data } = await supabase
      .from('comments')
      .select('*, author:profiles(*)')
      .eq('issue_id', issue.id)
      .order('created_at', { ascending: true });
    if (data) setComments(data as unknown as Comment[]);
  }

  async function saveTitle() {
    if (title.trim() && title !== issue.title) {
      await onUpdate(issue.id, { title: title.trim() });
    }
    setEditingTitle(false);
  }

  async function saveDescription() {
    if (description !== issue.description) {
      await onUpdate(issue.id, { description });
    }
    setEditingDesc(false);
  }

  async function handleCommentSubmit() {
    if (!commentText.trim() || !user) return;
    setLoadingComment(true);
    await supabase.from('comments').insert({ issue_id: issue.id, author_id: user.id, body: commentText.trim() });
    setCommentText('');
    await fetchComments();
    setLoadingComment(false);
  }

  async function handleDeleteComment(id: string) {
    await supabase.from('comments').delete().eq('id', id);
    await fetchComments();
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <IssueTypeBadge type={issue.type} showLabel />
            <span className="text-xs text-slate-400 font-medium">{projectKey}-{issue.order || '?'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded"
              title="Delete issue"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Main */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Title */}
            {editingTitle ? (
              <input
                autoFocus
                value={title}
                onChange={e => setTitle(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
                className="w-full text-xl font-semibold text-slate-900 border border-blue-400 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <h2
                onClick={() => setEditingTitle(true)}
                className="text-xl font-semibold text-slate-900 cursor-text hover:bg-slate-50 rounded-lg px-2 py-1 -mx-2"
              >
                {issue.title}
              </h2>
            )}

            {/* Description */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Description</h3>
              {editingDesc ? (
                <div>
                  <textarea
                    autoFocus
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={4}
                  />
                  <div className="flex gap-2 mt-2">
                    <button onClick={saveDescription} className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors">
                      Save
                    </button>
                    <button onClick={() => { setDescription(issue.description || ''); setEditingDesc(false); }} className="px-3 py-1 text-slate-600 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setEditingDesc(true)}
                  className="min-h-[60px] text-sm text-slate-600 cursor-text hover:bg-slate-50 rounded-lg px-3 py-2 -mx-3 whitespace-pre-wrap"
                >
                  {description || <span className="text-slate-400 italic">Add a description...</span>}
                </div>
              )}
            </div>

            {/* Comments */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Comments {comments.length > 0 && <span className="text-slate-400 font-normal">({comments.length})</span>}
              </h3>
              <div className="space-y-4">
                {comments.map(c => (
                  <div key={c.id} className="flex gap-3">
                    {c.author && <Avatar name={c.author.full_name} url={c.author.avatar_url} size="sm" />}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-slate-700">{c.author?.full_name}</span>
                        <span className="text-xs text-slate-400">{formatDate(c.created_at)}</span>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-slate-600 whitespace-pre-wrap flex-1">{c.body}</p>
                        {c.author_id === user?.id && (
                          <button onClick={() => handleDeleteComment(c.id)} className="text-slate-300 hover:text-red-400 transition-colors shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-4">
                {profile && <Avatar name={profile.full_name} url={profile.avatar_url} size="sm" />}
                <div className="flex-1 flex gap-2">
                  <input
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCommentSubmit(); } }}
                    placeholder="Add a comment..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleCommentSubmit}
                    disabled={!commentText.trim() || loadingComment}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar metadata */}
          <div className="w-56 border-l border-slate-100 p-4 space-y-5 overflow-y-auto shrink-0">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Status</label>
              <select
                value={issue.status}
                onChange={e => onUpdate(issue.id, { status: e.target.value as IssueStatus })}
                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Type</label>
              <select
                value={issue.type}
                onChange={e => onUpdate(issue.id, { type: e.target.value as IssueType })}
                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
              >
                {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Priority</label>
              <div className="flex items-center gap-1.5">
                <PriorityBadge priority={issue.priority} showLabel />
              </div>
              <select
                value={issue.priority}
                onChange={e => onUpdate(issue.id, { priority: e.target.value as IssuePriority })}
                className="w-full mt-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
              >
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Assignee</label>
              <select
                value={issue.assignee_id ?? ''}
                onChange={e => onUpdate(issue.id, { assignee_id: e.target.value || null })}
                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.user_id} value={m.user_id}>{m.profile?.full_name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Sprint</label>
              <select
                value={issue.sprint_id ?? ''}
                onChange={e => onUpdate(issue.id, { sprint_id: e.target.value || null })}
                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Backlog</option>
                {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Story points</label>
              <input
                type="number"
                defaultValue={issue.story_points ?? ''}
                onBlur={e => onUpdate(issue.id, { story_points: e.target.value ? parseInt(e.target.value) : null })}
                min={0}
                max={100}
                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="None"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Reporter</label>
              <p className="text-xs text-slate-600">{issue.reporter?.full_name || '—'}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Created</label>
              <p className="text-xs text-slate-500">{formatDate(issue.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Delete confirmation */}
        {confirmDelete && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-2xl z-10">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
              <h3 className="font-semibold text-slate-900 mb-2">Delete issue?</h3>
              <p className="text-sm text-slate-500 mb-4">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={async () => { await onDelete(issue.id); onClose(); }}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
