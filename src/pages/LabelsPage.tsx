import { Tag } from 'lucide-react';
import type { Project, Label } from '../types';
import LabelsManager from '../components/LabelsManager';

interface Props {
  project: Project;
  labels: Label[];
  onCreate: (name: string, color: string) => Promise<unknown>;
  onUpdate: (id: string, update: Partial<Label>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function LabelsPage({ project, labels, onCreate, onUpdate, onDelete }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-200 bg-white">
        <h1 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Tag className="w-5 h-5 text-slate-400" />
          {project.name} — Labels
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">Organize issues with colored labels (e.g. bug, urgent, frontend)</p>
      </div>
      <div className="flex-1 overflow-y-auto p-6 max-w-3xl">
        <LabelsManager labels={labels} onCreate={onCreate} onUpdate={onUpdate} onDelete={onDelete} />
      </div>
    </div>
  );
}
