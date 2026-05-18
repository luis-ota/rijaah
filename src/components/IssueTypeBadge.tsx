import { Bug, BookOpen, Zap, Layers, CheckSquare } from 'lucide-react';
import type { IssueType } from '../types';

const configs: Record<IssueType, { icon: React.ReactNode; color: string; label: string }> = {
  task: { icon: <CheckSquare className="w-3.5 h-3.5" />, color: 'text-blue-600 bg-blue-50', label: 'Task' },
  bug: { icon: <Bug className="w-3.5 h-3.5" />, color: 'text-red-600 bg-red-50', label: 'Bug' },
  story: { icon: <BookOpen className="w-3.5 h-3.5" />, color: 'text-emerald-600 bg-emerald-50', label: 'Story' },
  epic: { icon: <Zap className="w-3.5 h-3.5" />, color: 'text-violet-600 bg-violet-50', label: 'Epic' },
  subtask: { icon: <Layers className="w-3.5 h-3.5" />, color: 'text-slate-600 bg-slate-100', label: 'Subtask' },
};

export default function IssueTypeBadge({ type, showLabel = false }: { type: IssueType; showLabel?: boolean }) {
  const cfg = configs[type] ?? configs.task;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${cfg.color}`}>
      {cfg.icon}
      {showLabel && cfg.label}
    </span>
  );
}
