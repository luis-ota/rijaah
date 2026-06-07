import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { differenceInDays, format, parseISO, eachDayOfInterval, isAfter, isBefore, addDays } from 'date-fns';
import type { Issue, Sprint } from '../types';

interface Props {
  sprint: Sprint;
  issues: Issue[];
}

export default function BurndownChart({ sprint, issues }: Props) {
  const data = useMemo(() => {
    if (!sprint.start_date || !sprint.end_date) return [];
    const start = parseISO(sprint.start_date);
    const end = parseISO(sprint.end_date);
    const today = new Date();
    const lastDate = isBefore(today, end) ? today : end;

    const sprintIssues = issues.filter(i => i.sprint_id === sprint.id);
    const totalSP = sprintIssues.reduce((sum, i) => sum + (i.story_points ?? 0), 0);

    const days = eachDayOfInterval({ start, end: addDays(lastDate, 0) });
    // For each day, count SP still pending
    const points: { day: string; date: string; ideal: number; actual: number | null }[] = [];
    for (const d of days) {
      const dStr = format(d, 'yyyy-MM-dd');
      const doneSP = sprintIssues.reduce((sum, i) => {
        if (i.status === 'done') {
          const doneDate = i.updated_at ? i.updated_at.slice(0, 10) : null;
          if (doneDate && doneDate <= dStr) return sum + (i.story_points ?? 0);
        }
        return sum;
      }, 0);
      const remaining = totalSP - doneSP;
      const isFuture = isAfter(d, today);
      points.push({
        day: format(d, 'MMM d'),
        date: dStr,
        ideal: Math.max(0, totalSP - (totalSP * (differenceInDays(d, start) / Math.max(1, differenceInDays(end, start))))),
        actual: isFuture ? null : Math.max(0, remaining),
      });
    }
    return points;
  }, [sprint, issues]);

  if (data.length === 0) {
    return (
      <div className="text-center py-16 text-sm text-slate-400 bg-slate-50 rounded-xl">
        Set a start and end date on the sprint to see the burndown chart.
      </div>
    );
  }

  const totalSP = data[0]?.ideal ?? 0;
  const finalActual = data[data.length - 1]?.actual ?? 0;
  const completed = totalSP - finalActual;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Total SP" value={Math.round(totalSP)} color="bg-blue-50 text-blue-700" />
        <Stat label="Completed" value={Math.round(completed)} color="bg-emerald-50 text-emerald-700" />
        <Stat label="Remaining" value={Math.round(finalActual)} color="bg-amber-50 text-amber-700" />
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
            <YAxis stroke="#64748b" fontSize={11} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="ideal" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" name="Ideal" dot={false} />
            <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2.5} name="Actual" connectNulls dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl p-3 ${color}`}>
      <p className="text-xs font-medium opacity-80">{label}</p>
      <p className="text-2xl font-semibold mt-0.5">{value}</p>
    </div>
  );
}
