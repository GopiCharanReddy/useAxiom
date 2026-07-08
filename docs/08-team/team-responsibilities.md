# Team Responsibilities & Implementation Guides

To ensure parallel development with minimal bottlenecks, the team is structured across 5 distinct domains. **We dogfood our own product:** As soon as Sprints 2 or 3 are functional, all project tracking moves into useAxiom itself. You are the Manager, and the AI will assign tasks to Developers 2-5.

## Dev 1: You (Tech Lead + AI Lead)
- **Domain:** The "Brain" of useAxiom.
- **Responsibilities:** Overall architecture, AI Orchestrator, Agent Framework, Prompt Engineering, Provider Abstraction, Tool Calling, and AI Memory. Sprint planning, PR reviews, and integration support. You do *not* write the most code; you write the *smartest* code.
- **Package Ownership:** `packages/ai-core`, `packages/ai-providers`, `packages/ai-tools`, `packages/ai-memory`.
- **Code Reviews:** You review EVERY PR.

## Dev 2: Platform Engineer
- **Domain:** The underlying platform that everyone else builds upon.
- **Responsibilities:** Turborepo configuration, NestJS foundation, Docker, CI/CD, ESLint/Husky. Implementing the Authentication module, RBAC, and Organization structures.
- **Package Ownership:** `apps/backend-api` (Shared), `packages/types`, `packages/config`, `packages/utils`.
- **Code Reviews:** Reviews all Backend PRs.

## Dev 3: Frontend Lead
- **Domain:** The Manager Dashboard.
- **Responsibilities:** Next.js scaffolding, Dashboard UI, Project screens, Analytics views, AI Chat Panel, Approval UI, and the shared component library.
- **Package Ownership:** `apps/manager-dashboard`, `packages/ui`.
- **Code Reviews:** Reviews all Frontend PRs.

## Dev 4: Communication Engineer
- **Domain:** Headless connectivity and background processing.
- **Responsibilities:** WhatsApp Business API integration, Notification engine, BullMQ background jobs, Reminder scheduler, and webhook handlers.
- **Code Reviews:** Reviews WhatsApp & Queue PRs.

## Dev 5: Core Business Logic
- **Domain:** The data entities that define work.
- **Responsibilities:** Building the logic for Projects, Milestones, Tasks, Assignments, Reports, and Analytics workflows.
- **Package Ownership:** `apps/backend-api` (Shared).
- **Code Reviews:** Reviews Business Logic PRs.
