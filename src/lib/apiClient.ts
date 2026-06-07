// API client shim that mimics a minimal subset of @supabase/supabase-js v2
// and talks to our local Express+Postgres backend.

import type { Session, User } from '@supabase/supabase-js';

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001';

type AuthChangeHandler = (event: string, session: Session | null) => void;

const STORAGE_KEY = 'rijaah_session';

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return toSession(parsed);
  } catch { return null; }
}

function saveSession(session: Session | null) {
  if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  else localStorage.removeItem(STORAGE_KEY);
}

function toUser(u: { id: string; email: string }): User {
  return {
    id: u.id,
    email: u.email,
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  } as User;
}

function toSession(raw: { access_token: string; user: { id: string; email: string } } | null): Session | null {
  if (!raw) return null;
  return {
    access_token: raw.access_token,
    refresh_token: '',
    expires_in: 99999999,
    expires_at: Math.floor(Date.now() / 1000) + 99999999,
    token_type: 'bearer',
    user: toUser(raw.user),
  } as Session;
}

const authListeners: Set<AuthChangeHandler> = new Set();
let currentSession = loadSession();
let isSigningOut = false;

function clearSessionAndNotify() {
  if (isSigningOut) return;
  isSigningOut = true;
  currentSession = null;
  saveSession(null);
  authListeners.forEach(h => h('SIGNED_OUT', null));
  setTimeout(() => { isSigningOut = false; }, 500);
}

async function api<T = unknown>(path: string, options: RequestInit = {}): Promise<{ data: T; error: { message: string } | null }> {
  if (isSigningOut && !path.startsWith('/auth/')) {
    return { data: null as unknown as T, error: { message: 'Signing out' } };
  }
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (currentSession?.access_token) {
    headers['Authorization'] = `Bearer ${currentSession.access_token}`;
  }
  try {
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const text = await res.text();
    let json: unknown = null;
    try { json = text ? JSON.parse(text) : null; } catch { /* not json */ }
    if (!res.ok) {
      if (res.status === 401 && !path.startsWith('/auth/')) {
        clearSessionAndNotify();
      }
      const errMsg = (json && typeof json === 'object' && 'error' in (json as Record<string, unknown>))
        ? String((json as Record<string, unknown>).error)
        : res.statusText;
      return { data: null as unknown as T, error: { message: errMsg } };
    }
    return { data: json as T, error: null };
  } catch (e) {
    return { data: null as unknown as T, error: { message: (e as Error).message } };
  }
}

// ============== Query builder ==============

class QueryBuilder<T = unknown> {
  private filters: { type: string; col: string; val: unknown }[] = [];
  private _single = false;
  private _maybeSingle = false;

  constructor(private table: string, private method: 'select' | 'insert' | 'update' | 'delete', private body?: unknown) {}

  select(_cols?: string) { return this; }
  insert(data: unknown) { this.body = data; return this; }
  update(data: unknown) { this.body = data; return this; }
  upsert(data: unknown) { this.body = data; this.method = 'insert'; return this; }
  delete() { this.method = 'delete'; return this; }

  eq(col: string, val: unknown) { this.filters.push({ type: 'eq', col, val }); return this; }
  neq(col: string, val: unknown) { this.filters.push({ type: 'neq', col, val }); return this; }
  in(col: string, vals: unknown[]) { this.filters.push({ type: 'in', col, val: vals }); return this; }
  ilike(col: string, val: string) { this.filters.push({ type: 'ilike', col, val }); return this; }
  gt(col: string, val: unknown) { this.filters.push({ type: 'gt', col, val }); return this; }
  gte(col: string, val: unknown) { this.filters.push({ type: 'gte', col, val }); return this; }
  lt(col: string, val: unknown) { this.filters.push({ type: 'lt', col, val }); return this; }
  lte(col: string, val: unknown) { this.filters.push({ type: 'lte', col, val }); return this; }
  order(_col: string, _opts: { ascending?: boolean } = {}) { return this; }
  limit(n: number) { this.filters.push({ type: 'limit', col: '', val: n }); return this; }
  single() { this._single = true; return this; }
  maybeSingle() { this._maybeSingle = true; return this; }

  private buildQuery(excludeId?: { col: string; val: string }): string {
    if (this.method === 'select' && this.filters.length === 0) return '';
    const parts: string[] = [];
    for (const f of this.filters) {
      if (excludeId && f.type === 'eq' && f.col === excludeId.col && f.val === excludeId.val) continue;
      if (f.type === 'limit') { parts.push(`limit=${f.val}`); continue; }
      let v = f.val;
      if (f.type === 'ilike' && typeof v === 'string') v = v.replace(/%/g, '');
      if (f.type === 'in' && Array.isArray(v)) v = `(${v.map(x => `"${x}"`).join(',')})`;
      if (f.type === 'eq' || f.type === 'neq') parts.push(`${f.col}=${encodeURIComponent(String(v))}`);
      else parts.push(`${f.col}_${f.type}=${encodeURIComponent(String(v))}`);
    }
    return parts.length ? `?${parts.join('&')}` : '';
  }

  private extractIdFilter(): { col: string; val: string } | null {
    const eq = this.filters.find(f => f.type === 'eq' && f.col === 'id');
    if (eq && typeof eq.val === 'string') return { col: eq.col, val: eq.val };
    return null;
  }

  then<TResult1 = { data: T; error: null }, TResult2 = never>(
    onfulfilled?: ((value: { data: T; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.exec().then(onfulfilled as never, onrejected as never);
  }

  private async exec(): Promise<{ data: T; error: null }> {
    let path = `/${this.table}`;
    let method = 'GET';
    let body: BodyInit | undefined;

    if (this.method === 'select') {
      path += this.buildQuery();
    } else if (this.method === 'insert') {
      method = 'POST';
      body = JSON.stringify(this.body);
    } else if (this.method === 'update') {
      method = 'PATCH';
      const idFilter = this.extractIdFilter();
      if (idFilter) {
        path += `/${idFilter.val}`;
        path += this.buildQuery(idFilter);
      } else {
        path += this.buildQuery();
      }
      body = JSON.stringify(this.body);
    } else if (this.method === 'delete') {
      method = 'DELETE';
      const idFilter = this.extractIdFilter();
      if (idFilter) {
        path += `/${idFilter.val}`;
        path += this.buildQuery(idFilter);
      } else {
        path += this.buildQuery();
      }
    }

    const result = await api<unknown>(path, { method, body });
    if (result.error) {
      return { data: null as unknown as T, error: result.error as unknown as null };
    }
    let data = result.data as unknown;
    if (this._single || this._maybeSingle) {
      if (Array.isArray(data)) data = data[0] ?? null;
    }
    return { data: data as T, error: null };
  }
}

class TableQuery<T = unknown> {
  constructor(private table: string) {}
  select(_cols?: string) { return new QueryBuilder<T[]>(this.table, 'select'); }
  insert(data: unknown) { return new QueryBuilder<T>(this.table, 'insert', data); }
  update(data: unknown) { return new QueryBuilder<T>(this.table, 'update', data); }
  upsert(data: unknown) { return new QueryBuilder<T>(this.table, 'insert', data); }
  delete() { return new QueryBuilder<T[]>(this.table, 'delete'); }
}

// ============== Auth (Supabase-compatible) ==============

const auth = {
  async getSession(): Promise<{ data: { session: Session | null }; error: null }> {
    if (currentSession) {
      const { error } = await api<{ user: { id: string } }>('/auth/me');
      if (error) {
        clearSessionAndNotify();
      }
    }
    return { data: { session: currentSession }, error: null };
  },
  async getUser(): Promise<{ data: { user: User | null }; error: null }> {
    return { data: { user: currentSession?.user ?? null }, error: null };
  },
  onAuthStateChange(handler: AuthChangeHandler) {
    authListeners.add(handler);
    queueMicrotask(() => handler('INITIAL_SESSION', currentSession));
    return { data: { subscription: { unsubscribe: () => { authListeners.delete(handler); } } } };
  },
  async signInWithPassword({ email, password }: { email: string; password: string }) {
    const result = await api<{ user: { id: string; email: string }; session: { access_token: string; user: { id: string; email: string } } }>(
      '/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }
    );
    if (result.error) return { data: { user: null, session: null }, error: new Error(result.error.message) };
    currentSession = toSession(result.data.session);
    saveSession(currentSession);
    authListeners.forEach(h => h('SIGNED_IN', currentSession));
    return { data: { user: toUser(result.data.user), session: currentSession }, error: null };
  },
  async signUp({ email, password, options }: { email: string; password: string; options?: { data?: { full_name?: string } } }) {
    const full_name = options?.data?.full_name;
    const result = await api<{ user: { id: string; email: string }; session: { access_token: string; user: { id: string; email: string } } }>(
      '/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, full_name }) }
    );
    if (result.error) return { data: { user: null, session: null }, user: null, error: new Error(result.error.message) };
    currentSession = toSession(result.data.session);
    saveSession(currentSession);
    authListeners.forEach(h => h('SIGNED_IN', currentSession));
    return { data: { user: toUser(result.data.user), session: currentSession }, user: toUser(result.data.user), error: null };
  },
  async signOut() {
    clearSessionAndNotify();
    return { error: null };
  },
};

function from<T = unknown>(table: string): TableQuery<T> {
  return new TableQuery<T>(table);
}

function rpc(_fn: string, _args?: Record<string, unknown>): Promise<{ data: unknown; error: null }> {
  return Promise.resolve({ data: null, error: null });
}

export const supabase = { from, auth, rpc };
export type ApiClient = typeof supabase;
