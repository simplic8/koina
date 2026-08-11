# KOINA

Shared spaces. Shared interests. Shared purpose.

**Stack:** Next.js (App Router) · Supabase (dedicated KOINA project)  
**Template:** forked from [JustVibing](https://justvibing.fun) UI/format  
**Brand content:** [KOINA Canva deck](https://canva.link/61f5eg35fc9fx06)

KOINA (from Ancient Greek κοινά — common / shared) is an open commons where people gather around shared spaces, interests, and purpose. The site is the hub for the ecosystem:

- **JustVibing** — gaming community
- **Oshikatsu** — fan / oshi space
- **NUMA** — immersive presence (coming soon)

## Setup

### 1. Install

```bash
npm install
cp .env.example .env.local
```

### 2. Supabase (separate project)

Use a **new** Supabase project for KOINA — do not reuse the JustVibing / Oshikatsu keys.

1. Create a project at [supabase.com](https://supabase.com)
2. Paste URL + anon key + service role key into `.env.local`
3. Run [`supabase/schema.sql`](supabase/schema.sql) once in the SQL editor (all migrations compiled into one file)
4. Auth → enable **Email**, **Google**, and **Discord** (optional)
5. Auth → URL Configuration:
   - **Site URL** = your production host (e.g. `https://koina.community`)
   - **Redirect URLs**: production + `http://localhost:3000/auth/callback`
6. Seeded admin (from `003_seed_default_admin.sql`): `admin@koina.community` / `Indigitous2026!` — change after first login

### 3. Resend (optional, registration emails)

1. Create an API key at [resend.com](https://resend.com)
2. Verify your sending domain
3. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in `.env.local`

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without Supabase env vars, the UI still renders from seed data.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |

## Notes

- Logo asset: `public/koina-logo.svg` (replaces the former PNG in header/hero)
- Landing copy (ethos, etymology, ecosystem) follows the Canva presentation
- Auth, profile, inbox, and admin remain available for the commons
- Games / sessions routes from the JustVibing template are still in the codebase but are not linked from the primary nav
