# Carcas Counter

Web app for counting carcass contaminants (hair, grease, clots, etc.) by zone and batch number. Built for use on the production floor — multiple devices can work on the same batch, with the table syncing in real time.

## Requirements

- Node.js 20+
- MySQL database with a `maintable` table
- npm

## Quick start

```bash
npm install
cp .env.example .env   # fill in values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy `.env.example` to `.env` and set:

| Variable      | Description                |
|---------------|----------------------------|
| `HOSTNAME`    | Server hostname (`localhost`) |
| `PORT`        | Port (e.g. `3000`)         |
| `APP_ORIGIN`  | Optional. Browser origin allowed for Socket.IO. Defaults to `http://HOSTNAME:PORT`. Set to the URL users open in the browser when deploying on a LAN IP (e.g. `http://192.168.1.50:3000`). |
| `DB_HOST`     | MySQL host                 |
| `DB_USER`     | MySQL user                 |
| `DB_PASSWORD` | MySQL password             |
| `DB_NAME`     | Database name              |

## npm scripts

| Command         | Description                                           |
|-----------------|-------------------------------------------------------|
| `npm run dev`   | Development server (`server.ts` + Next.js HMR)        |
| `npm run build` | Next.js production build + TypeScript server build    |
| `npm run start` | Production server (`dist_server/server.js`)           |
| `npm run lint`  | ESLint                                                |

For production, run `npm run build` then `npm run start` — not `next start`, because the app uses a custom Node server with Socket.IO.

## Routes

| Path            | Purpose |
|-----------------|---------|
| `/`             | Main workspace — batch selection, carcass diagram, counter table |
| `/history`      | Browse past batches by date and batch number |
| `/report/[id]`  | Read-only view of a batch's historical data |

On the main view, the selected batch is reflected in the URL: `/?batch=123456`.

## Project structure

```
src/
├── app/
│   ├── HomeView.tsx              # Main counting UI
│   ├── history/HistoryView.tsx   # History list and filters
│   ├── report/[id]/view.tsx      # Historical report (read-only)
│   └── _components/
│       └── SelectBatchPopup/     # Batch select / create
├── actions/batch-actions.ts      # Server Actions — DB operations
├── components/
│   ├── Carcas/                   # Interactive carcass diagram (SVG)
│   ├── Table/                    # Contaminant grid by zone
│   └── InternalNavigationTracker/ # Custom in-app back navigation
├── data/
│   ├── carcas-zone-data.ts       # Zone SVG paths and layout config
│   ├── contaminants.ts           # Contaminant column definitions
│   └── zone-display-names.ts     # Zone labels (A — Shin, etc.)
├── db/queries.ts                 # SQL queries
├── lib/db.ts                     # MySQL connection pool
└── types/interfaces.ts           # Shared TypeScript types
server.ts                         # Custom HTTP server + Socket.IO
```

---

## Architecture

### Stack

| Layer          | Technology |
|----------------|------------|
| UI             | Next.js 16 (App Router), React 19, Tailwind CSS 4, SCSS modules |
| Server logic   | Next.js Server Actions (`"use server"`) |
| Client state   | TanStack React Query (cache, optimistic updates) |
| Real-time      | Socket.IO (server + client) |
| Database       | MySQL (`mysql2`) — single `maintable` |
| Server         | Custom Node.js HTTP server (`server.ts`) |

### Custom server

Standard `next start` does not include Socket.IO. `server.ts` runs the Next.js request handler and the WebSocket server in one HTTP process. Both development and production use the same entry point (`npm run dev` / `npm run start`).

### Counter update flow

```
User clicks a cell in the table
        ↓
HomeView → useMutation → updateCounterAction (Server Action)
        ↓
MySQL UPDATE on maintable
        ↓
React Query optimistically updates the cache
        ↓
Socket emit: update_data { batchId }
        ↓
Other clients on the same batch receive refresh_table → invalidateQueries
```

Optimistic updates keep the UI responsive; Socket.IO keeps other open devices in sync.

### Socket.IO events

| Direction          | Event           | Purpose |
|--------------------|-----------------|---------|
| Client → Server    | `join_batch`    | Join a batch room when a batch is selected |
| Client → Server    | `update_data`   | Notify that data changed |
| Server → Client    | `refresh_table` | Tell other clients to reload table data |

Types live in `src/types/interfaces.ts` (`ClientToServerEvents`, `ServerToClientEvents`).

### Data layer

All persistence goes through `src/actions/batch-actions.ts` using SQL from `src/db/queries.ts`. The database is a single `maintable` — one row per batch, date, and zone, with a column per contaminant type.

### Carcass diagram and zones

- **`Carcas`** — interactive SVG split into FQ (Fore quarter) and HQ (Hind quarter). Clicking a zone highlights the matching column in the table.
- **`Table`** — grid with zones as columns and contaminant types as rows (`contaminants.ts`). Missing zones show a placeholder row (`id < 0`).
- Zone geometry and labels — `src/data/carcas-zone-data.ts` (generated from SVG assets in `public/svg/carcas-original/`).
- Display names — `src/data/zone-display-names.ts`.

### Navigation

`InternalNavigationTracker` keeps an in-app navigation stack in `sessionStorage`, so Back buttons on `/history` and `/report` return to the previous in-app view rather than relying on browser history alone.

### Code organization

Larger components and modules use `// MARK:` comments (visible in the editor minimap) to separate logic, data fetching, and HTML sections.
