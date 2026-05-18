# Rijaah

Project management and issue tracking tool.

## Prerequisites

- [Bun](https://bun.sh/) installed globally
- A Supabase project (URL and anon key)

## Getting Started

### 1. Install Bun

```bash
curl -fsSL https://bun.sh/install | bash
```

### 2. Install dependencies

```bash
bun install
```

### 3. Configure environment variables

Create a `.env` file in the project root with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run the development server

```bash
bun run dev
```

The app will be available at `http://localhost:5173`.

### 5. Build for production

```bash
bun run build
```

### 6. Preview the production build

```bash
bun run preview
```

## Default Login

- **Email:** admin@admin.com
- **Password:** admin123

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- Supabase (Auth, Database, RLS)
- Lucide React (icons)
