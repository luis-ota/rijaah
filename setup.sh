#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${GREEN}[rijaah]${NC} $*"; }
warn() { echo -e "${YELLOW}[rijaah]${NC} $*"; }
err() { echo -e "${RED}[rijaah]${NC} $*" >&2; }

echo ""
echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     Rijaah — Fresh Setup Script      ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
echo ""

# ── 0. Prerequisites ──
log "Checking prerequisites..."

for cmd in docker node npm; do
  if ! command -v "$cmd" &>/dev/null; then
    err "'$cmd' is required but not installed."
    exit 1
  fi
done
log "All prerequisites met"

# ── 1. Remove existing container (fresh start) ──
log "Removing any existing Rijaah containers..."
if docker ps -a --format '{{.Names}}' | grep -q '^rijaah-postgres$'; then
  docker stop rijaah-postgres 2>/dev/null || true
  docker rm rijaah-postgres 2>/dev/null || true
  log "Existing container removed"
else
  warn "No existing container found (clean start)"
fi

# ── 2. Stop any leftover processes ──
log "Stopping any leftover processes..."
pkill -f "node server/index.js" 2>/dev/null || true
pkill -f "node_modules/.bin/vite" 2>/dev/null || true
sleep 1

# ── 3. Create Postgres container ──
log "Creating Postgres container..."
docker run -d \
  --name rijaah-postgres \
  --network host \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=rijaah \
  -e PGDATA=/var/lib/postgresql/data \
  postgres:16-alpine

log "Waiting for Postgres to be ready..."
for i in $(seq 1 30); do
  if docker exec rijaah-postgres pg_isready > /dev/null 2>&1; then
    log "Postgres is ready"
    break
  fi
  if [ "$i" -eq 30 ]; then
    err "Postgres did not become ready in 30 seconds"
    exit 1
  fi
  sleep 1
done

# ── 4. Run migrations + seeder ──
log "Running schema migrations..."
for migration in server/migrations/*.sql; do
  if [ -f "$migration" ]; then
    log "  Applying $(basename "$migration")..."
    docker exec -i rijaah-postgres psql -U postgres -d rijaah < "$migration" 2>/dev/null || warn "  $(basename "$migration") had warnings (may already be applied)"
  fi
done

log "Running seed data..."
for seed in server/seed/*.sql; do
  if [ -f "$seed" ]; then
    log "  Applying $(basename "$seed")..."
    docker exec -i rijaah-postgres psql -U postgres -d rijaah < "$seed" 2>/dev/null || warn "  $(basename "$seed") had warnings (may already be applied)"
  fi
done

# ── 5. Install deps ──
log "Installing root dependencies..."
npm install --prefix "$ROOT_DIR" > /dev/null 2>&1

log "Installing server dependencies..."
(cd "$ROOT_DIR/server" && npm install > /dev/null 2>&1) || true

# ── 6. Clear Vite cache ──
log "Clearing Vite dependency cache..."
rm -rf "$ROOT_DIR/node_modules/.vite"

# ── 7. Start API server ──
log "Starting API server on port 3001..."
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rijaah" \
nohup node server/index.js > "$ROOT_DIR/server.log" 2>&1 &
API_PID=$!

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

# ── 8. Start Vite dev server ──
log "Starting Vite dev server on port 5173..."
nohup npx vite > "$ROOT_DIR/vite.log" 2>&1 &
VITE_PID=$!

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
echo -e " ${GREEN}✓ All services are running!${NC}"
echo ""
echo -e "  ${CYAN}Frontend:${NC}  http://localhost:5173"
echo -e "  ${CYAN}API:${NC}       http://localhost:3001/health"
echo -e "  ${CYAN}Postgres:${NC}  localhost:5432 (docker: rijaah-postgres)"
echo ""
echo -e "  ${YELLOW}Demo accounts:${NC}"
echo -e "    admin@admin.com / admin123"
echo -e "    alice@demo.com  / demo123"
echo -e "    bob@demo.com    / demo123"
echo -e "    carol@demo.com  / demo123"
echo -e "    dave@demo.com   / demo123"
echo ""
echo -e "  ${YELLOW}Logs:${NC}    tail -f server.log | tail -f vite.log"
echo -e "  ${YELLOW}Stop:${NC}    pkill -f 'node server/index.js'; pkill -f vite; docker stop rijaah-postgres"
echo -e "  ${YELLOW}Restart:${NC} bash restart.sh"
echo ""
