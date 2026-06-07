import { useState, useRef, useEffect } from 'react';
import { Plus, X, Check } from 'lucide-react';
import type { Label } from '../types';
import LabelChip from './LabelChip';

interface Props {
  available: Label[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onCreateLabel?: (name: string) => void;
}

export default function LabelPicker({ available, selectedIds, onChange, onCreateLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = available.filter(l => selectedIds.includes(l.id));
  const unselected = available.filter(l => !selectedIds.includes(l.id));

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowCreate(false);
        setNewName('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function toggle(id: string) {
    onChange(selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id]);
  }

  function handleCreate() {
    if (!newName.trim() || !onCreateLabel) return;
    onCreateLabel(newName.trim());
    setNewName('');
    setShowCreate(false);
    setOpen(false);
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Labels</label>
      <div className="flex flex-wrap gap-1.5 items-center min-h-[28px]">
        {selected.map(l => <LabelChip key={l.id} label={l} onRemove={() => toggle(l.id)} />)}
        <div className="relative" ref={ref}>
          <button
            onClick={() => { setOpen(v => !v); setShowCreate(false); setNewName(''); }}
            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border border-dashed border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            <Plus className="w-3 h-3" /> Add label
          </button>
          {open && (
            <div className="absolute left-0 top-full mt-1 z-10 min-w-[200px]">
              <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-1">
                {showCreate ? (
                  <div className="flex gap-1 p-1">
                    <input
                      autoFocus
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setShowCreate(false); setNewName(''); } }}
                      placeholder="Label name"
                      className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs"
                    />
                    <button onClick={handleCreate} className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"><Check className="w-3 h-3" /></button>
                    <button onClick={() => { setShowCreate(false); setNewName(''); }} className="px-2 py-1 text-slate-500 text-xs rounded hover:bg-slate-100"><X className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <>
                    {unselected.map(l => (
                      <button
                        key={l.id}
                        onClick={() => { toggle(l.id); setOpen(false); }}
                        className="w-full text-left px-2 py-1 hover:bg-slate-50 rounded text-xs"
                      >
                        <LabelChip label={l} />
                      </button>
                    ))}
                    {onCreateLabel && (
                      <button
                        onClick={() => setShowCreate(true)}
                        className="w-full text-left px-2 py-1 mt-1 border-t border-slate-100 text-blue-600 hover:bg-blue-50 rounded text-xs font-medium"
                      >
                        + Create new label
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
