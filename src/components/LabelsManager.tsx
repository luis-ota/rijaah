import { useState, FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Label } from '../types';
import LabelChip from './LabelChip';

const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

interface Props {
  labels: Label[];
  onCreate: (name: string, color: string) => Promise<unknown>;
  onUpdate: (id: string, update: Partial<Label>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function LabelsManager({ labels, onCreate, onUpdate, onDelete }: Props) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    await onCreate(name.trim(), color);
    setName('');
    setColor(COLORS[0]);
    setCreating(false);
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleCreate} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-800">New label</h3>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. bug, urgent, frontend"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
            disabled={creating || !name.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        {name && (
          <div className="pt-1">
            <span className="text-xs text-slate-500 mr-2">Preview:</span>
            <LabelChip label={{ name, color }} />
          </div>
        )}
      </form>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">
          {labels.length} label{labels.length === 1 ? '' : 's'}
        </div>
        {labels.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-400">No labels yet</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {labels.map(l => (
              <div key={l.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-slate-50 group">
                <input
                  type="color"
                  value={l.color}
                  onChange={e => onUpdate(l.id, { color: e.target.value })}
                  className="w-6 h-6 rounded border border-slate-200 cursor-pointer"
                />
                <input
                  value={l.name}
                  onChange={e => onUpdate(l.id, { name: e.target.value })}
                  className="flex-1 bg-transparent text-sm text-slate-700 focus:outline-none focus:bg-white focus:px-2 focus:py-1 focus:rounded focus:ring-1 focus:ring-blue-300"
                />
                <LabelChip label={l} />
                <button
                  onClick={() => { if (confirm(`Delete label "${l.name}"?`)) onDelete(l.id); }}
                  className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
