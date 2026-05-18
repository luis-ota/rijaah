import type { IssueStatus } from '../types';

const configs: Record<IssueStatus, { label: string; color: string }> = {
  todo: { label: 'To Do', color: 'bg-slate-100 text-slate-600' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  in_review: { label: 'In Review', color: 'bg-amber-100 text-amber-700' },
  done: { label: 'Done', color: 'bg-emerald-100 text-emerald-700' },
};

export default function StatusBadge({ status }: { status: IssueStatus }) {
  const cfg = configs[status] ?? configs.todo;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}
