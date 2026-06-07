import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import crypto from 'crypto';
import { readdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/rijaah';

const pool = new Pool({ connectionString: DATABASE_URL });

async function migrate() {
  const dir = join(__dirname, 'migrations');
  const files = readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
  for (const f of files) {
    const sql = readFileSync(join(dir, f), 'utf8');
    try {
      console.log(`[migrate] applying ${f}`);
      await pool.query(sql);
    } catch (err) {
      console.log(`[migrate] ${f}: ${err.message} (continuing)`);
    }
  }
}

async function seedIfEmpty() {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS cnt FROM auth_users');
  if (rows[0].cnt > 0) return;
  const seedDir = join(__dirname, 'seed');
  const files = readdirSync(seedDir).filter(f => f.endsWith('.sql')).sort();
  for (const f of files) {
    const sql = readFileSync(join(seedDir, f), 'utf8');
    try {
      console.log(`[seed] applying ${f}`);
      await pool.query(sql);
    } catch (err) {
      console.log(`[seed] ${f}: ${err.message} (continuing)`);
    }
  }
}

const RESERVED_COLS = new Set(['order', 'user', 'group', 'check', 'default', 'all', 'any', 'some', 'exists', 'union', 'intersect', 'except', 'limit', 'offset', 'fetch', 'first', 'last', 'key', 'value', 'number', 'type', 'status', 'name', 'host', 'year', 'month', 'day', 'hour', 'minute', 'second']);

function qCol(name) {
  return RESERVED_COLS.has(name.toLowerCase()) ? `"${name}"` : name;
}

function buildPatchSets(fields, body) {
  const sets = [];
  const vals = [];
  let i = 1;
  for (const f of fields) {
    if (body[f] !== undefined) {
      sets.push(`${qCol(f)} = $${i++}`);
      vals.push(body[f]);
    }
  }
  return { sets, vals, nextIdx: i };
}

function hashPassword(pw) {
  return crypto.createHash('sha256').update(pw + ':rijaah-salt').digest('hex');
}

function signToken(userId) {
  const payload = { sub: userId, iat: Date.now() };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', 'rijaah-secret').update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token) {
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', 'rijaah-secret').update(body).digest('base64url');
  if (sig !== expected) return null;
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch { return null; }
}

async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'unauthorized' });
  const payload = verifyToken(auth.slice(7));
  if (!payload) return res.status(401).json({ error: 'invalid token' });
  req.userId = payload.sub;
  next();
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// ============== Auth ==============

app.post('/auth/signup', async (req, res) => {
  const { email, password, full_name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const userId = crypto.randomUUID();
    await pool.query(
      'INSERT INTO auth_users (id, email, password_hash, raw_user_meta_data) VALUES ($1,$2,$3,$4)',
      [userId, email, hashPassword(password), JSON.stringify({ full_name: full_name || email.split('@')[0] })]
    );
    await pool.query(
      'INSERT INTO profiles (id, full_name) VALUES ($1,$2) ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name',
      [userId, full_name || email.split('@')[0]]
    );
    const token = signToken(userId);
    res.json({ user: { id: userId, email }, session: { access_token: token, user: { id: userId, email } } });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const { rows } = await pool.query('SELECT * FROM auth_users WHERE email = $1', [email]);
  if (rows.length === 0) return res.status(400).json({ error: 'invalid credentials' });
  if (rows[0].password_hash !== hashPassword(password)) return res.status(400).json({ error: 'invalid credentials' });
  const userId = rows[0].id;
  const token = signToken(userId);
  res.json({ user: { id: userId, email }, session: { access_token: token, user: { id: userId, email } } });
});

app.get('/auth/me', authMiddleware, async (req, res) => {
  const { rows } = await pool.query('SELECT id, email FROM auth_users WHERE id = $1', [req.userId]);
  if (rows.length === 0) return res.status(404).json({ error: 'not found' });
  res.json(rows[0]);
});

// ============== Profiles ==============

app.get('/profiles', authMiddleware, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM profiles');
  res.json(rows);
});

app.get('/profiles/:id', authMiddleware, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM profiles WHERE id = $1', [req.params.id]);
  res.json(rows[0] || null);
});

app.patch('/profiles/:id', authMiddleware, async (req, res) => {
  const { full_name, avatar_url } = req.body;
  await pool.query(
    'UPDATE profiles SET full_name = COALESCE($1, full_name), avatar_url = COALESCE($2, avatar_url), updated_at = now() WHERE id = $3',
    [full_name, avatar_url, req.params.id]
  );
  const { rows } = await pool.query('SELECT * FROM profiles WHERE id = $1', [req.params.id]);
  res.json(rows[0]);
});

// ============== Projects ==============

app.get('/projects', authMiddleware, async (req, res) => {
  const { rows } = await pool.query(`
    SELECT p.* FROM projects p
    WHERE p.owner_id = $1
       OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = $1)
    ORDER BY p.created_at DESC
  `, [req.userId]);
  res.json(rows);
});

app.post('/projects', authMiddleware, async (req, res) => {
  const { name, key, description, avatar_color } = req.body;
  const projectId = crypto.randomUUID();
  await pool.query(
    'INSERT INTO projects (id, name, key, description, owner_id, avatar_color) VALUES ($1,$2,$3,$4,$5,$6)',
    [projectId, name, key, description || '', req.userId, avatar_color || '#0052CC']
  );
  await pool.query(
    'INSERT INTO project_members (project_id, user_id, role) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
    [projectId, req.userId, 'owner']
  );
  await pool.query('SELECT seed_default_kanban_columns($1)', [projectId]);
  const { rows } = await pool.query('SELECT * FROM projects WHERE id = $1', [projectId]);
  res.json(rows[0]);
});

app.patch('/projects/:id', authMiddleware, async (req, res) => {
  try {
    const { sets, vals, nextIdx: i } = buildPatchSets(['name', 'description', 'avatar_color'], req.body);
    sets.push(`updated_at = now()`);
    vals.push(req.params.id);
    if (sets.length === 1) {
      const { rows } = await pool.query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
      return res.json(rows[0]);
    }
    await pool.query(`UPDATE projects SET ${sets.join(', ')} WHERE id = $${i}`, vals);
    const { rows } = await pool.query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/projects/:id', authMiddleware, async (req, res) => {
  await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

// ============== Project Members ==============

app.get('/project_members', authMiddleware, async (req, res) => {
  const { project_id } = req.query;
  const { rows } = await pool.query(`
    SELECT pm.*, json_build_object('id', p.id, 'full_name', p.full_name, 'avatar_url', p.avatar_url) as profile
    FROM project_members pm
    LEFT JOIN profiles p ON p.id = pm.user_id
    WHERE pm.project_id = $1
  `, [project_id]);
  res.json(rows);
});

app.post('/project_members', authMiddleware, async (req, res) => {
  const { project_id, user_id, role } = req.body;
  const { rows } = await pool.query(`
    INSERT INTO project_members (project_id, user_id, role) VALUES ($1,$2,$3)
    ON CONFLICT (project_id, user_id) DO UPDATE SET role = EXCLUDED.role
    RETURNING *
  `, [project_id, user_id, role || 'member']);
  res.json(rows[0]);
});

app.delete('/project_members/:id', authMiddleware, async (req, res) => {
  await pool.query('DELETE FROM project_members WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

// ============== Sprints ==============

app.get('/sprints', authMiddleware, async (req, res) => {
  const { project_id } = req.query;
  const { rows } = await pool.query(
    'SELECT * FROM sprints WHERE project_id = $1 ORDER BY created_at ASC',
    [project_id]
  );
  res.json(rows);
});

app.post('/sprints', authMiddleware, async (req, res) => {
  const { project_id, name, goal, status, start_date, end_date } = req.body;
  const { rows } = await pool.query(`
    INSERT INTO sprints (project_id, name, goal, status, start_date, end_date)
    VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
  `, [project_id, name, goal || '', status || 'planned', start_date || null, end_date || null]);
  res.json(rows[0]);
});

app.patch('/sprints/:id', authMiddleware, async (req, res) => {
  try {
    const { sets, vals, nextIdx: i } = buildPatchSets(['name', 'goal', 'status', 'start_date', 'end_date'], req.body);
    vals.push(req.params.id);
    if (sets.length === 0) {
      const { rows } = await pool.query('SELECT * FROM sprints WHERE id = $1', [req.params.id]);
      return res.json(rows[0]);
    }
    await pool.query(`UPDATE sprints SET ${sets.join(', ')} WHERE id = $${i}`, vals);
    const { rows } = await pool.query('SELECT * FROM sprints WHERE id = $1', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/sprints/:id', authMiddleware, async (req, res) => {
  await pool.query('DELETE FROM sprints WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

// ============== Issues ==============

app.get('/issues', authMiddleware, async (req, res) => {
  const { project_id } = req.query;
  const { rows } = await pool.query(`
    SELECT i.*,
      json_build_object('id', ap.id, 'full_name', ap.full_name, 'avatar_url', ap.avatar_url) as assignee,
      json_build_object('id', rp.id, 'full_name', rp.full_name, 'avatar_url', rp.avatar_url) as reporter
    FROM issues i
    LEFT JOIN profiles ap ON ap.id = i.assignee_id
    LEFT JOIN profiles rp ON rp.id = i.reporter_id
    WHERE i.project_id = $1
    ORDER BY i."order" ASC, i.created_at ASC
  `, [project_id]);
  res.json(rows);
});

app.post('/issues', authMiddleware, async (req, res) => {
  const { project_id, title, description, type, status, priority, assignee_id, reporter_id, story_points, sprint_id, due_date } = req.body;
  // Get next key
  const keyRes = await pool.query(`
    SELECT p.key, COALESCE(MAX(CAST(SUBSTRING(i.key FROM LENGTH(p.key) + 2) AS INTEGER)), 0) + 1 as next_num
    FROM projects p
    LEFT JOIN issues i ON i.project_id = p.id AND i.key ~ ('^' || p.key || '-')
    WHERE p.id = $1
    GROUP BY p.key
  `, [project_id]);
  const projectKey = keyRes.rows[0]?.key || 'ISSUE';
  const nextNum = keyRes.rows[0]?.next_num || 1;
  const issueKey = `${projectKey}-${nextNum}`;
  const { rows } = await pool.query(`
    INSERT INTO issues (project_id, title, description, type, status, priority, assignee_id, reporter_id, story_points, sprint_id, due_date, key, "order")
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, $13) RETURNING *
  `, [project_id, title, description || '', type || 'task', status || 'todo', priority || 'medium', assignee_id || null, reporter_id || null, story_points ?? null, sprint_id || null, due_date || null, issueKey, nextNum]);
  res.json(rows[0]);
});

app.patch('/issues/:id', authMiddleware, async (req, res) => {
  try {
    const { sets, vals, nextIdx: i } = buildPatchSets(['title', 'description', 'type', 'status', 'priority', 'assignee_id', 'reporter_id', 'story_points', 'sprint_id', 'order', 'due_date', 'parent_id'], req.body);
    sets.push(`updated_at = now()`);
    vals.push(req.params.id);
    if (sets.length === 1) {
      const { rows } = await pool.query('SELECT * FROM issues WHERE id = $1', [req.params.id]);
      return res.json(rows[0]);
    }
    await pool.query(`UPDATE issues SET ${sets.join(', ')} WHERE id = $${i}`, vals);
    const { rows } = await pool.query('SELECT * FROM issues WHERE id = $1', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/issues/:id', authMiddleware, async (req, res) => {
  await pool.query('DELETE FROM issues WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

// ============== Comments ==============

app.get('/comments', authMiddleware, async (req, res) => {
  const { issue_id } = req.query;
  const { rows } = await pool.query(`
    SELECT c.*, json_build_object('id', p.id, 'full_name', p.full_name, 'avatar_url', p.avatar_url) as author
    FROM comments c
    LEFT JOIN profiles p ON p.id = c.author_id
    WHERE c.issue_id = $1
    ORDER BY c.created_at ASC
  `, [issue_id]);
  res.json(rows);
});

app.post('/comments', authMiddleware, async (req, res) => {
  const { issue_id, body } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO comments (issue_id, author_id, body) VALUES ($1,$2,$3) RETURNING *',
    [issue_id, req.userId, body]
  );
  res.json(rows[0]);
});

app.patch('/comments/:id', authMiddleware, async (req, res) => {
  const { body } = req.body;
  await pool.query('UPDATE comments SET body = $1, updated_at = now() WHERE id = $2 AND author_id = $3', [body, req.params.id, req.userId]);
  const { rows } = await pool.query('SELECT * FROM comments WHERE id = $1', [req.params.id]);
  res.json(rows[0]);
});

app.delete('/comments/:id', authMiddleware, async (req, res) => {
  await pool.query('DELETE FROM comments WHERE id = $1 AND author_id = $2', [req.params.id, req.userId]);
  res.json({ ok: true });
});

// ============== Labels ==============

app.get('/labels', authMiddleware, async (req, res) => {
  const { project_id } = req.query;
  const { rows } = await pool.query('SELECT * FROM labels WHERE project_id = $1 ORDER BY name', [project_id]);
  res.json(rows);
});

app.post('/labels', authMiddleware, async (req, res) => {
  const { project_id, name, color } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO labels (project_id, name, color) VALUES ($1,$2,$3) RETURNING *',
    [project_id, name, color || '#0052CC']
  );
  res.json(rows[0]);
});

app.patch('/labels/:id', authMiddleware, async (req, res) => {
  try {
    const { sets, vals, nextIdx: i } = buildPatchSets(['name', 'color'], req.body);
    vals.push(req.params.id);
    if (sets.length === 0) {
      const { rows } = await pool.query('SELECT * FROM labels WHERE id = $1', [req.params.id]);
      return res.json(rows[0]);
    }
    await pool.query(`UPDATE labels SET ${sets.join(', ')} WHERE id = $${i}`, vals);
    const { rows } = await pool.query('SELECT * FROM labels WHERE id = $1', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/labels/:id', authMiddleware, async (req, res) => {
  await pool.query('DELETE FROM labels WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

// ============== Issue Labels ==============

app.get('/issue_labels', authMiddleware, async (req, res) => {
  const { issue_id } = req.query;
  const { rows } = await pool.query(`
    SELECT il.issue_id, il.label_id, l.name, l.color
    FROM issue_labels il
    JOIN labels l ON l.id = il.label_id
    WHERE il.issue_id = $1
  `, [issue_id]);
  res.json(rows);
});

app.get('/issue_labels/by_issue', authMiddleware, async (req, res) => {
  const { project_id } = req.query;
  const { rows } = await pool.query(`
    SELECT il.issue_id, il.label_id, l.name, l.color
    FROM issue_labels il
    JOIN labels l ON l.id = il.label_id
    JOIN issues i ON i.id = il.issue_id
    WHERE i.project_id = $1
  `, [project_id]);
  res.json(rows);
});

app.post('/issue_labels', authMiddleware, async (req, res) => {
  const { issue_id, label_id } = req.body;
  await pool.query('INSERT INTO issue_labels (issue_id, label_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [issue_id, label_id]);
  res.json({ ok: true });
});

app.delete('/issue_labels', authMiddleware, async (req, res) => {
  const { issue_id, label_id } = req.query;
  await pool.query('DELETE FROM issue_labels WHERE issue_id = $1 AND label_id = $2', [issue_id, label_id]);
  res.json({ ok: true });
});

// ============== Kanban Columns ==============

app.get('/kanban_columns', authMiddleware, async (req, res) => {
  const { project_id } = req.query;
  const { rows } = await pool.query(
    'SELECT * FROM kanban_columns WHERE project_id = $1 ORDER BY "order" ASC',
    [project_id]
  );
  res.json(rows);
});

app.post('/kanban_columns', authMiddleware, async (req, res) => {
  const { project_id, key, label, color, order, is_default } = req.body;
  const { rows } = await pool.query(`
    INSERT INTO kanban_columns (project_id, key, label, color, "order", is_default)
    VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
  `, [project_id, key, label, color || '#94a3b8', order ?? 0, is_default ?? false]);
  res.json(rows[0]);
});

app.patch('/kanban_columns', authMiddleware, async (req, res) => {
  try {
    const { project_id } = req.query;
    if (!project_id) return res.status(400).json({ error: 'project_id required' });
    const { sets, vals, nextIdx: i } = buildPatchSets(['key', 'label', 'color', 'order', 'is_default'], req.body);
    if (sets.length === 0) return res.json([]);
    vals.push(project_id);
    await pool.query(`UPDATE kanban_columns SET ${sets.join(', ')} WHERE project_id = $${i}`, vals);
    const { rows } = await pool.query('SELECT * FROM kanban_columns WHERE project_id = $1 ORDER BY "order" ASC', [project_id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/kanban_columns/:id', authMiddleware, async (req, res) => {
  try {
    const { sets, vals, nextIdx: i } = buildPatchSets(['key', 'label', 'color', 'order', 'is_default'], req.body);
    vals.push(req.params.id);
    if (sets.length === 0) {
      const { rows } = await pool.query('SELECT * FROM kanban_columns WHERE id = $1', [req.params.id]);
      return res.json(rows[0]);
    }
    await pool.query(`UPDATE kanban_columns SET ${sets.join(', ')} WHERE id = $${i}`, vals);
    const { rows } = await pool.query('SELECT * FROM kanban_columns WHERE id = $1', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/kanban_columns/reorder', authMiddleware, async (req, res) => {
  const { ids } = req.body; // array of column ids in desired order
  for (let i = 0; i < ids.length; i++) {
    await pool.query('UPDATE kanban_columns SET "order" = $1 WHERE id = $2', [i, ids[i]]);
  }
  res.json({ ok: true });
});

app.delete('/kanban_columns/:id', authMiddleware, async (req, res) => {
  await pool.query('DELETE FROM kanban_columns WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

// ============== Notifications ==============

app.get('/notifications', authMiddleware, async (req, res) => {
  const { rows } = await pool.query(`
    SELECT n.*,
      json_build_object('id', p.id, 'full_name', p.full_name, 'avatar_url', p.avatar_url) as actor
    FROM notifications n
    LEFT JOIN profiles p ON p.id = n.actor_id
    WHERE n.user_id = $1
    ORDER BY n.created_at DESC
    LIMIT 100
  `, [req.userId]);
  res.json(rows);
});

app.post('/notifications/:id/read', authMiddleware, async (req, res) => {
  await pool.query('UPDATE notifications SET read_at = now() WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
  res.json({ ok: true });
});

app.post('/notifications/read_all', authMiddleware, async (req, res) => {
  await pool.query('UPDATE notifications SET read_at = now() WHERE user_id = $1 AND read_at IS NULL', [req.userId]);
  res.json({ ok: true });
});

app.get('/health', (_, res) => res.json({ ok: true }));

(async () => {
  await migrate();
  await seedIfEmpty();
  app.listen(PORT, '0.0.0.0', () => console.log(`[server] listening on ${PORT}`));
})();
