import type { Issue, IssueLabel } from '../types';
import IssueTypeBadge from './IssueTypeBadge';
import PriorityBadge from './PriorityBadge';
import Avatar from './Avatar';
import LabelChip from './LabelChip';

interface Props {
  issue: Issue;
  projectKey: string;
  labels?: IssueLabel[];
  onClick: () => void;
  onDragStart?: (e: React.DragEvent) => void;
}

export default function IssueCard({ issue, projectKey, labels, onClick, onDragStart }: Props) {
  return (
    <div
      draggable
      onDragStart={e => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', issue.id);
        e.currentTarget.classList.add('drag-ghost');
        onDragStart?.(e);
      }}
      onDragEnd={e => {
        e.currentTarget.classList.remove('drag-ghost');
      }}
      onClick={onClick}
      className="bg-white border border-slate-200 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-blue-400 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm text-slate-800 font-medium leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
          {issue.title}
        </p>
      </div>
      {labels && labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {labels.slice(0, 3).map(l => <LabelChip key={l.label_id} label={l} size="xs" />)}
          {labels.length > 3 && <span className="text-[10px] text-slate-400">+{labels.length - 3}</span>}
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <IssueTypeBadge type={issue.type} />
          <PriorityBadge priority={issue.priority} />
          <span className="text-xs text-slate-400">{issue.key || `${projectKey}-${issue.order || '?'}`}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {issue.due_date && (
            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
              {new Date(issue.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {issue.story_points !== null && issue.story_points !== undefined && (
            <span className="text-xs bg-slate-100 text-slate-600 rounded px-1.5 py-0.5 font-medium">
              {issue.story_points}
            </span>
          )}
        {issue.assignee && (
          <Avatar name={issue.assignee.full_name || ''} url={issue.assignee.avatar_url} size="xs" />
        )}
        </div>
      </div>
    </div>
  );
}
