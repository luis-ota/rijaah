import type { Issue } from '../types';
import IssueTypeBadge from './IssueTypeBadge';
import PriorityBadge from './PriorityBadge';
import Avatar from './Avatar';

interface Props {
  issue: Issue;
  projectKey: string;
  onClick: () => void;
}

export default function IssueCard({ issue, projectKey, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-slate-200 rounded-lg p-3 cursor-pointer hover:border-blue-400 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm text-slate-800 font-medium leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
          {issue.title}
        </p>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <IssueTypeBadge type={issue.type} />
          <PriorityBadge priority={issue.priority} />
          <span className="text-xs text-slate-400">{projectKey}-{issue.order || '?'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {issue.story_points !== null && issue.story_points !== undefined && (
            <span className="text-xs bg-slate-100 text-slate-600 rounded px-1.5 py-0.5 font-medium">
              {issue.story_points}
            </span>
          )}
          {issue.assignee && (
            <Avatar name={issue.assignee.full_name} url={issue.assignee.avatar_url} size="xs" />
          )}
        </div>
      </div>
    </div>
  );
}
