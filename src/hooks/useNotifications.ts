import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { AppNotification } from '../types';
import { useAuth } from '../context/AuthContext';

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001';

export function useNotifications() {
  const { user, session } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase.from<AppNotification>('notifications').select('*');
    if (data) setNotifications(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  async function markRead(id: string) {
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
    await fetchNotifications();
  }

  async function markAllRead() {
    if (!user || !session?.access_token) return;
    try {
      await fetch(`${API_BASE}/notifications/read_all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      });
    } catch { /* ignore */ }
    await fetchNotifications();
  }

  const unread = notifications.filter(n => !n.read_at);

  return { notifications, unread, loading, markRead, markAllRead, refetch: fetchNotifications };
}
