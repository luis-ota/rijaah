import { ArrowDown, ArrowUp, Minus, ChevronsUp, ChevronsDown } from 'lucide-react';
import type { IssuePriority } from '../types';

const configs: Record<IssuePriority, { icon: React.ReactNode; color: string; label: string }> = {
  highest: { icon: <ChevronsUp className="w-3.5 h-3.5" />, color: 'text-red-600', label: 'Highest' },
  high: { icon: <ArrowUp className="w-3.5 h-3.5" />, color: 'text-orange-500', label: 'High' },
  medium: { icon: <Minus className="w-3.5 h-3.5" />, color: 'text-amber-500', label: 'Medium' },
  low: { icon: <ArrowDown className="w-3.5 h-3.5" />, color: 'text-blue-500', label: 'Low' },
  lowest: { icon: <ChevronsDown className="w-3.5 h-3.5" />, color: 'text-slate-400', label: 'Lowest' },
};

export default function PriorityBadge({ priority, showLabel = false }: { priority: IssuePriority; showLabel?: boolean }) {
  const cfg = configs[priority] ?? configs.medium;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
      {cfg.icon}
      {showLabel && cfg.label}
    </span>
  );
}
