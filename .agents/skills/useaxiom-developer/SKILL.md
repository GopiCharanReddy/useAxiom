---
name: useaxiom-developer
description: Protocol for AI agents and developer workflows inside the useAxiom monorepo.
---

# useAxiom Workspace Developer Skill

This skill acts as the context booster and runtime instructions for AI coding agents helping with the useAxiom repository.

## Triggers
- Any task involving implementing code, modifying APIs, changing database schemas, or writing prompts in the `useAxiom` workspace.

## Prompt Checklist for AI Coding Agents
When an AI coding agent is invoked in this repository, it MUST execute the following pre-flight check:
1. **Identify Role:** Ask the user: *"Which Developer persona (1-5) am I acting as for this session?"* if not already declared.
2. **Review Context:** 
   - Read `/docs/04-architecture/repository-architecture.md` to understand package boundaries.
   - Read `/docs/07-development/sprint-plan.md` to verify the current sprint's goals.
   - Read `.agents/AGENTS.md` for coding standards.
3. **Draft Plan:** Always draft a plan highlighting which files are touched. Do not modify files across domains (e.g., UI files vs AI packages) in a single commit.

## Implementation Protocols

### 1. Database Schema Changes
If modifying database files:
1. Edit the schema in `packages/database/prisma/schema.prisma`.
2. Generate the client using `pnpm --filter @useaxiom/database prisma generate`.
3. Export new interfaces in `packages/types`.

### 2. Next.js UI Components
If building components in `apps/manager-dashboard`:
1. Use components from `packages/ui` where possible.
2. Do not include API keys, URLs, or client-side secrets. Use environment variables.
3. Follow Tailwind CSS class conventions.

### 3. NestJS Backend Modules
If adding modules in `apps/backend-api`:
1. Use NestJS CLI to generate modular structures (`module`, `controller`, `service`).
2. Implement validation schemas using `class-validator` or `zod` at the controller level.
3. Enforce the tenant ID extracted from request context on all database operations.

### 4. AI Prompt Iterations
If refining prompts:
1. Modify prompts ONLY within `packages/ai-core/prompts` or `packages/ai-providers`.
2. Ensure you have corresponding test coverage validating LLM structured JSON output.
