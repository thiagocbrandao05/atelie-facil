---
trigger: always_on
---

📏 Standardized Project Rules (AI Model Guidelines)
Context: These rules MUST be followed when creating any new project. They are derived from the successful standardization of lote-pro, catalog-master, and atelie-facil.

1. 🏗️ Core Architecture: Feature-Based
Do NOT use a "Layered" architecture (controllers/services/models folders at root). Use a Feature-based architecture.

Canonical Directory Structure
All code lives in src/.

src/
├── app/                  # Next.js App Router (Pages & Layouts ONLY)
│   ├── (public)/         # Public routes group
│   ├── (app)/            # Protected routes group
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles (Tailwind + CSS Vars)
├── components/           # Shared/Generic UI Components
│   ├── ui/               # Shadcn UI primitives (Button, Input, etc.)
│   └── ...               # Other shared components (Header, Footer)
├── features/             # ⭐️ THE CORE: Domain Logic
│   ├── [feature-name]/   # e.g., 'auth', 'products', 'checkout'
│   │   ├── actions.ts    # Server Actions (Mutations & Data Fetching)
│   │   ├── components/   # Feature-specific components
│   │   ├── hooks/        # Feature-specific hooks
│   │   ├── types.ts      # Feature-specific types
│   │   └── utils.ts      # Feature-specific helpers
│   └── ...
├── lib/                  # Global Utilities & Config
│   ├── supabase/         # Supabase Clients (server.ts, client.ts)
│   ├── utils.ts          # cn() and other helpers
│   └── ...
└── hooks/                # Information that cuts across features (e.g. use-toast)
2. 🛠️ Tech Stack & Patterns
Framework & Language
Next.js 14+ (App Router): Strict requirement.
TypeScript: Strict mode enabled. No any (unless absolutely necessary for legacy interop).
Tailwind CSS: For all styling. No CSS modules.
Data & State
Server Actions: ALL mutations and backend logic must reside in src/features/[feature]/actions.ts.
Data Fetching: Prefer fetching directly in Server Components using Supabase Server Client.
State Management:
Prefer URL Search Params (use nuqs or native searchParams) for filter/pagination state.
Use React Query only if real-time/optimistic updates are complex.
Avoid global state stores (Zustand/Redux) unless strictly necessary for cross-feature client state.
Database (Supabase)
Auth: Supabase Auth (SSR).
Migrations: Unified SQL file methodology.
Maintain a single supabase/schema_snapshot.sql that represents the current full schema.
Do NOT clutter supabase/migrations with hundreds of tiny files during rapid prototyping.
Logic: Row Level Security (RLS) is MANDATORY for all tables.
3. 📝 Naming Conventions
Files/Folders: kebab-case (e.g., user-profile, data-table.tsx).
Components: PascalCase (e.g., UserProfile, DataTable).
Functions: camelCase (e.g., getUserProfile, submitForm).
Server Actions: explicit naming (e.g., updateUserAction, createProductAction) to distinguish from client functions.
4. 🧩 UI/UX Standards
Library: Shadcn UI (Radix based).
Icons: Lucide React.
Theme: CSS Variables in globals.css (primary, secondary, accent, destructive).
Feedback: Use sonner or toast for server action results.
Loading: Use <Suspense> boundaries and skeleton components.
5. 🚫 Anti-Patterns (What NOT to do)
❌ No src/pages (Router). usage within App Router projects.
❌ No API Routes (app/api/...) for internal logic. Use Server Actions. Only use API routes for webhooks or external integrations.
❌ No business logic in UI Components. Move it to features/[feature]/....
❌ No direct database calls in Client Components.
6. 🛡️ Security
Zod: Validate ALL inputs in Server Actions using Zod schemas.
RLS: Never rely solely on application logic; Ensure Database RLS policies exist.