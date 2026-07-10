# Business Proposal Generator

Internal tool for Orient Technologies sales teams to create standardized Digital Transformation (DT) business proposals with DOCX and PDF export.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/proposal-app run dev` — run the frontend (port assigned by workflow)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + express-session + bcryptjs
- DB: PostgreSQL + Drizzle ORM (users, proposals tables)
- Frontend: React + Vite + Tailwind CSS + TanStack Query + Wouter
- API codegen: Orval (from OpenAPI spec in lib/api-spec/openapi.yaml)
- DOCX: `docx` npm package
- PDF: `pdfkit` (externalized from esbuild bundle due to fontkit/swc dependency)

## Where things live

- `artifacts/api-server/src/routes/` — Express route handlers (auth, proposals, documents)
- `artifacts/api-server/src/lib/` — DOCX and PDF generation logic
- `artifacts/proposal-app/src/pages/` — React pages (Login, Signup, Dashboard, ProposalForm, ProposalPreview)
- `artifacts/proposal-app/src/context/AuthContext.tsx` — Auth state via useGetMe
- `artifacts/proposal-app/src/constants.ts` — Pre-filled text (Pre-Requisites, Commercials notes, Corporate Profile, etc.)
- `lib/db/src/schema/` — users and proposals tables

## Architecture decisions

- Proposals stored as a single JSONB column (`data`) — avoids complex normalization for a document-centric use case.
- pdfkit is externalized in esbuild (`build.mjs`) because its dependency fontkit uses CJS + @swc/helpers which can't be bundled.
- Sessions use connect-pg-simple against the existing PostgreSQL DB (creates `user_sessions` table automatically).
- CORS uses REPLIT_DOMAINS allowlist in production, permissive in development.

## Product

- Auth: Sign Up, Login, Logout (bcrypt, session cookies)
- Dashboard: single DT Business Unit card + proposals table with view/edit/delete
- 11-section proposal form with sidebar navigation and auto-save
- A4 HTML preview with Download Word (.docx) and Download PDF buttons
- DOCX: real editable .docx via `docx` npm package
- PDF: real valid PDF via `pdfkit`

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After adding new lib schema files, run `pnpm run typecheck:libs` before checking artifact typechecks.
- pdfkit must stay in the `external` list in `artifacts/api-server/build.mjs`.
- SESSION_SECRET environment variable is required for the API server to start.
