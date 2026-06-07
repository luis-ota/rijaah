import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react';
import { addMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, isSameMonth, isToday, parseISO } from 'date-fns';
import type { Issue, Sprint, IssueLabel } from '../types';
import IssueTypeBadge from './IssueTypeBadge';
import Avatar from './Avatar';

interface Props {
  issues: Issue[];
  sprints: Sprint[];
  issueLabels: IssueLabel[];
  onSelectIssue: (issue: Issue) => void;
}

export default function CalendarView({ issues, sprints, issueLabels, onSelectIssue }: Props) {
  const [cursor, setCursor] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  // Map each issue to a date (due_date preferred, else sprint end_date)
  const issuesByDate = useMemo(() => {
    const map = new Map<string, Issue[]>();
    const sprintMap = new Map(sprints.map(s => [s.id, s]));
    for (const issue of issues) {
      let date: Date | null = null;
      if (issue.due_date) date = parseISO(issue.due_date);
      else if (issue.sprint_id) {
        const s = sprintMap.get(issue.sprint_id);
        if (s?.end_date) date = parseISO(s.end_date);
      }
      if (!date) continue;
      const key = format(date, 'yyyy-MM-dd');
      const arr = map.get(key) ?? [];
      arr.push(issue);
      map.set(key, arr);
    }
    return map;
  }, [issues, sprints]);

  const labelsByIssue = useMemo(() => {
    const m = new Map<string, IssueLabel[]>();
    for (const il of issueLabels) {
      const arr = m.get(il.issue_id) ?? [];
      arr.push(il);
      m.set(il.issue_id, arr);
    }
    return m;
  }, [issueLabels]);

  const selectedDayKey = selectedDay ? format(selectedDay, 'yyyy-MM-dd') : null;
  const selectedIssues = selectedDayKey ? (issuesByDate.get(selectedDayKey) ?? []) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CalIcon className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-800">{format(cursor, 'MMMM yyyy')}</h2>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setCursor(addMonths(cursor, -1))} className="p-1.5 rounded hover:bg-slate-100">
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <button onClick={() => { setCursor(new Date()); setSelectedDay(new Date()); }} className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded">Today</button>
            <button onClick={() => setCursor(addMonths(cursor, 1))} className="p-1.5 rounded hover:bg-slate-100">
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="px-2 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide text-center">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 flex-1 auto-rows-fr">
          {days.map(day => {
            const key = format(day, 'yyyy-MM-dd');
            const dayIssues = issuesByDate.get(key) ?? [];
            const inMonth = isSameMonth(day, cursor);
            const isSel = selectedDay && isSameDay(day, selectedDay);
            const isT = isToday(day);
            return (
              <button
                key={key}
                onClick={() => setSelectedDay(day)}
                className={`border-r border-b border-slate-100 p-1.5 text-left flex flex-col gap-1 min-h-[90px] hover:bg-slate-50 transition-colors ${
                  !inMonth ? 'bg-slate-50/50' : ''
                } ${isSel ? 'ring-2 ring-blue-400 ring-inset' : ''}`}
              >
                <div className={`text-xs font-medium ${inMonth ? 'text-slate-700' : 'text-slate-400'} ${isT ? 'inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white' : ''}`}>
                  {format(day, 'd')}
                </div>
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  {dayIssues.slice(0, 3).map(issue => (
                    <div
                      key={issue.id}
                      onClick={e => { e.stopPropagation(); onSelectIssue(issue); }}
                      className="text-[10px] truncate px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
                    >
                      {issue.key ?? '—'} {issue.title}
                    </div>
                  ))}
                  {dayIssues.length > 3 && (
                    <div className="text-[10px] text-slate-500 px-1">+{dayIssues.length - 3} more</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">
            {selectedDay ? format(selectedDay, "EEEE, MMM d") : 'Select a day'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{selectedIssues.length} issue{selectedIssues.length === 1 ? '' : 's'}</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {selectedIssues.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">No issues for this day</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {selectedIssues.map(issue => {
                const labels = labelsByIssue.get(issue.id) ?? [];
                return (
                  <button
                    key={issue.id}
                    onClick={() => onSelectIssue(issue)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <IssueTypeBadge type={issue.type} />
                      <span className="text-[10px] text-slate-400 font-mono">{issue.key}</span>
                    </div>
                    <p className="text-sm text-slate-800 group-hover:text-blue-600 line-clamp-2 mb-1.5">{issue.title}</p>
                    <div className="flex flex-wrap gap-1 mb-1">
                      {labels.map(l => (
                        <span key={l.label_id} className="text-[10px] px-1.5 py-0 rounded" style={{ backgroundColor: `${l.color}26`, color: l.color }}>{l.name}</span>
                      ))}
                    </div>
                    {issue.assignee && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Avatar name={issue.assignee.full_name} url={issue.assignee.avatar_url} size="xs" />
                        <span className="text-xs text-slate-500">{issue.assignee.full_name}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
