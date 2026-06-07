#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

# ── Colors ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[rijaah]${NC} $*"; }
warn() { echo -e "${YELLOW}[rijaah]${NC} $*"; }
err()  { echo -e "${RED}[rijaah]${NC} $*" >&2; }

# ── 1. Stop existing processes ──
log "Stopping existing services..."

# Kill API server
if pgrep -f "node server/index.js" > /dev/null 2>&1; then
  pkill -f "node server/index.js" 2>/dev/null || true
  sleep 1
  if pgrep -f "node server/index.js" > /dev/null 2>&1; then
    pkill -9 -f "node server/index.js" 2>/dev/null || true
  fi
  log "API server stopped"
else
  warn "API server not running"
fi

# Kill Vite dev server
if pgrep -f "node_modules/.bin/vite" > /dev/null 2>&1; then
  pkill -f "node_modules/.bin/vite" 2>/dev/null || true
  sleep 1
  if pgrep -f "node_modules/.bin/vite" > /dev/null 2>&1; then
    pkill -9 -f "node_modules/.bin/vite" 2>/dev/null || true
  fi
  log "Vite dev server stopped"
else
  warn "Vite dev server not running"
fi

# ── 2. Postgres Docker container ──
log "Checking Postgres..."
if docker ps --format '{{.Names}}' | grep -q '^rijaah-postgres$'; then
  log "Postgres container already running"
else
  if docker ps -a --format '{{.Names}}' | grep -q '^rijaah-postgres$'; then
    log "Starting existing Postgres container..."
    docker start rijaah-postgres
  else
    log "Creating Postgres container..."
    docker run -d \
      --name rijaah-postgres \
      --network host \
      -e POSTGRES_USER=postgres \
      -e POSTGRES_PASSWORD=postgres \
      -e POSTGRES_DB=rijaah \
      -e PGDATA=/var/lib/postgresql/data \
      postgres:16-alpine
  fi
  sleep 2
fi

# Wait for Postgres to accept connections
log "Waiting for Postgres to be ready..."
for i in $(seq 1 15); do
  if docker exec rijaah-postgres pg_isready > /dev/null 2>&1; then
    log "Postgres is ready"
    break
  fi
  if [ "$i" -eq 15 ]; then
    err "Postgres did not become ready in time"
    exit 1
  fi
  sleep 1
done

# ── 3. Run migrations ──
log "Running schema migrations..."
for migration in server/migrations/*.sql; do
  if [ -f "$migration" ]; then
    log "  Applying $(basename "$migration")..."
    docker exec -i rijaah-postgres psql -U postgres -d rijaah < "$migration" 2>/dev/null || warn "  $(basename "$migration") had warnings (may already be applied)"
  fi
done

# Run seeder (idempotent — uses ON CONFLICT DO NOTHING)
log "Running seed data..."
for seed in server/seed/*.sql; do
  if [ -f "$seed" ]; then
    log "  Applying $(basename "$seed")..."
    docker exec -i rijaah-postgres psql -U postgres -d rijaah < "$seed" 2>/dev/null || warn "  $(basename "$seed") had warnings (may already be applied)"
  fi
done

# ── 4. Clear Vite cache ──
log "Clearing Vite dependency cache..."
rm -rf "$ROOT_DIR/node_modules/.vite"

# ── 5. Install deps ──
log "Installing dependencies..."
bun install --cwd "$ROOT_DIR" > /dev/null 2>&1 || npm install --prefix "$ROOT_DIR" > /dev/null 2>&1
(cd "$ROOT_DIR/server" && npm install > /dev/null 2>&1) || true

# ── 6. Start API server ──
log "Starting API server on port 3001..."
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rijaah" \
  nohup node server/index.js > "$ROOT_DIR/server.log" 2>&1 &
API_PID=$!

# Wait for API to be ready
for i in $(seq 1 15); do
  if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    log "API server ready (PID $API_PID)"
    break
  fi
  if [ "$i" -eq 15 ]; then
    err "API server did not start. Check server.log"
    cat "$ROOT_DIR/server.log"
    exit 1
  fi
  sleep 1
done

# ── 7. Start Vite dev server ──
log "Starting Vite dev server on port 5173..."
nohup npx vite > "$ROOT_DIR/vite.log" 2>&1 &
VITE_PID=$!

# Wait for Vite to be ready
for i in $(seq 1 15); do
  if curl -s http://localhost:5173/ > /dev/null 2>&1; then
    log "Vite dev server ready (PID $VITE_PID)"
    break
  fi
  if [ "$i" -eq 15 ]; then
    err "Vite dev server did not start. Check vite.log"
    cat "$ROOT_DIR/vite.log"
    exit 1
  fi
  sleep 1
done

# ── Done ──
echo ""
log "All services are running!"
echo ""
echo -e "  ${GREEN}API:${NC}       http://localhost:3001/health"
echo -e "  ${GREEN}Frontend:${NC}  http://localhost:5173"
echo -e "  ${GREEN}Postgres:${NC}  localhost:5432 (docker: rijaah-postgres)"
echo ""
echo -e "  ${YELLOW}Logs:${NC}      tail -f server.log | tail -f vite.log"
echo -e "  ${YELLOW}Stop all:${NC}   pkill -f 'node server/index.js'; pkill -f vite; docker stop rijaah-postgres"
echo ""
