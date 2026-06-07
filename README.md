# Rijaah

Project management and issue tracking tool (Jira clone) — React + Express + Postgres.

## Quick Start (Docker)

A forma mais rápida de rodar o projeto completo (banco, backend, frontend e seeder) é com Docker:

```bash
docker compose up -d --build
```

Depois de ~30 segundos, abra `http://localhost:5173` e faça login com:
- **Email:** `admin@admin.com`
- **Senha:** `admin123`

O compose inicia três serviços:
- `postgres` — banco de dados na porta 5432 (volume `pgdata` para persistência)
- `backend` — API Express na porta 3001 (executa migrations e seeder automaticamente na primeira vez)
- `frontend` — build estático do Vite servido via nginx na porta 5173 (faz proxy de `/api/*` para o backend)

Comandos úteis:
```bash
npm run docker:up      # build + start
npm run docker:down    # parar containers
npm run docker:logs    # ver logs
npm run docker:reset   # apagar tudo (incluindo dados) e recomeçar
```

## Desenvolvimento Local (sem Docker)

### Pré-requisitos
- [Bun](https://bun.sh/) ou Node.js 20+
- PostgreSQL 16+ rodando localmente

### 1. Instalar dependências
```bash
bun install
cd server && bun install && cd ..
```

### 2. Subir Postgres (opção via Docker)
```bash
docker run -d --name rijaah-postgres -p 5432:5432 \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=rijaah \
  postgres:16-alpine
```

### 3. Rodar backend (terminal 1)
```bash
cd server
node index.js
# banco é migrado e populado automaticamente na primeira vez
```

### 4. Rodar frontend (terminal 2)
```bash
bun run dev
```

Abre em `http://localhost:5173`.

## Logins Demo (após seeder)

| Email | Senha |
|-------|-------|
| `admin@admin.com` | `admin123` |
| `alice@demo.com` | `demo123` |
| `bob@demo.com` | `demo123` |
| `carol@demo.com` | `demo123` |
| `dave@demo.com` | `demo123` |

## Estrutura

```
.
├── docker-compose.yml      # orquestração dos 3 serviços
├── Dockerfile              # build do frontend (vite build + nginx)
├── nginx.conf              # proxy reverso /api → backend
├── server/
│   ├── Dockerfile          # build do backend (node alpine)
│   ├── index.js            # API Express
│   ├── migrations/         # schema SQL (executado na inicialização)
│   └── seed/               # dados demo PT-BR (executado se banco vazio)
├── src/                    # frontend React + Vite
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── lib/
│   └── types/
└── package.json
```

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, date-fns
- **Backend:** Node.js 20, Express, pg (Postgres driver)
- **Banco:** PostgreSQL 16
- **Servidor web:** nginx (produção via Docker)
