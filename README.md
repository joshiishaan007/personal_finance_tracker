# FinBuddy 💜

Your lifetime personal finance companion — built to be used daily for 30+ years.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, TailwindCSS, Recharts, TanStack Query |
| Backend | Node.js 20, Express, TypeScript, Mongoose |
| Database | MongoDB Atlas Free Tier (M0, 512 MB) |
| Auth | Google OAuth 2.0 via Passport.js, JWT in httpOnly cookie |
| AI | Google Gemini gemini-1.5-flash (free tier) |
| Hosting | Vercel (client) + Render Free (server) + MongoDB Atlas |

## Setup

### Prerequisites
- Node.js 20 LTS
- pnpm 9+
- MongoDB Atlas account (free)
- Google Cloud Console project with OAuth 2.0 credentials
- Google AI Studio API key (Gemini)

### Installation

```bash
# Install dependencies
pnpm install

# Build shared package
pnpm --filter shared build

# Copy env files
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### Environment Variables

**server/.env**

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | 64-char random secret for JWT signing |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `CLIENT_URL` | Frontend URL (e.g., http://localhost:5173) |
| `SERVER_URL` | Backend URL (e.g., http://localhost:5000) |
| `GEMINI_API_KEY` | Google Gemini API key |

**client/.env**

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend URL (leave empty in production with proxy) |

### Development

```bash
pnpm dev
```

Opens:
- Client: http://localhost:5173
- Server: http://localhost:5000

### Testing

```bash
pnpm test
```

Server tests cover:
- `money.test.ts`: 100% coverage on `toMinorUnits` / `formatAmount`
- `recurring.test.ts`: idempotency of due-date generation

### Production Build

```bash
pnpm build
```

## Free-Tier Deployment

### 1. MongoDB Atlas
1. Create free M0 cluster
2. Create database user
3. Whitelist all IPs (0.0.0.0/0) for Render compatibility
4. Copy connection string to `MONGODB_URI`

### 2. Render (Backend)
1. Connect GitHub repo
2. New Web Service → use `render.yaml`
3. Add all env vars from server/.env
4. Deploy

### 3. Vercel (Frontend)
1. Connect GitHub repo
2. Framework: Vite
3. Build: `pnpm --filter shared build && pnpm --filter client build`
4. Output: `client/dist`
5. Add `VITE_API_URL` pointing to your Render URL
6. Deploy

### 4. Google OAuth Setup
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: `https://your-render-url.onrender.com/api/auth/google/callback`
4. Copy Client ID and Secret to server env vars

## Backup & Restore

### Export (monthly recommended)
Profile page → Export JSON → Save to local drive / cloud storage

### Restore
Currently manual: re-import transactions via CSV import feature.
Full restore from JSON backup coming in Phase 2.

## Data Design

- **Money**: stored as integers in smallest unit (paise for INR, cents for USD)
- **Currency**: set once during onboarding, immutable after first transaction
- **Timezone**: stored per-user (IANA), used for "this month" calculations
- **Schema versioning**: every document has `schemaVersion: number`
- **Migrations**: run `pnpm --filter server migrate` to apply pending migrations

## Operational Notes (30-year perspective)

1. **Monthly backups**: Export JSON from Profile page, store in 2+ locations
2. **Database**: MongoDB Atlas M0 is free forever — no credit card expiry risk
3. **Dependencies**: Pinned major versions. Run `pnpm update` annually.
4. **Schema migrations**: Add new migrations to `server/src/migrations/` before deploying schema changes
5. **AI quota**: Gemini free tier — if quota fills, AI card hides silently, all other features work
6. **JWT secret rotation**: If you rotate `JWT_SECRET`, all sessions are invalidated (users re-login)
7. **Google OAuth**: Keep OAuth app in "Testing" mode or publish — publishing requires Google verification

## Architecture Decisions

See `/docs/` for Architecture Decision Records:
- [ADR-001: Integer money storage](docs/ADR-001-integer-money.md)
- [ADR-002: Gemini silent degradation](docs/ADR-002-gemini-degradation.md)

## License

MIT — Personal use. Built with ❤️ for a lifetime of financial clarity.
