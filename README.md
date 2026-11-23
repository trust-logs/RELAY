# RELAY

**Make it happen.**

RELAY is a global platform that helps people and businesses turn requests into coordinated, trackable real-world work. It connects customers, providers, and teams through projects, trusted profiles, and AI-assisted workflows.

## Product environments

- **RELAY LIFE** — errands and everyday assistance.
- **RELAY WORK** — business operations and project coordination.
- **RELAY NETWORK** — service providers and professionals.
- **RELAY TRUST & VERIFICATION** — identity, credentials, and reputation signals.

## Technology

- Next.js App Router + TypeScript
- Supabase Auth, PostgreSQL, Realtime, and Storage
- Server-side Supabase sessions with `@supabase/ssr`

## Getting started

1. Install Node.js 22 or newer.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env.local` and add the Supabase project URL and publishable key.
4. Start the development server with `npm run dev`.

Never commit `.env.local`, service-role keys, or Supabase secret keys. Only the publishable key belongs in `NEXT_PUBLIC_` variables.

## Status

Initial application foundation. Authentication, database schema, RLS policies, and product workflows are being implemented incrementally.
