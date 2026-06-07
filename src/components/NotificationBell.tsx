import { useState, useEffect, useRef } from 'react';
import { Bell, Check } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import type { AppNotification } from '../types';

export default function NotificationBell({ onSelectIssue }: { onSelectIssue?: (issueId: string) => void }) {
  const { user } = useAuth();
  const { notifications, unread, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {unread.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
            {unread.length > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-slate-400">
                No notifications yet
              </div>
            ) : (
              notifications.map(n => (
                <NotificationItem
                  key={n.id}
                  n={n}
                  onClick={() => {
                    if (!n.read_at) markRead(n.id);
                    if (n.issue_id && onSelectIssue) onSelectIssue(n.issue_id);
                    setOpen(false);
                  }}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({ n, onClick }: { n: AppNotification; onClick: () => void }) {
  const isUnread = !n.read_at;
  const title = (n.payload?.issue_title as string | undefined) ?? 'New notification';
  const key = (n.payload?.issue_key as string | undefined) ?? '';
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-3 ${isUnread ? 'bg-blue-50/40' : ''}`}
    >
      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold shrink-0">
        {n.actor?.full_name?.[0]?.toUpperCase() ?? '!'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-800">
          {n.type === 'issue_assigned' && (
            <>You were assigned issue <span className="font-medium">{key}</span>: <span className="text-slate-600">{title}</span></>
          )}
          {n.type === 'comment_added' && (
            <>New comment on <span className="font-medium">{title}</span></>
          )}
          {n.type === 'sprint_started' && (
            <>Sprint <span className="font-medium">{title}</span> started</>
          )}
          {n.type === 'sprint_completed' && (
            <>Sprint <span className="font-medium">{title}</span> completed</>
          )}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
        </p>
      </div>
      {isUnread && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />}
    </button>
  );
}
