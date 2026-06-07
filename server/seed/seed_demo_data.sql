-- Rijaah Demo Data Seeder (PT-BR)
-- Idempotente (usa ON CONFLICT DO NOTHING)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Usuários ──
INSERT INTO auth_users (id, email, password_hash, raw_user_meta_data, created_at)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'admin@admin.com', encode(digest('admin123:rijaah-salt', 'sha256'), 'hex'), '{"full_name":"Admin"}', now() - interval '30 days'),
  ('a0000000-0000-0000-0000-000000000002', 'alice@demo.com',  encode(digest('demo123:rijaah-salt',  'sha256'), 'hex'), '{"full_name":"Alice Silva"}', now() - interval '30 days'),
  ('a0000000-0000-0000-0000-000000000003', 'bob@demo.com',    encode(digest('demo123:rijaah-salt',  'sha256'), 'hex'), '{"full_name":"Bob Santos"}', now() - interval '30 days'),
  ('a0000000-0000-0000-0000-000000000004', 'carol@demo.com',  encode(digest('demo123:rijaah-salt',  'sha256'), 'hex'), '{"full_name":"Carol Oliveira"}', now() - interval '30 days'),
  ('a0000000-0000-0000-0000-000000000005', 'dave@demo.com',   encode(digest('demo123:rijaah-salt',  'sha256'), 'hex'), '{"full_name":"Dave Pereira"}', now() - interval '30 days')
ON CONFLICT (id) DO NOTHING;

-- ── Perfis ──
INSERT INTO profiles (id, full_name, avatar_url, updated_at)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Admin', '', now()),
  ('a0000000-0000-0000-0000-000000000002', 'Alice Silva', '', now()),
  ('a0000000-0000-0000-0000-000000000003', 'Bob Santos', '', now()),
  ('a0000000-0000-0000-0000-000000000004', 'Carol Oliveira', '', now()),
  ('a0000000-0000-0000-0000-000000000005', 'Dave Pereira', '', now())
ON CONFLICT (id) DO NOTHING;

-- ── Projeto: Plataforma Rijaah ──
INSERT INTO projects (id, name, key, description, owner_id, avatar_color, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000001', 'Plataforma Rijaah', 'RIJ', 'Plataforma de gerenciamento de projetos estilo Jira. Projeto demo que demonstra todas as funcionalidades.', 'a0000000-0000-0000-0000-000000000001', '#0052CC', now() - interval '30 days', now())
ON CONFLICT (id) DO NOTHING;

-- ── Projeto: App Mobile ──
INSERT INTO projects (id, name, key, description, owner_id, avatar_color, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000002', 'App Mobile', 'MOB', 'Aplicativo mobile multiplataforma para usuários finais.', 'a0000000-0000-0000-0000-000000000002', '#6554C0', now() - interval '20 days', now())
ON CONFLICT (id) DO NOTHING;

-- ── Membros dos Projetos ──
INSERT INTO project_members (id, project_id, user_id, role, joined_at) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'owner', now() - interval '30 days'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'member', now() - interval '28 days'),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'member', now() - interval '25 days'),
  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'member', now() - interval '20 days'),
  ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'owner', now() - interval '20 days'),
  ('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', 'member', now() - interval '18 days'),
  ('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000005', 'member', now() - interval '15 days')
ON CONFLICT (id) DO NOTHING;

-- ── Colunas Kanban ──
SELECT seed_default_kanban_columns('b0000000-0000-0000-0000-000000000001');
SELECT seed_default_kanban_columns('b0000000-0000-0000-0000-000000000002');

INSERT INTO kanban_columns (id, project_id, key, label, color, "order", is_default) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'blocked', 'Bloqueado', '#ef4444', 4, false)
ON CONFLICT (id) DO NOTHING;

-- ── Sprints ──
INSERT INTO sprints (id, project_id, name, goal, status, start_date, end_date, created_at) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Sprint 1 — Fundação', 'Configurar arquitetura core e autenticação', 'completed', (now() - interval '28 days')::date, (now() - interval '14 days')::date, now() - interval '30 days'),
  ('e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Sprint 2 — Board e Issues', 'Implementar board Kanban, CRUD de issues e drag-and-drop', 'active', (now() - interval '13 days')::date, (now() + interval '1 day')::date, now() - interval '15 days'),
  ('e0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Sprint 3 — Relatórios e Gráficos', 'Burndown, relatório de sprint e calendário', 'planned', (now() + interval '2 days')::date, (now() + interval '16 days')::date, now() - interval '5 days'),
  ('e0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 'Sprint A — Interface', 'Construir telas principais do aplicativo', 'active', (now() - interval '10 days')::date, (now() + interval '4 days')::date, now() - interval '12 days')
ON CONFLICT (id) DO NOTHING;

-- ── Etiquetas ──
INSERT INTO labels (id, project_id, name, color) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'bug', '#ef4444'),
  ('f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'funcionalidade', '#3b82f6'),
  ('f0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'melhoria', '#8b5cf6'),
  ('f0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'documentação', '#f59e0b'),
  ('f0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'performance', '#10b981'),
  ('f0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', 'segurança', '#ec4899'),
  ('f0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000002', 'design', '#ec4899'),
  ('f0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000002', 'backend', '#6554c0')
ON CONFLICT (id) DO NOTHING;

-- ── Issues da Plataforma Rijaah ──
-- Sprint 1 (concluída)
INSERT INTO issues (id, project_id, sprint_id, key, title, description, type, status, priority, assignee_id, reporter_id, story_points, "order", due_date, created_at, updated_at) VALUES
  ('10000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'RIJ-1', 'Configurar backend Express + Postgres', 'Criar servidor API com Express e conectar ao Postgres usando o driver pg.', 'task', 'done', 'high', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 5, 1, (now() - interval '26 days')::date, now() - interval '29 days', now() - interval '26 days'),
  ('10000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'RIJ-2', 'Implementar endpoints de autenticação', 'POST /auth/signup, POST /auth/login, GET /auth/me com tokens estilo JWT.', 'task', 'done', 'high', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 8, 2, (now() - interval '24 days')::date, now() - interval '28 days', now() - interval '22 days'),
  ('10000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'RIJ-3', 'Criar migrations do banco de dados', 'Escrever migrations SQL para usuários, perfis, projetos, sprints, issues e comentários.', 'task', 'done', 'medium', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 3, 3, (now() - interval '20 days')::date, now() - interval '27 days', now() - interval '20 days'),
  ('10000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'RIJ-4', 'Corrigir problemas de CORS no ambiente dev', 'Navegador bloqueando requisições cross-origin do Vite para o Express.', 'bug', 'done', 'high', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 2, 4, (now() - interval '18 days')::date, now() - interval '25 days', now() - interval '18 days'),
  ('10000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'RIJ-5', 'Criar página de perfil do usuário', 'Criar página de edição de perfil com placeholder para upload de avatar.', 'story', 'done', 'low', 'a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 3, 5, (now() - interval '16 days')::date, now() - interval '23 days', now() - interval '16 days')
ON CONFLICT (id) DO NOTHING;

-- Sprint 2 (ativa)
INSERT INTO issues (id, project_id, sprint_id, key, title, description, type, status, priority, assignee_id, reporter_id, story_points, "order", due_date, created_at, updated_at) VALUES
  ('10000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'RIJ-6', 'Implementar board Kanban com drag-and-drop', 'Board com colunas, arrastar issues entre colunas e persistir mudanças de status.', 'story', 'done', 'highest', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 13, 6, (now() - interval '5 days')::date, now() - interval '14 days', now() - interval '5 days'),
  ('10000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'RIJ-7', 'Criar modal de issue com todos os campos', 'Modal para criar issues com tipo, prioridade, responsável, sprint e story points.', 'task', 'done', 'high', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 5, 7, (now() - interval '3 days')::date, now() - interval '13 days', now() - interval '3 days'),
  ('10000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'RIJ-8', 'Modal de detalhes da issue com edição', 'Visualização completa da issue com edição inline de título, descrição e todos os campos.', 'task', 'in_progress', 'high', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 8, 8, (now() + interval '2 days')::date, now() - interval '12 days', now() - interval '1 day'),
  ('10000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'RIJ-9', 'Comentários em issues', 'Adicionar, editar e excluir comentários com timestamps relativos.', 'task', 'done', 'medium', 'a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 5, 9, (now() - interval '7 days')::date, now() - interval '11 days', now() - interval '7 days'),
  ('10000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'RIJ-10', 'Sistema de etiquetas', 'CRUD de etiquetas, atribuir etiquetas a issues e filtrar por etiqueta.', 'task', 'done', 'medium', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 5, 10, (now() - interval '4 days')::date, now() - interval '10 days', now() - interval '4 days'),
  ('10000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'RIJ-11', 'Visualização em calendário', 'Calendário mensal mostrando issues por data de vencimento e sprint.', 'task', 'in_progress', 'medium', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 5, 11, (now() + interval '1 day')::date, now() - interval '9 days', now()),
  ('10000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'RIJ-12', 'Sino de notificação de atribuição', 'Mostrar notificação quando uma issue é atribuída a você.', 'task', 'done', 'medium', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 3, 12, (now() - interval '6 days')::date, now() - interval '8 days', now() - interval '6 days'),
  ('10000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'RIJ-13', 'Board quebra quando nome do avatar é nulo', 'Componente Avatar trava se full_name vier nulo do banco.', 'bug', 'done', 'high', 'a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000003', 2, 13, (now() - interval '8 days')::date, now() - interval '7 days', now() - interval '5 days'),
  ('10000000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'RIJ-14', 'Arrastar issues do backlog para sprints', 'Arrastar issues do backlog para sprints e vice-versa.', 'task', 'in_review', 'medium', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 5, 14, (now() + interval '0 days')::date, now() - interval '6 days', now()),
  ('10000000-0000-0000-0000-000000000015', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'RIJ-15', 'Ações de iniciar e finalizar sprint', 'Botões para iniciar e finalizar sprint com validação de data.', 'task', 'todo', 'medium', NULL, 'a0000000-0000-0000-0000-000000000001', 3, 15, (now() + interval '1 day')::date, now() - interval '5 days', now() - interval '5 days'),
  ('10000000-0000-0000-0000-000000000016', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'RIJ-16', 'Tela branca com sessão expirada', 'App mostra tela branca quando localStorage tem sessão expirada.', 'bug', 'in_progress', 'highest', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 5, 16, (now() + interval '1 day')::date, now() - interval '4 days', now()),
  ('10000000-0000-0000-0000-000000000017', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'RIJ-17', 'Colunas Kanban personalizadas por projeto', 'Permitir que projetos personalizem colunas do board com nomes e cores.', 'story', 'done', 'high', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 8, 17, (now() - interval '2 days')::date, now() - interval '3 days', now() - interval '2 days')
ON CONFLICT (id) DO NOTHING;

-- Sprint 3 (planejada)
INSERT INTO issues (id, project_id, sprint_id, key, title, description, type, status, priority, assignee_id, reporter_id, story_points, "order", due_date, created_at, updated_at) VALUES
  ('10000000-0000-0000-0000-000000000018', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000003', 'RIJ-18', 'Gráfico burndown por sprint', 'Gráfico de linhas mostrando story points ideais vs reais restantes.', 'story', 'todo', 'high', NULL, 'a0000000-0000-0000-0000-000000000001', 8, 18, NULL, now() - interval '2 days', now() - interval '2 days'),
  ('10000000-0000-0000-0000-000000000019', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000003', 'RIJ-19', 'Relatório de sprint com estatísticas', 'Velocidade da sprint, taxa de conclusão, tempo médio de issue e carga do time.', 'task', 'todo', 'high', NULL, 'a0000000-0000-0000-0000-000000000002', 5, 19, NULL, now() - interval '1 day', now() - interval '1 day'),
  ('10000000-0000-0000-0000-000000000020', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000003', 'RIJ-20', 'Notificações em tempo real via WebSocket', 'Substituir polling por notificações baseadas em WebSocket.', 'task', 'todo', 'low', NULL, 'a0000000-0000-0000-0000-000000000001', 13, 20, NULL, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Backlog (sem sprint)
INSERT INTO issues (id, project_id, sprint_id, key, title, description, type, status, priority, assignee_id, reporter_id, story_points, "order", due_date, created_at, updated_at) VALUES
  ('10000000-0000-0000-0000-000000000021', 'b0000000-0000-0000-0000-000000000001', NULL, 'RIJ-21', 'Suporte a modo escuro', 'Adicionar toggle de modo escuro com detecção de preferência do sistema.', 'story', 'todo', 'low', NULL, 'a0000000-0000-0000-0000-000000000003', 8, 21, NULL, now() - interval '10 days', now() - interval '10 days'),
  ('10000000-0000-0000-0000-000000000022', 'b0000000-0000-0000-0000-000000000001', NULL, 'RIJ-22', 'Anexos em issues', 'Permitir upload de imagens e arquivos nas issues.', 'story', 'todo', 'medium', NULL, 'a0000000-0000-0000-0000-000000000001', 13, 22, NULL, now() - interval '8 days', now() - interval '8 days'),
  ('10000000-0000-0000-0000-000000000023', 'b0000000-0000-0000-0000-000000000001', NULL, 'RIJ-23', 'Hierarquia de épicos e subtarefas', 'Vincular épicos a stories e subtarefas para melhor organização.', 'story', 'todo', 'medium', NULL, 'a0000000-0000-0000-0000-000000000002', 8, 23, NULL, now() - interval '5 days', now() - interval '5 days'),
  ('10000000-0000-0000-0000-000000000024', 'b0000000-0000-0000-0000-000000000001', NULL, 'RIJ-24', 'Rate limiting da API', 'Adicionar limite de taxa para prevenir abuso dos endpoints da API.', 'task', 'todo', 'high', NULL, 'a0000000-0000-0000-0000-000000000004', 3, 24, NULL, now() - interval '3 days', now() - interval '3 days')
ON CONFLICT (id) DO NOTHING;

-- Issues do App Mobile
INSERT INTO issues (id, project_id, sprint_id, key, title, description, type, status, priority, assignee_id, reporter_id, story_points, "order", due_date, created_at, updated_at) VALUES
  ('10000000-0000-0000-0000-000000000025', 'b0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000004', 'MOB-1', 'Tela de login', 'Criar e implementar a tela de login com campos de email e senha.', 'story', 'done', 'high', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 5, 1, (now() - interval '7 days')::date, now() - interval '12 days', now() - interval '7 days'),
  ('10000000-0000-0000-0000-000000000026', 'b0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000004', 'MOB-2', 'Navegação do dashboard', 'Navegação por abas inferiores com dashboard, projetos e perfil.', 'task', 'in_progress', 'high', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 5, 2, (now() + interval '2 days')::date, now() - interval '10 days', now() - interval '1 day'),
  ('10000000-0000-0000-0000-000000000027', 'b0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000004', 'MOB-3', 'Integração de notificações push', 'Integrar Firebase Cloud Messaging para notificações push.', 'task', 'todo', 'medium', 'a0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 8, 3, (now() + interval '4 days')::date, now() - interval '8 days', now() - interval '8 days'),
  ('10000000-0000-0000-0000-000000000028', 'b0000000-0000-0000-0000-000000000002', NULL, 'MOB-4', 'Suporte a modo offline', 'Armazenar dados localmente e sincronizar quando estiver online.', 'story', 'todo', 'low', NULL, 'a0000000-0000-0000-0000-000000000003', 13, 4, NULL, now() - interval '5 days', now() - interval '5 days')
ON CONFLICT (id) DO NOTHING;

-- ── Associações Issue-Etiqueta ──
INSERT INTO issue_labels (issue_id, label_id) VALUES
  ('10000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000013', 'f0000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000016', 'f0000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000006', 'f0000000-0000-0000-0000-000000000002'),
  ('10000000-0000-0000-0000-000000000007', 'f0000000-0000-0000-0000-000000000002'),
  ('10000000-0000-0000-0000-000000000010', 'f0000000-0000-0000-0000-000000000002'),
  ('10000000-0000-0000-0000-000000000021', 'f0000000-0000-0000-0000-000000000003'),
  ('10000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000004'),
  ('10000000-0000-0000-0000-000000000024', 'f0000000-0000-0000-0000-000000000005'),
  ('10000000-0000-0000-0000-000000000020', 'f0000000-0000-0000-0000-000000000005'),
  ('10000000-0000-0000-0000-000000000012', 'f0000000-0000-0000-0000-000000000006'),
  ('10000000-0000-0000-0000-000000000025', 'f0000000-0000-0000-0000-000000000007'),
  ('10000000-0000-0000-0000-000000000027', 'f0000000-0000-0000-0000-000000000008')
ON CONFLICT (issue_id, label_id) DO NOTHING;

-- ── Comentários ──
INSERT INTO comments (id, issue_id, author_id, body, created_at, updated_at) VALUES
  ('11000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Encontrei o problema — a configuração de proxy do Vite estava faltando. Corrigido adicionando a entrada no proxy.', now() - interval '24 days', now() - interval '24 days'),
  ('11000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'Boa! Agora funciona perfeitamente.', now() - interval '23 days', now() - interval '23 days'),
  ('11000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000003', 'Comecei a trabalhar nisso. A edição inline está quase pronta, preciso conectar os campos da barra lateral.', now() - interval '3 days', now() - interval '3 days'),
  ('11000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'Certifique-se de que os dropdowns também chamam o callback onUpdate.', now() - interval '2 days', now() - interval '2 days'),
  ('11000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000004', 'Isso é crítico — usuários ficam presos em uma tela branca depois que a sessão expira.', now() - interval '4 days', now() - interval '4 days'),
  ('11000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000001', 'Estou trabalhando nisso. Adicionando lógica de recuperação de sessão e correção no Vite config para imports do lucide-react.', now() - interval '3 days', now() - interval '2 days'),
  ('11000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000004', 'Os timestamps relativos ficaram ótimos. Gostei do indicador (editado) também.', now() - interval '6 days', now() - interval '6 days'),
  ('11000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000002', 'Drag and drop está funcionando bem nos meus testes. Só preciso corrigir um flicker no re-render.', now() - interval '1 day', now() - interval '1 day'),
  ('11000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000003', 'O grid mensal está renderizando corretamente. Preciso tratar o clique no painel de detalhes do dia.', now(), now() - interval '1 hour')
ON CONFLICT (id) DO NOTHING;

-- ── Notificações ──
INSERT INTO notifications (id, user_id, type, issue_id, actor_id, payload, read_at, created_at) VALUES
  ('12000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'issue_assigned', '10000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', '{"issue_title":"Modal de detalhes da issue com edição","issue_key":"RIJ-8"}', NULL, now() - interval '2 days'),
  ('12000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', 'issue_assigned', '10000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000002', '{"issue_title":"Visualização em calendário","issue_key":"RIJ-11"}', now() - interval '1 day', now() - interval '3 days'),
  ('12000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004', 'issue_assigned', '10000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000001', '{"issue_title":"Tela branca com sessão expirada","issue_key":"RIJ-16"}', NULL, now() - interval '4 days')
ON CONFLICT (id) DO NOTHING;

-- ── Resumo ──
-- 5 usuários (admin@admin.com / admin123, alice/bob/carol/dave@demo.com / demo123)
-- 2 projetos com membros
-- 4 sprints (1 concluída, 2 ativas, 1 planejada)
-- 4 colunas kanban padrão + 1 personalizada por projeto
-- 8 etiquetas nos projetos
-- 28 issues com status, tipos, prioridades e responsáveis variados
-- 13 associações issue-etiqueta
-- 9 comentários
-- 3 notificações (2 não lidas)
-- Dados demo completos para todas as funcionalidades
