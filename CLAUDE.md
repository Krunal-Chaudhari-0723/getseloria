# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server with Turbopack on http://localhost:3000
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # ESLint
node reset-admin.js  # Reset admin credentials to admin@gmail.com / 02230223
```

## Architecture

**Stack:** Next.js 14 App Router · TypeScript · MongoDB/Mongoose · Tailwind CSS · JWT auth (httpOnly cookie) · Razorpay payments

### Route structure

```
app/
  page.tsx                  # Home/storefront
  layout.tsx                # Root layout — mounts <Navbar> globally
  auth/login|register/      # Public auth pages
  products/                 # Public product listing + [id] detail
  cart/ checkout/ orders/   # User-facing shopping flow
  admin/                    # Admin panel (layout has its own sidebar, NO root Navbar)
    dashboard/ products/ orders/ users/ settings/
  api/
    auth/login|register|me  # Auth endpoints
    products/               # Public product API
    cart/ orders/ payment/  # User shopping API
    admin/                  # Admin-only API (all guarded by adminMiddleware)
      stats/ products/[id]/ orders/[id]/ users/ profile/
    setup/                  # GET → force-reset admin@gmail.com account
```

### Auth flow

- Login → `POST /api/auth/login` → sets `token` httpOnly cookie (7 days, JWT)
- JWT contains `{ userId, email, role }` — role is either `'user'` or `'admin'`
- `lib/auth.ts` exports `authMiddleware` and `adminMiddleware` (Node.js runtime only — use in API routes, NOT in `middleware.ts`)
- `middleware.ts` (Edge Runtime) decodes JWT with plain `atob()` base64 — **never import `jsonwebtoken` there**, it crashes the Edge Runtime
- Admin pages are protected at the route level by `middleware.ts` and at the API level by `adminMiddleware`

### Database

- `lib/db.ts` — Mongoose singleton with connection caching via `global.mongoose`. Also runs `seedAdmin()` on first connect, which upserts `admin@gmail.com` with bcrypt-hashed password.
- Models: `lib/models/User.ts` · `lib/models/Product.ts` · `lib/models/Order.ts` · `lib/models/Cart.ts`
- `.env.local` required: `MONGODB_URI`, `JWT_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`

### Key patterns

- All API routes start with `export const dynamic = 'force-dynamic'` to opt out of static caching
- New admin page/API files require a **full server restart** (`Ctrl+C` + `npm run dev`) to be picked up — hot-reload only works for existing files
- `next.config.js` has `images.remotePatterns` set to allow all `http`/`https` image sources (product images come from external URLs stored in MongoDB)
- `instrumentation.ts` exists but is unreliable for seeding — use `reset-admin.js` or the `seedAdmin` in `lib/db.ts` instead

### Admin credentials

Default: `admin@gmail.com` / `02230223`  
Change via: `/admin/settings` (requires current password)  
Reset via: `node reset-admin.js` (direct MongoDB write, bypasses app)
