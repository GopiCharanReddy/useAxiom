# Developer Onboarding Guide

Welcome to the useAxiom engineering team! This guide will get you up to speed quickly so you can start contributing.

## 1. What is useAxiom?
useAxiom is an AI-powered project execution platform. Managers use a web dashboard to define projects; our AI breaks those down into tasks, assigns them, and communicates directly with employees exclusively via WhatsApp. 

## 2. Architecture Overview
We use a **Modular Monolith** pattern inside a `pnpm` + `Turborepo` monorepo.
- Backend: Node.js/TypeScript (Express)
- Frontend: React (Vite)
- Database: PostgreSQL
- Queues: Redis (BullMQ)
Detailed docs: `/docs/04-architecture/hld.md`

## 3. Finding Documentation
The root of all knowledge is `/docs/README.md`. Never guess how a feature should work—check the SRS or API Specs first.

## 4. Local Setup & Workflow
1. Clone repo.
2. Run `pnpm install` at the root.
3. Copy `.env.example` to `.env`.
4. Run `pnpm turbo run dev`. This orchestrates Docker (spinning up Postgres/Redis) and starts the backend and frontend in parallel.

## 5. Coding Standards & Conventions
- **TypeScript:** Strict mode enabled. No `any`.
- **Formatting:** Prettier and ESLint are enforced via Husky pre-commit hooks.
- **Conventional Commits:** Use `feat:`, `fix:`, `chore:`, etc.
- **Branching Strategy:** Trunk-based development. Branch off `main` using `feat/description`. Open a PR, get 1 approval, and Squash & Merge.

## 6. How to Start Contributing
Read your specific domain assignment in `/docs/08-team/team-responsibilities.md`. Check the GitHub Projects board for your Sprint 1 tasks, move a ticket to "In Progress", and start coding!
