import { useState } from 'react';
import type { Project, Issue, Sprint, ProjectMember } from '../types';
import CalendarView from '../components/CalendarView';
import IssueDetailModal from '../components/IssueDetailModal';
import { useIssueLabelsByProject } from '../hooks/useIssueLabels';
import { useLabels } from '../hooks/useLabels';

interface Props {
  project: Project;
  issues: Issue[];
  sprints: Sprint[];
  members: ProjectMember[];
  onUpdateIssue: (id: string, update: Partial<Issue>) => Promise<boolean>;
}

export default function CalendarPage({ project, issues, sprints, members, onUpdateIssue }: Props) {
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const { issueLabels, setLabelsForIssue } = useIssueLabelsByProject(project.id);
  const { labels: projectLabels, createLabel } = useLabels(project.id);

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-200 bg-white">
        <h1 className="text-lg font-semibold text-slate-900">{project.name} — Calendar</h1>
        <p className="text-xs text-slate-500 mt-0.5">Issues shown by due date (or sprint end date if no due date)</p>
      </div>
      <div className="flex-1 overflow-hidden p-6">
        <div className="h-full">
          <CalendarView
            issues={issues}
            sprints={sprints}
            issueLabels={issueLabels}
            onSelectIssue={setSelectedIssue}
          />
        </div>
      </div>
      {selectedIssue && (
        <IssueDetailModal
      issue={selectedIssue}
      projectKey={project.key}
      sprints={sprints}
      members={members}
      projectLabels={projectLabels}
      issueLabels={issueLabels.filter(il => il.issue_id === selectedIssue.id)}
      onSetLabels={async (_issueId, labelIds) => {
        const currentLabelIds = issueLabels.filter(il => il.issue_id === _issueId).map(il => il.label_id);
        await setLabelsForIssue(_issueId, currentLabelIds, labelIds, projectLabels);
      }}
      onClose={() => setSelectedIssue(null)}
          onUpdate={async (id, update) => {
            const ok = await onUpdateIssue(id, update);
            if (ok) setSelectedIssue(prev => prev ? { ...prev, ...update } : null);
            return ok;
          }}
          onDelete={async () => setSelectedIssue(null)}
          onCreateLabel={(name) => createLabel(name, '#3b82f6')}
        />
      )}
    </div>
  );
}
