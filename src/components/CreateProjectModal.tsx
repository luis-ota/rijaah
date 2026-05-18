import { useState, FormEvent } from 'react';
import { X } from 'lucide-react';

const COLORS = ['#0052CC', '#00875A', '#DE350B', '#FF8B00', '#6554C0', '#0065FF', '#00B8D9', '#36B37E'];

interface Props {
  onClose: () => void;
  onCreate: (name: string, key: string, description: string, color: string) => Promise<unknown>;
}

export default function CreateProjectModal({ onClose, onCreate }: Props) {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);

  function handleNameChange(v: string) {
    setName(v);
    const k = v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setKey(k);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !key.trim()) return;
    setLoading(true);
    await onCreate(name.trim(), key.trim(), description.trim(), color);
    setLoading(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Create project</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Project name</label>
            <input
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="My Project"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Project key</label>
            <input
              value={key}
              onChange={e => setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
              placeholder="MYPROJ"
              required
              maxLength={6}
            />
            <p className="text-xs text-slate-400 mt-1">Used to prefix issue IDs (e.g. MYPROJ-1)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
              placeholder="What is this project about?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || !key.trim()}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {loading ? 'Creating...' : 'Create project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
