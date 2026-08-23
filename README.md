# POC Trading Platform

A proof-of-concept trading blotter: a NestJS/Prisma/PostgreSQL backend that persists trades and broadcasts updates in real time over Socket.IO, with a React/Vite frontend for viewing and managing them.

---

## Architecture decisions

Target Stack

- Frontend: React, Vite
  - Styling/Theme: Shadcn, TailwindCSS
  - Routing: React-router-dom
  - Server State/Data Fetching: TanStack Query
  - Table: ag-grid-community, ag-grid-react
- Backend: NestJS
- DB: Prisma, PostgreSQL
- Real-time Communication: Socket.IO
- Infrastructure: Docker, Github Actions, AWS

**Trade broadcast flow**

```mermaid
sequenceDiagram
participant FE as Frontend (HTTP)
participant TC as TradesController
participant TS as TradesService
participant DB as Prisma / Postgres
participant EE as EventEmitter2
participant GW as TradesGateway
participant WS as Connected clients (Socket.IO)

    FE->>TC: POST /trades
    TC->>TS: createTrade(userID, dto)
    TS->>DB: prisma.trade.create()
    DB-->>TS: Trade
    TS->>EE: emit('trade.created', { trade })
    TS-->>TC: Trade
    TC-->>FE: 201 Trade
    EE->>GW: @OnEvent('trade.created')
    GW->>WS: to('blotter').emit('tradeUpdate', { type, trade })
    GW->>WS: to('symbol:<SYMBOL>').emit('tradeUpdate', { type, trade })

```

**WS connection & auth**

```mermaid
sequenceDiagram
participant C as Client
participant GW as TradesGateway
participant Guard as WsJwtGuard
participant U as UsersService

    C->>GW: connect (handshake.auth.token / Authorization header)
    GW->>Guard: authenticate(client)
    Guard->>Guard: jwtService.verify(token)
    Guard->>U: findById(payload.sub)
    U-->>Guard: User
    Guard-->>GW: User
    GW->>GW: client.data.user = user
    GW->>GW: client.join('blotter')
    GW-->>C: connected

    Note over C,GW: On auth failure
    Guard-->>GW: throws UnauthorizedException
    GW->>C: emit('exception', { message })
    GW->>C: disconnect(true)

```

**Why Socket.IO over SSE**: trade updates are inherently one-directional (server push), so SSE would have sufficed. Socket.IO was chosen to support genuine bidirectional interaction — client-initiated symbol subscriptions — and because it better reflects the real-time patterns (rooms, ack-based events, reconnection) used in production trading systems.

## Prerequisites

- Docker & Docker Compose
- Node.js (for running Prisma migrations/seed locally, outside the container)

## Installation instructions

1. Clone the repo.
2. Create the env files from the provided examples and fill in the values:

   ```
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

   - `backend/.env` — `DATABASE_URL` (see connection string below), `JWT_SECRET`, `JWT_EXPIRES_IN`, `WS_CORS_ORIGIN`, `CORS_ORIGIN`.
   - `frontend/.env` — `VITE_API_URL` (e.g. `http://localhost:3000/api/v1`), `VITE_WS_URL` (e.g. `http://localhost:3000/trades`).

3. Continue with **How to run the application** below.

## How to run the application

1. `docker compose up`

```
Frontend: http://localhost:5173/
API: http://localhost:3000/api/v1
Docs: `http://localhost:3000/api/v1/docs`
```

2. Continue with Seed data

### Seed data

Populates the database with 8 test users and ~500 randomized trades for local development/testing of the blotter.

- Run inside container: `docker compose exec backend npm run db:seed`
- Local: `cd backend && DATABASE_URL="postgresql://username:password@localhost:port/db_name?schema=public" npx prisma db seed`

Safe to re-run — user records are upserted and seeded trades are cleared and reinserted each time, without touching any other data in the database.

**Test login:** `trader1@seed.local` … `trader8@seed.local`, password `Password123!` for all.

### Manual migrations

- Bring the stack up: `docker compose up`

- If sync is disabled `docker compose up -d --build backend`

- Create/apply a migration after editing `schema.prisma` — run this **locally**, not inside the container, so migration files land in the repo:

```
cd backend
DATABASE_URL="postgresql://username:password@localhost:5433/trading-platform-db?schema=public" npx prisma migrate dev --name <change-name>
```

Regenerate the client after a schema change (also done automatically by `migrate dev`):

- Run inside container: `docker compose exec backend npx prisma generate`
- Local: `npx prisma generate`

- Inspect data: `docker compose exec backend npx prisma studio --port 5555 --browser none`
- Format: `npx prisma format`

---

## How to run tests

Backend (from `backend/`):

```bash
# unit tests
npm run test

# unit tests, watch mode
npm run test:watch

# e2e tests
npm run test:e2e

# coverage
npm run test:cov
```

Or inside the running container: `docker compose exec backend npm run test`.

## Real-time trade updates (WebSocket)

**Connect**

- Namespace: `ws://localhost:3000/trades`
- Auth: pass the same JWT issued by `POST /api/v1/auth/login` as `auth: { token: '<jwt>' }` in the Socket.IO handshake (Header Tab in Postman) (or an `Authorization: Bearer <jwt>` header). Missing/invalid tokens get an `exception` event and an immediate disconnect.

**Server → client events**

- `tradeUpdate` (Events Tab in Postman) — a full `Trade` entity, emitted whenever a trade is created, updated, or cancelled. Broadcast to every connected client (`blotter` room) and additionally to anyone subscribed to that trade's `symbol` room.

**Client → server events**

- `subscribeToSymbol` — `{ symbol: string }`. Joins `symbol:<SYMBOL>`, a filtered view of the same blotter feed scoped to one instrument (e.g. a single-symbol trading screen).
- `unsubscribeFromSymbol` — `{ symbol: string }`. Leaves that room.

**Example client**

```js
import { io } from "socket.io-client";

const socket = io("http://localhost:3000/trades", {
  auth: { token: jwt },
});

socket.on("tradeUpdate", (trade) => console.log(trade));
socket.emit("subscribeToSymbol", { symbol: "AAPL" });
```

## Assumptions made

- A single logged-in user represents one "trader" seat; there's no concept of teams, desks, or per-user permissions beyond authentication.
- The blotter is the primary view: all connected clients see all trades by default (`blotter` room), with per-symbol filtering as an opt-in narrower feed rather than the default.
- Local development runs entirely through Docker Compose; direct host installation of Postgres isn't a supported path.
- Seed data (8 users, ~500 trades) is sufficient to exercise the blotter's filtering/sorting/real-time behavior without needing production-scale volume.

## Trade-offs accepted

- **Socket.IO over plain WebSocket/SSE**: heavier client/server dependency than raw `ws`, chosen for built-in rooms, reconnection, and ack support (see rationale above) rather than minimal footprint.
- **Prisma migrations run locally, not in-container**: keeps migration files versioned in the repo and avoids container-only state, at the cost of requiring Node/Prisma installed on the host for schema changes.
- **Seed script clears and reinserts trades on every run**: simplest way to get a consistent, re-runnable dev dataset, at the cost of not preserving manually-created trades across reseeds.
- **No refresh token rotation or server-side session invalidation**: auth is stateless JWT — a token stays valid until it expires and there's no server-side way to revoke it early. Expiry/invalidation is instead handled client-side: `AuthContext` fetches `GET /user/me` whenever a token is present to validate it, and a centralized `401` interceptor in the API client (`onUnauthorized` in `client.ts`) triggers logout on any unauthorized response. That covers "detect and kick out on an invalid/expired token," but not rotation, forced logout from the server, or an idle/inactivity timeout distinct from the JWT's own expiry — those would require a session/refresh-token table, giving up pure statelessness in exchange for revocability.
- **Some frontend components built ad hoc rather than fully reusable**: e.g. the AG Grid table setup is specific to the blotter's columns/behavior rather than factored into a generic, reusable `AgGridTable` component — acceptable for a single-screen POC, but would need generalizing (configurable columns, sorting, row actions) to support additional grid views.
