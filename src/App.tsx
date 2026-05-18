import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import ProjectsHomePage from './pages/ProjectsHomePage';
import BoardPage from './pages/BoardPage';
import BacklogPage from './pages/BacklogPage';
import SprintsPage from './pages/SprintsPage';
import ProjectSettingsPage from './pages/ProjectSettingsPage';
import Sidebar from './components/Sidebar';
import CreateProjectModal from './components/CreateProjectModal';
import { useProjects } from './hooks/useProjects';
import { useIssues } from './hooks/useIssues';
import { useSprints } from './hooks/useSprints';
import { useMembers } from './hooks/useMembers';
import type { Project } from './types';
import { supabase } from './lib/supabase';

type View = 'board' | 'backlog' | 'sprints' | 'settings' | 'projects';

function AppContent() {
  const { user, loading } = useAuth();
  const { projects, createProject, refetch: refetchProjects } = useProjects();
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [view, setView] = useState<View>('projects');
  const [showCreateProject, setShowCreateProject] = useState(false);

  const { issues, createIssue, updateIssue, deleteIssue } = useIssues(activeProject?.id ?? null);
  const { sprints, createSprint, updateSprint, deleteSprint } = useSprints(activeProject?.id ?? null);
  const { members, refetch: refetchMembers } = useMembers(activeProject?.id ?? null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  function handleSelectProject(p: Project) {
    setActiveProject(p);
    setView('board');
  }

  async function handleUpdateProject(update: Partial<Project>) {
    if (!activeProject) return;
    await supabase.from('projects').update(update).eq('id', activeProject.id);
    setActiveProject(prev => prev ? { ...prev, ...update } : null);
    await refetchProjects();
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar
        projects={projects}
        activeProject={activeProject}
        currentView={view}
        onSelectProject={handleSelectProject}
        onChangeView={v => setView(v as View)}
        onNewProject={() => setShowCreateProject(true)}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {view === 'projects' || !activeProject ? (
          <ProjectsHomePage
            projects={projects}
            onSelectProject={handleSelectProject}
            onCreateProject={() => setShowCreateProject(true)}
          />
        ) : view === 'board' ? (
          <BoardPage
            project={activeProject}
            issues={issues}
            sprints={sprints}
            members={members}
            onCreateIssue={createIssue}
            onUpdateIssue={updateIssue}
            onDeleteIssue={deleteIssue}
          />
        ) : view === 'backlog' ? (
          <BacklogPage
            project={activeProject}
            issues={issues}
            sprints={sprints}
            members={members}
            onCreateIssue={createIssue}
            onUpdateIssue={updateIssue}
            onDeleteIssue={deleteIssue}
          />
        ) : view === 'sprints' ? (
          <SprintsPage
            project={activeProject}
            sprints={sprints}
            issues={issues}
            onCreateSprint={createSprint}
            onUpdateSprint={updateSprint}
            onDeleteSprint={deleteSprint}
          />
        ) : view === 'settings' ? (
          <ProjectSettingsPage
            project={activeProject}
            members={members}
            onUpdate={handleUpdateProject}
            onRefreshMembers={refetchMembers}
          />
        ) : null}
      </main>

      {showCreateProject && (
        <CreateProjectModal
          onClose={() => setShowCreateProject(false)}
          onCreate={createProject}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
