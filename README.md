# Carcas Counter

Web app for counting carcass contaminants (hair, grease, clots, etc.) by zone and batch number. Built for use on the production floor — multiple devices can work on the same batch, with the table syncing in real time.

## Requirements

- Node.js 20+
- Microsoft SQL Server (2019+ recommended; SQL Server Express works too)
- npm

## Quick start

```bash
npm install
cp .env.example .env   # fill in values (see Environment variables below)
# create the database + table — see "Database setup" below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database setup

The app expects a single database containing one table (`maintable`). A ready-to-run
script is provided at [`db/db.sql`](db/db.sql) so you don't have to create anything by hand.

Run it once, using either option:

- **SSMS / Azure Data Studio:** open `db/db.sql` and press **Execute**.
- **Command line (sqlcmd):** `sqlcmd -S localhost -U sa -P your_password -i db/db.sql`

The script creates the database `pickstock-carcas-counters` and the `maintable` table.
The database name must match `DB_NAME` in your `.env` — if you use a different name,
change it in both `db/db.sql` and `.env`.

## Environment variables

Copy `.env.example` to `.env` and set:

| Variable      | Description                |
|---------------|----------------------------|
| `HOSTNAME`    | Server hostname (`localhost`) |
| `PORT`        | Port (e.g. `3000`)         |
| `APP_ORIGIN`  | Optional. Browser origin allowed for Socket.IO. Defaults to `http://HOSTNAME:PORT`. Set to the URL users open in the browser when deploying on a LAN IP (e.g. `http://192.168.1.50:3000`). |
| `DB_HOST`     | SQL Server host            |
| `DB_PORT`     | SQL Server port (default `1433`) |
| `DB_USER`     | SQL Server login           |
| `DB_PASSWORD` | SQL Server password        |
| `DB_NAME`     | Database name              |
| `DB_ENCRYPT`  | Optional. `true` to encrypt the connection (e.g. Azure SQL). Defaults to `false`. |
| `DB_TRUST_SERVER_CERT` | Optional. `true` to trust a self-signed certificate (local/LAN). Defaults to `true`. |

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
| `/report/[id]`  | Read-only view of a batch's historical data. `[id]` is the batch number; the date is passed as a query param, e.g. `/report/123456?date=18/06/2026` |

On the main view, the selected batch is reflected in the URL: `/?batch=123456`.

## Project structure

```
src/
├── app/
│   ├── HomeView.tsx                 # Main counting UI
│   ├── history/HistoryView.tsx      # History list and filters
│   ├── report/[id]/
│   │   ├── view.tsx                 # Historical report (read-only)
│   │   └── _components/BatchTitle.tsx
│   └── _components/
│       └── SelectBatchPopup/        # Batch select / create
├── actions/batch-actions.ts         # Server Actions — DB operations
├── components/
│   ├── Carcas/                      # Interactive carcass diagram (SVG)
│   ├── Table/                       # Contaminant grid by zone
│   ├── Icon/                        # Inline-SVG icon renderer
│   ├── Spinner/                     # Loading spinner
│   └── InternalNavigationTracker/   # Custom in-app back navigation
├── data/
│   ├── carcas-zone-data.ts          # Zone SVG paths and layout config (fq/hq)
│   ├── contaminants.ts              # Contaminant column definitions
│   ├── icon-data.ts                 # Inline SVG strings used by Icon
│   └── zone-display-names.ts        # Zone labels (A - Shin, etc.) + FQ/HQ option labels
├── db/queries.ts                    # SQL queries
├── lib/db.ts                        # SQL Server connection pool
├── providers/ReactQueryProvider.tsx # TanStack Query client provider
└── types/interfaces.ts              # Shared TypeScript types
db/db.sql                            # One-time DB + maintable setup script
server.ts                            # Custom HTTP server + Socket.IO
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
| Database       | Microsoft SQL Server (`mssql`) — single `maintable` |
| Server         | Custom Node.js HTTP server (`server.ts`) |

### Custom server

Standard `next start` does not include Socket.IO. `server.ts` runs the Next.js request handler and the WebSocket server in one HTTP process. Both development and production use the same entry point (`npm run dev` / `npm run start`).

### Counter update flow

```
User clicks a cell in the table
        ↓
HomeView → useMutation → updateCounterAction (Server Action)
        ↓
SQL Server UPDATE on maintable
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

- **`Carcas`** — interactive SVG split into two parts. Clicking a zone highlights the matching column in the table.
- **Carcass parts:** the carcass is split into **FQ** (Fore quarter) and **HQ** (Hind quarter). The keys `fq` / `hq` (plus `whole`) are used consistently across the code (`CarcasPart` in `src/data/carcas-zone-data.ts`) and map to the UI button labels in `src/data/zone-display-names.ts` (`CARCAS_PART_SELECT_OPTIONS`).
- **`Table`** — grid with zones as columns and contaminant types as rows (`contaminants.ts`). Missing zones show a placeholder row (`id < 0`).
- Zone geometry and labels — `src/data/carcas-zone-data.ts` (generated from SVG assets in `public/svg/carcas-original/`).
- Display names — `src/data/zone-display-names.ts`.

### Navigation

`InternalNavigationTracker` keeps an in-app navigation stack in `sessionStorage`, so Back buttons on `/history` and `/report` return to the previous in-app view rather than relying on browser history alone.

### Code organization

Larger components and modules use `// MARK:` comments (visible in the editor minimap) to separate logic, data fetching, and HTML sections.
