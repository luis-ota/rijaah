import { useState, FormEvent } from 'react';
import { Settings, Users, Info, LayoutDashboard } from 'lucide-react';
import type { Project, ProjectMember, Issue } from '../types';
import { supabase } from '../lib/supabase';
import Avatar from '../components/Avatar';
import KanbanColumnsManager from '../components/KanbanColumnsManager';
import { useKanbanColumns } from '../hooks/useKanbanColumns';
import { useAuth } from '../context/AuthContext';

interface Props {
  project: Project;
  members: ProjectMember[];
  issues: Issue[];
  onUpdate: (update: Partial<Project>) => Promise<void>;
  onRefreshMembers: () => Promise<void>;
}

type Tab = 'details' | 'members' | 'kanban';

export default function ProjectSettingsPage({ project, members, issues, onUpdate, onRefreshMembers }: Props) {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('details');
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [savingInfo, setSavingInfo] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  const { columns, createColumn, updateColumn, deleteColumn, reorderColumns } = useKanbanColumns(project.id);

  async function handleSaveInfo(e: FormEvent) {
    e.preventDefault();
    setSavingInfo(true);
    await onUpdate({ name: name.trim(), description: description.trim() });
    setSavingInfo(false);
  }

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    setInviteLoading(true);
    const { data: allProfiles } = await supabase
      .from<{ id: string; full_name: string }>('profiles')
      .select('*');
    const profileByName = (allProfiles ?? []).filter(p =>
      p.full_name?.toLowerCase() === inviteEmail.toLowerCase() ||
      p.full_name?.toLowerCase().includes(inviteEmail.toLowerCase())
    );
    if (profileByName.length > 0) {
      const foundProfile = profileByName[0];
      const already = members.find(m => m.user_id === foundProfile.id);
      if (already) { setInviteError('User is already a member'); setInviteLoading(false); return; }
      await supabase.from('project_members').insert({ project_id: project.id, user_id: foundProfile.id, role: 'member' });
      setInviteSuccess(`${foundProfile.full_name} added to project`);
      setInviteEmail('');
      await onRefreshMembers();
    } else {
      setInviteError('User not found. Try searching by display name.');
    }
    setInviteLoading(false);
  }

  const isOwner = project.owner_id === user?.id;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'details', label: 'Details', icon: <Info className="w-3.5 h-3.5" /> },
    { id: 'members', label: `Members (${members.length})`, icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'kanban', label: 'Kanban Columns', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-200 bg-white">
        <h1 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-400" />
          {project.name} — Settings
        </h1>
      </div>

      <div className="px-6 pt-3 bg-white border-b border-slate-200">
        <div className="flex gap-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-2xl space-y-6">
        {tab === 'details' && (
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-400" />
              Project details
            </h2>
            <form onSubmit={handleSaveInfo} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Project name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!isOwner}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  disabled={!isOwner}
                />
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Project key</label>
                  <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 rounded text-sm font-mono">{project.key}</span>
                </div>
              </div>
              {isOwner && (
                <button
                  type="submit"
                  disabled={savingInfo}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {savingInfo ? 'Saving...' : 'Save changes'}
                </button>
              )}
            </form>
          </div>
        )}

        {tab === 'members' && (
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              Members ({members.length})
            </h2>

            <div className="space-y-2 mb-4">
              {members.map(m => (
                <div key={m.id} className="flex items-center gap-3 py-2">
                  {m.profile && <Avatar name={m.profile.full_name} url={m.profile.avatar_url} size="sm" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{m.profile?.full_name}</p>
                  </div>
                  <span className="text-xs text-slate-500 capitalize bg-slate-100 px-2 py-0.5 rounded-full">{m.role}</span>
                </div>
              ))}
            </div>

            {isOwner && (
              <form onSubmit={handleInvite} className="space-y-2">
                <label className="block text-xs font-medium text-slate-600">Add member by display name</label>
                {inviteError && <p className="text-xs text-red-600">{inviteError}</p>}
                {inviteSuccess && <p className="text-xs text-emerald-600">{inviteSuccess}</p>}
                <div className="flex gap-2">
                  <input
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="Display name or username"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="submit"
                    disabled={inviteLoading || !inviteEmail.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {inviteLoading ? 'Adding...' : 'Add'}
                  </button>
                </div>
                <p className="text-xs text-slate-400">The user must already have an account in Rijaah.</p>
              </form>
            )}
          </div>
        )}

        {tab === 'kanban' && (
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 text-slate-400" />
              Kanban columns
            </h2>
            <p className="text-xs text-slate-500 mb-4">Customize the columns shown on the board. Reorder, rename, recolor, or add new ones.</p>
    <KanbanColumnsManager
      columns={columns}
      issuesCount={issues.reduce<Record<string, number>>((acc, i) => { acc[i.status] = (acc[i.status] ?? 0) + 1; return acc; }, {})}
      onCreate={createColumn}
      onUpdate={updateColumn}
      onDelete={deleteColumn}
      onReorder={reorderColumns}
      disabled={!isOwner}
    />
          </div>
        )}
      </div>
    </div>
  );
}
