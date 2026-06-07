import type { Label } from '../types';

export default function LabelChip({ label, onRemove, size = 'sm' }: { label: Pick<Label, 'name' | 'color'>; onRemove?: () => void; size?: 'xs' | 'sm' }) {
  const sizeCls = size === 'xs' ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded font-medium ${sizeCls}`}
      style={{ backgroundColor: `${label.color}26`, color: label.color, border: `1px solid ${label.color}55` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: label.color }} />
      {label.name}
      {onRemove && (
        <button onClick={e => { e.stopPropagation(); onRemove(); }} className="ml-0.5 opacity-60 hover:opacity-100">×</button>
      )}
    </span>
  );
}
