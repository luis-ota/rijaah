import { useMemo } from 'react';
import { differenceInDays, parseISO, isValid, isAfter, isBefore } from 'date-fns';
import { TrendingUp, CheckCircle2, Clock, ListChecks, BarChart3, Calendar } from 'lucide-react';
import type { Issue, Sprint, Profile } from '../types';
import Avatar from './Avatar';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import BurndownChart from './BurndownChart';

interface Props {
  sprint: Sprint;
  issues: Issue[];
  members: Profile[];
}

export default function SprintReport({ sprint, issues, members }: Props) {
  const data = useMemo(() => {
    const sprintIssues = issues.filter(i => i.sprint_id === sprint.id);
    const total = sprintIssues.length;
    const done = sprintIssues.filter(i => i.status === 'done').length;
    const inProgress = sprintIssues.filter(i => i.status === 'in_progress').length;
    const inReview = sprintIssues.filter(i => i.status === 'in_review').length;
    const todo = sprintIssues.filter(i => i.status === 'todo').length;
    const completedSP = sprintIssues.filter(i => i.status === 'done').reduce((s, i) => s + (i.story_points ?? 0), 0);
    const committedSP = sprintIssues.reduce((s, i) => s + (i.story_points ?? 0), 0);
    const completionPct = total > 0 ? Math.round((done / total) * 100) : 0;

    // avg completion time (days from created_at -> updated_at, where status=done)
    const completedIssues = sprintIssues.filter(i => i.status === 'done');
    let avgDays = 0;
    if (completedIssues.length > 0) {
      const sum = completedIssues.reduce((s, i) => {
        const start = parseISO(i.created_at);
        const end = parseISO(i.updated_at);
        if (!isValid(start) || !isValid(end)) return s;
        return s + Math.max(0, differenceInDays(end, start));
      }, 0);
      avgDays = sum / completedIssues.length;
    }

    // Sprint elapsed/total
    let elapsed = 0, totalDays = 0, timePct = 0;
    if (sprint.start_date && sprint.end_date) {
      const s = parseISO(sprint.start_date);
      const e = parseISO(sprint.end_date);
      const now = new Date();
      if (isValid(s) && isValid(e) && isAfter(e, s)) {
        totalDays = differenceInDays(e, s);
        if (isBefore(now, s)) elapsed = 0;
        else if (isAfter(now, e)) elapsed = totalDays;
        else elapsed = differenceInDays(now, s);
        timePct = totalDays > 0 ? Math.round((elapsed / totalDays) * 100) : 0;
      }
    }

    // Per-member completion
    const byMember: Record<string, { done: number; total: number; sp: number }> = {};
    for (const i of sprintIssues) {
      const k = i.assignee_id ?? 'unassigned';
      if (!byMember[k]) byMember[k] = { done: 0, total: 0, sp: 0 };
      byMember[k].total++;
      byMember[k].sp += i.story_points ?? 0;
      if (i.status === 'done') byMember[k].done++;
    }

    return { total, done, inProgress, inReview, todo, completedSP, committedSP, completionPct, avgDays, elapsed, totalDays, timePct, byMember, sprintIssues };
  }, [sprint, issues]);

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">{sprint.name}</h2>
            {sprint.goal && <p className="text-sm text-slate-500 mt-0.5">{sprint.goal}</p>}
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {sprint.start_date ? new Date(sprint.start_date).toLocaleDateString() : '—'} → {sprint.end_date ? new Date(sprint.end_date).toLocaleDateString() : '—'}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={<ListChecks className="w-4 h-4" />} label="Total issues" value={data.total} color="bg-slate-50 text-slate-700" />
          <StatCard icon={<CheckCircle2 className="w-4 h-4" />} label="Completed" value={data.done} color="bg-emerald-50 text-emerald-700" />
          <StatCard icon={<Clock className="w-4 h-4" />} label="In progress" value={data.inProgress} color="bg-blue-50 text-blue-700" />
          <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Completion" value={`${data.completionPct}%`} color="bg-violet-50 text-violet-700" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-slate-400" /> Story points</h3>
          <div className="space-y-2">
            <ProgressBar label="Completed" value={data.completedSP} total={data.committedSP} color="bg-emerald-500" />
            <ProgressBar label="Remaining" value={data.committedSP - data.completedSP} total={data.committedSP} color="bg-amber-500" />
            <p className="text-xs text-slate-500 pt-1">{data.completedSP} / {data.committedSP} points committed</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Sprint progress</h3>
          <div className="space-y-2">
            <ProgressBar label="Time elapsed" value={data.elapsed} total={data.totalDays} color="bg-blue-500" suffix={` ${data.elapsed}/${data.totalDays} days`} />
            <ProgressBar label="Work completed" value={data.done} total={data.total} color="bg-emerald-500" suffix={` ${data.done}/${data.total}`} />
            <p className="text-xs text-slate-500 pt-1">
              Avg time to complete: <span className="font-medium text-slate-700">{data.avgDays.toFixed(1)} days</span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">By assignee</h3>
        {Object.keys(data.byMember).length === 0 ? (
          <p className="text-xs text-slate-400">No assignees</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(data.byMember).map(([uid, m]) => {
              const member = members.find(x => x.id === uid);
              const name = uid === 'unassigned' ? 'Unassigned' : (member?.full_name ?? 'Unknown');
              return (
                <div key={uid} className="flex items-center gap-3">
                  {uid === 'unassigned' ? (
                    <div className="w-6 h-6 rounded-full border border-dashed border-slate-300" />
                  ) : (
                    member && <Avatar name={member.full_name} url={member.avatar_url} size="xs" />
                  )}
                  <span className="w-32 text-sm text-slate-700 truncate">{name}</span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${m.total > 0 ? (m.done / m.total) * 100 : 0}%` }} />
                  </div>
                  <span className="text-xs text-slate-500 w-20 text-right">{m.done}/{m.total} · {m.sp}sp</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Burndown</h3>
        <BurndownChart sprint={sprint} issues={data.sprintIssues} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Completed ({data.done})</h3>
          <IssueList issues={data.sprintIssues.filter(i => i.status === 'done')} />
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" /> Remaining ({data.total - data.done})</h3>
          <IssueList issues={data.sprintIssues.filter(i => i.status !== 'done')} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className={`rounded-lg p-3 ${color}`}>
      <div className="flex items-center gap-1.5 opacity-80 text-xs font-medium">{icon}{label}</div>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}

function ProgressBar({ label, value, total, color, suffix = '' }: { label: string; value: number; total: number; color: string; suffix?: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-600">{label}</span>
        <span className="text-xs text-slate-500">{pct}%{suffix}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function IssueList({ issues }: { issues: Issue[] }) {
  if (issues.length === 0) return <p className="text-xs text-slate-400 italic">None</p>;
  return (
    <div className="space-y-1.5 max-h-64 overflow-y-auto">
      {issues.map(i => (
        <div key={i.id} className="flex items-center gap-2 text-sm">
          <span className="text-[10px] text-slate-400 font-mono w-12 shrink-0">{i.key}</span>
          <StatusBadge status={i.status} />
          <PriorityBadge priority={i.priority} />
          <span className="flex-1 truncate text-slate-700">{i.title}</span>
          {i.story_points !== null && i.story_points !== undefined && (
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">{i.story_points}sp</span>
          )}
        </div>
      ))}
    </div>
  );
}
