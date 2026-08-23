# POC Trading Platform

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

## Installation instructions

## How to run the application

1. `docker  compose up`

```
Frontend: http://localhost:5173/
API: http://localhost:3000/api/v1
Docs: `http://localhost:3000/api/v1/docs`
```

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

### Seed data

Populates the database with 8 test users and ~500 randomized trades for local development/testing of the blotter.

- Run inside container: `docker compose exec backend npm run db:seed`
- Local: `cd backend && DATABASE_URL="postgresql://postgres:postgres@localhost:5433/trading-platform-db?schema=public" npx prisma db seed`

Safe to re-run — user records are upserted and seeded trades are cleared and reinserted each time, without touching any other data in the database.

**Test login:** `trader1@seed.local` … `trader8@seed.local`, password `Password123!` for all.

---

## How to run tests

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

## Trade-offs accepted
