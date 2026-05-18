import { Plus, Layers, Calendar } from 'lucide-react';
import type { Project } from '../types';

interface Props {
  projects: Project[];
  onSelectProject: (p: Project) => void;
  onCreateProject: () => void;
}

export default function ProjectsHomePage({ projects, onSelectProject, onCreateProject }: Props) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Projects</h1>
            <p className="text-sm text-slate-500 mt-0.5">Your software projects</p>
          </div>
          <button
            onClick={onCreateProject}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Layers className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-slate-700 font-semibold mb-1">No projects yet</h3>
            <p className="text-slate-400 text-sm mb-4">Create your first project to start tracking issues</p>
            <button
              onClick={onCreateProject}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Create project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => onSelectProject(p)}
                className="bg-white border border-slate-200 rounded-xl p-5 text-left hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0"
                    style={{ backgroundColor: p.avatar_color }}
                  >
                    {p.key[0]}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 text-sm truncate group-hover:text-blue-600 transition-colors">{p.name}</h3>
                    <span className="text-xs text-slate-400 font-mono">{p.key}</span>
                  </div>
                </div>
                {p.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3">{p.description}</p>
                )}
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Calendar className="w-3 h-3" />
                  {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
