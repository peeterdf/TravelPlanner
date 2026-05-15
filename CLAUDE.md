# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server with HMR
npm run build      # TypeScript check + Vite production build
npm run lint       # Run ESLint
npm run preview    # Preview production build locally
```

Install dependencies with `npm ci --legacy-peer-deps` (required due to peer dep conflicts).

There are no tests. TypeScript strict mode (`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`) acts as the primary correctness check.

## Environment Setup

Copy `.env.example` to `.env.local` and fill in Firebase credentials:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_APP_ID
VITE_RECAPTCHA_SITE_KEY   # optional, enables App Check
```

## Architecture

**Stack:** React 19 + TypeScript + Vite, Zustand state, Tailwind CSS, Firebase (Auth + Firestore), localforage (IndexedDB), PWA.

**Offline-first design:** All trip data lives in localforage (IndexedDB/localStorage). Firebase Firestore is optional cloud sync — trips are fully functional without it.

**State management** (`src/store/`):
- `tripsStore` — central store: trip CRUD, all sub-entity operations, and cloud sync orchestration (debounced 800ms, min 5s interval)
- `authStore` — Firebase auth user and role
- `settingsStore` — theme (light/dark/system), privacy mode
- `syncStore` — sync status (syncing/synced/error)
- `toastStore`, `boardingPassStore` — UI state

**Domain model** (`src/types/index.ts`): A `Trip` contains travelers, transports, accommodations, itinerary (day-by-day by city), activities, expenses (with multi-currency and split tracking), packing list (hierarchical), notes, and an audit log. Every modification is tracked with timestamp and user ID.

**Routing** (`src/App.tsx`): React Router v7. Trip detail has nested routes under `/trip/:id/` — Dashboard, Transports, Accommodations, Itinerary, Activities, Expenses, Packing, Notes.

**Cloud sync** (`src/lib/cloudSync.ts`): Trips are identified in Firestore by a 20-char random `cloudCode`. Collections: `/trips/{cloudCode}` (shared) and `/users/{uid}/trips/{cloudCode}` (per-user). Only the trip owner can delete the cloud copy.

**Firebase Auth** (`src/lib/firebase.ts`): Anonymous sign-in by default; can upgrade to Google OAuth or email/password. Supports account linking.

**Firestore security rules** (`firestore.rules`): Authenticated users can read/create trips; anyone can update (collaboration); only owners can delete. Boarding passes are owner-only.

## Key Conventions

- UI labels are in **Spanish** ("Viajes", "Gastos", "Transportes", "Alojamiento", "Itinerario").
- Vite base URL is `/TravelPlanner/` for GitHub Pages deployment — don't use absolute paths for assets.
- PWA is configured in `vite.config.ts` with Workbox caching for all static assets.
- `tripsStore.ts` is the largest and most critical file (~600 lines) — all trip mutations go through it.
