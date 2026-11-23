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
3. Copy `.env.example` to `.env.local`.
4. Start the development server with `npm run dev`.

Never commit `.env.local`, service-role keys, or Supabase secret keys. Only the publishable key belongs in `NEXT_PUBLIC_` variables.

## Current implementation

- Email/password registration and login with Supabase Auth.
- Email confirmation callback and confirmation instructions screen.
- Protected dashboard with server-validated claims and sign-out.
- Automatic profile creation from a database trigger when an auth user is created.

- RELAY marketing/entry experience and responsive brand styling.
- Supabase browser and server clients using cookie-based SSR.
- Supabase session-refresh proxy using `getClaims()`.
- Initial PostgreSQL foundation: profiles, provider profiles, requests, projects, project members, tasks, and trust verification records.
- Row Level Security enabled on every initial public table.
- Generated database TypeScript types in `src/types/database.ts`.

## Database project

- Organization: `LOGS_VAULT`
- Project: `relay`
- Region: `eu-west-1`
- Project ref: `kgtjgzulxfhurjabplpc`

The database bootstrap has been applied directly to the hosted project. We will add reproducible CLI migrations to this repository as the local development environment is set up.

## Security

- RLS is enabled on all application tables.
- Verification status is not editable by normal users.
- Never expose a Supabase service-role or secret key to browser code.
- Identity and professional verification are separate trust checks.
