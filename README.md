# POC Trading Platform

---

## Developer workflow

### Manual migrations

- Bring the stack up: `docker compose up`

- If sync is disabled `docker compose up -d --build backend`

- Create/apply a migration after editing `schema.prisma` — run this **locally**, not inside the container, so migration files land in the repo:

```
cd backend
DATABASE_URL="postgresql://username:password@localhost:5433/trading-platform-db?schema=public" npx prisma migrate dev --name <change-name>
```

- Regenerate the client after a schema change (also done automatically by `migrate dev`): `docker compose exec backend npx prisma generate`

`npx prisma generate`

- Inspect data: `docker compose exec backend npx prisma studio --port 5555 --browser none`

---
