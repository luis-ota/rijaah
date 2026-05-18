import { Layers, LayoutDashboard, List, GitBranch, Settings, Plus, ChevronDown, ChevronRight, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Project } from '../types';
import Avatar from './Avatar';

type View = 'board' | 'backlog' | 'sprints' | 'settings' | 'projects';

interface SidebarProps {
  projects: Project[];
  activeProject: Project | null;
  currentView: View;
  onSelectProject: (p: Project) => void;
  onChangeView: (v: View) => void;
  onNewProject: () => void;
}

export default function Sidebar({
  projects, activeProject, currentView, onSelectProject, onChangeView, onNewProject
}: SidebarProps) {
  const { profile, signOut } = useAuth();
  const [projectsExpanded, setProjectsExpanded] = useState(true);

  const navItems: { view: View; icon: React.ReactNode; label: string }[] = [
    { view: 'board', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Board' },
    { view: 'backlog', icon: <List className="w-4 h-4" />, label: 'Backlog' },
    { view: 'sprints', icon: <GitBranch className="w-4 h-4" />, label: 'Sprints' },
    { view: 'settings', icon: <Settings className="w-4 h-4" />, label: 'Settings' },
  ];

  return (
    <aside className="w-60 bg-slate-900 text-white flex flex-col h-screen sticky top-0 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-slate-700/50">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
          <Layers className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-sm text-white">ProjectFlow</span>
      </div>

      {/* Projects section */}
      <div className="flex-1 overflow-y-auto py-3">
        <div className="px-3 mb-1">
          <button
            onClick={() => setProjectsExpanded(v => !v)}
            className="flex items-center justify-between w-full text-xs font-semibold text-slate-400 uppercase tracking-wider px-1 py-1 hover:text-slate-300 transition-colors"
          >
            <span>Projects</span>
            <div className="flex items-center gap-1">
              <button
                onClick={e => { e.stopPropagation(); onNewProject(); }}
                className="p-0.5 hover:bg-slate-700 rounded transition-colors"
                title="New project"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              {projectsExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </div>
          </button>
        </div>

        {projectsExpanded && (
          <div className="space-y-0.5 px-2 mb-4">
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => { onSelectProject(p); onChangeView('board'); }}
                className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm transition-colors text-left ${
                  activeProject?.id === p.id
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span
                  className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ backgroundColor: p.avatar_color }}
                >
                  {p.key[0]}
                </span>
                <span className="truncate">{p.name}</span>
              </button>
            ))}
            {projects.length === 0 && (
              <p className="text-xs text-slate-500 px-2 py-1">No projects yet</p>
            )}
          </div>
        )}

        {/* Project nav */}
        {activeProject && (
          <>
            <div className="px-4 mb-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{activeProject.key}</p>
            </div>
            <div className="space-y-0.5 px-2">
              {navItems.map(item => (
                <button
                  key={item.view}
                  onClick={() => onChangeView(item.view)}
                  className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                    currentView === item.view
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* User */}
      <div className="border-t border-slate-700/50 p-3 flex items-center gap-2.5">
        {profile && <Avatar name={profile.full_name || 'User'} url={profile.avatar_url} size="sm" />}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-white truncate">{profile?.full_name || 'User'}</p>
        </div>
        <button onClick={signOut} className="text-slate-400 hover:text-white transition-colors" title="Sign out">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
