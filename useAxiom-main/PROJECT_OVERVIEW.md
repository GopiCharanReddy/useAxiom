# Project Overview: useAxiom

## Project Summary & Vision
**useAxiom** is an enterprise SaaS platform acting as an AI-powered project management and execution agent. The core philosophy is simple: **Managers make decisions; AI executes those decisions.** Employees do not use a dashboard—they communicate entirely through WhatsApp.

## Dogfooding Strategy
As soon as Sprint 2/3 is viable, the team will manage useAxiom's own development *inside* useAxiom. The Tech Lead acts as the Manager, and the AI assigns and monitors tasks for Developers 2-5 via WhatsApp.

## Architecture Summary
- **Backend:** NestJS in a Modular Monolith architecture.
- **Frontend:** Next.js + Tailwind CSS (Manager Dashboard SPA).
- **Database:** PostgreSQL + Redis.
- **AI Brain:** Abstracted into `ai-core`, `ai-providers`, `ai-tools`, and `ai-memory`.
- **Monorepo:** pnpm workspaces + Turborepo.

## Quick Start for Developers
1. Clone the repository and run `pnpm install`.
2. Read the onboarding guide: `/docs/08-team/onboarding.md`.
3. Check `team-responsibilities.md` for your specific domain assignment.
4. When prompting the AI IDE for help, start with: "I am Developer [X]. Let's work on Sprint [Y]."
