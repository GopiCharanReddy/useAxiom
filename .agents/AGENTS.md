# useAxiom Project Rules (AGENTS.md)

This file contains the strict guidelines, behavioral constraints, and project-scoped rules that all developers (human and AI) must follow when contributing to the useAxiom repository.

## 1. Developer Persona Identification
When starting any task in this codebase, the developer must identify themselves as one of the following roles:
- **Developer 1 (Tech Lead / AI Lead):** Owns `packages/ai-*` (core, providers, tools, memory), prompt engineering, orchestrator, and reviews all PRs.
- **Developer 2 (Platform):** Owns monorepo setup, NestJS architecture, Auth, RBAC, Shared Configs, database migrations, and backend PR reviews.
- **Developer 3 (Frontend):** Owns `apps/manager-dashboard` (Next.js), `packages/ui` component library, and frontend PR reviews.
- **Developer 4 (Communications):** Owns WhatsApp integration, BullMQ queues, notifications, and queue PR reviews.
- **Developer 5 (Core Business):** Owns Projects, Tasks, Milestones schemas/logic, and core business workflow reviews.

## 2. Directory & Package Rules
- **No CRUD Violations:** Do not create simplistic CRUD routes. All API design must focus on business capability endpoints (e.g. `POST /projects/{id}/approve-plan` instead of `PUT /projects/{id}`).
- **Strict Monorepo Boundaries:** 
  - `apps/*` must never import directly from other `apps/*`.
  - Shared logic must reside in `packages/*`.
  - All shared config files extend from `packages/config/`.
- **Database Access:** Frontend apps must never query the database directly. Only the `backend-api` and `background-workers` may access the database (using `packages/database`).

## 3. Technology Constraints
- **Backend:** NestJS (TypeScript).
- **Frontend:** Next.js (TypeScript, Tailwind, App Router).
- **Queues:** BullMQ + Redis.
- **ORM:** Prisma (PostgreSQL).

## 4. Coding Standards
- **Strict TypeScript:** No implicit `any`. Everything must be strongly typed using `packages/types`.
- **File Naming:** `kebab-case` for files and folders (e.g., `user-controller.ts`).
- **Function/Variable Naming:** `camelCase` (e.g., `validateWebhookSignature`).
- **Class/Interface Naming:** `PascalCase` (e.g., `class AuthGuard`).

## 5. Development Workflow & Git
- **Branching:** `main` -> `develop` -> `feature/your-feature`. No commits directly to `main` or `develop`.
- **Commits:** Conventional Commits are mandatory (e.g., `feat(api): add jwt middleware`).
- **Standup:** Document standups asynchronously in 3 lines: Yesterday, Today, Blockers.
- **Dogfooding:** All sprint progress tracking will move inside useAxiom as soon as Sprint 2/3 is functional.
