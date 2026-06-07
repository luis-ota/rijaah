import { useState, FormEvent } from 'react';
import { Plus, Trash2, GripVertical, Edit2, Check, X } from 'lucide-react';
import type { KanbanColumn } from '../types';

const COLORS = ['#94a3b8', '#64748b', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

interface Props {
  columns: KanbanColumn[];
  issuesCount?: Record<string, number>;
  onCreate: (payload: { key: string; label: string; color: string; order: number }) => Promise<unknown>;
  onUpdate: (id: string, update: Partial<KanbanColumn>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReorder: (ids: string[]) => Promise<void>;
  disabled?: boolean;
}

export default function KanbanColumnsManager({ columns, issuesCount = {}, onCreate, onUpdate, onDelete, onReorder, disabled = false }: Props) {
  const [label, setLabel] = useState('');
  const [key, setKey] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editColor, setEditColor] = useState('');

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!label.trim() || !key.trim()) return;
    setCreating(true);
    const slug = key.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    await onCreate({ key: slug, label: label.trim(), color, order: columns.length });
    setLabel(''); setKey(''); setColor(COLORS[0]);
    setCreating(false);
  }

  async function move(id: string, dir: -1 | 1) {
    const idx = columns.findIndex(c => c.id === id);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= columns.length) return;
    const newOrder = [...columns];
    [newOrder[idx], newOrder[newIdx]] = [newOrder[newIdx], newOrder[idx]];
    await onReorder(newOrder.map(c => c.id));
  }

  function startEdit(c: KanbanColumn) {
    setEditingId(c.id);
    setEditLabel(c.label);
    setEditColor(c.color);
  }

  async function saveEdit() {
    if (!editingId) return;
    await onUpdate(editingId, { label: editLabel, color: editColor });
    setEditingId(null);
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleCreate} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-800">New column</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Label</label>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Blocked"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Key (internal)</label>
            <input
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder="e.g. blocked"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Color</label>
          <div className="flex gap-1.5">
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full border-2 ${color === c ? 'border-slate-800 scale-110' : 'border-white'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <button
          type="submit"
          disabled={disabled || creating || !label.trim() || !key.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Add column
        </button>
      </form>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">
          {columns.length} column{columns.length === 1 ? '' : 's'}
        </div>
        {columns.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-400">No columns yet</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {columns.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-slate-50 group">
                <GripVertical className="w-4 h-4 text-slate-300" />
                <div className="flex flex-col">
                  <button onClick={() => move(c.id, -1)} disabled={disabled || i === 0} className="text-slate-400 hover:text-slate-700 disabled:opacity-30 text-xs leading-none">▲</button>
                  <button onClick={() => move(c.id, 1)} disabled={disabled || i === columns.length - 1} className="text-slate-400 hover:text-slate-700 disabled:opacity-30 text-xs leading-none">▼</button>
                </div>
                {editingId === c.id ? (
                  <>
                    <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer" />
                    <input value={editLabel} onChange={e => setEditLabel(e.target.value)} className="flex-1 px-2 py-1 border border-blue-300 rounded text-sm" />
                    <button onClick={saveEdit} className="text-emerald-600 hover:text-emerald-700"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                  </>
                ) : (
                  <>
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="flex-1 text-sm text-slate-700">{c.label}</span>
                    <span className="text-xs text-slate-400 font-mono">{c.key}</span>
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{issuesCount[c.key] ?? 0} issues</span>
                    {c.is_default && <span className="text-[10px] text-slate-400 uppercase tracking-wide">default</span>}
                    <button onClick={() => startEdit(c)} disabled={disabled} className="text-slate-300 hover:text-blue-500 opacity-0 group-hover:opacity-100 disabled:opacity-0" title="Edit">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        const count = issuesCount[c.key] ?? 0;
                        if (count > 0) { alert(`Cannot delete: ${count} issues in this column. Move them first.`); return; }
                        if (confirm(`Delete column "${c.label}"?`)) onDelete(c.id);
                      }}
                      disabled={disabled}
                      className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 disabled:opacity-0" title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
