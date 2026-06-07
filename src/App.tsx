import { useState, Component, ReactNode } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import ProjectsHomePage from './pages/ProjectsHomePage';
import BoardPage from './pages/BoardPage';
import BacklogPage from './pages/BacklogPage';
import SprintsPage from './pages/SprintsPage';
import ProjectSettingsPage from './pages/ProjectSettingsPage';
import CalendarPage from './pages/CalendarPage';
import BurndownPage from './pages/BurndownPage';
import SprintReportPage from './pages/SprintReportPage';
import LabelsPage from './pages/LabelsPage';
import Sidebar from './components/Sidebar';
import CreateProjectModal from './components/CreateProjectModal';
import NotificationBell from './components/NotificationBell';
import { useProjects } from './hooks/useProjects';
import { useIssues } from './hooks/useIssues';
import { useSprints } from './hooks/useSprints';
import { useMembers } from './hooks/useMembers';
import { useLabels } from './hooks/useLabels';
import type { Project } from './types';
import { supabase } from './lib/supabase';

type View = 'board' | 'backlog' | 'sprints' | 'settings' | 'projects' | 'calendar' | 'burndown' | 'report' | 'labels';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    console.error('ErrorBoundary caught:', error);
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
          <div className="bg-white rounded-2xl shadow-lg border border-red-200 p-8 max-w-lg w-full">
            <h2 className="text-lg font-semibold text-red-600 mb-2">Something went wrong</h2>
            <pre className="text-sm text-slate-700 bg-slate-100 p-4 rounded-lg overflow-auto max-h-64 whitespace-pre-wrap">{this.state.error.message}</pre>
            <button onClick={() => { this.setState({ error: null }); localStorage.removeItem('rijaah_session'); window.location.reload(); }} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Reload &amp; clear session</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const { user, loading } = useAuth();
  const { projects, createProject, refetch: refetchProjects } = useProjects();
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [view, setView] = useState<View>('projects');
  const [showCreateProject, setShowCreateProject] = useState(false);

  const { issues, createIssue, updateIssue, deleteIssue, moveIssue } = useIssues(activeProject?.id ?? null);
  const { sprints, createSprint, updateSprint, deleteSprint, startSprint } = useSprints(activeProject?.id ?? null);
  const { members, refetch: refetchMembers } = useMembers(activeProject?.id ?? null);
  const { labels, createLabel, updateLabel, deleteLabel } = useLabels(activeProject?.id ?? null);

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
        <div className="flex justify-end items-center gap-2 px-6 py-2 border-b border-slate-200 bg-white">
          <NotificationBell onSelectIssue={(issueId) => {
            // optionally open issue detail in a future enhancement
            console.log('open issue', issueId);
          }} />
        </div>
        <div className="flex-1 overflow-hidden">
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
              onMoveIssue={moveIssue}
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
              onStartSprint={startSprint}
            />
) : view === 'settings' ? (
  <ProjectSettingsPage
    project={activeProject}
    members={members}
    issues={issues}
    onUpdate={handleUpdateProject}
    onRefreshMembers={refetchMembers}
  />
          ) : view === 'calendar' ? (
            <CalendarPage
              project={activeProject}
              issues={issues}
              sprints={sprints}
              members={members}
              onUpdateIssue={updateIssue}
            />
          ) : view === 'burndown' ? (
            <BurndownPage
              project={activeProject}
              sprints={sprints}
              issues={issues}
            />
          ) : view === 'report' ? (
            <SprintReportPage
              project={activeProject}
              sprints={sprints}
              issues={issues}
              members={members}
            />
          ) : view === 'labels' ? (
            <LabelsPage
              project={activeProject}
              labels={labels}
              onCreate={createLabel}
              onUpdate={updateLabel}
              onDelete={deleteLabel}
            />
          ) : null}
        </div>
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
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
