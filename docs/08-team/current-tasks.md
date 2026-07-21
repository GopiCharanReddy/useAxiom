# Current Developer Tasks (Post-Integration Phase)

This document outlines the immediate next steps for each developer following the successful integration of the foundational monorepo components (backend API, background workers, and shared packages). All developers should pull the latest `main` branch on their forks before beginning these tasks.

## Developer 1 (Tech Lead / AI Lead)
**Domain:** The "Brain" of useAxiom (`packages/ai-*`)
**Goal:** Establish the AI orchestration layer to process tasks and communicate intelligently.

**Immediate Tasks:**
- **AI Core Implementation:** Begin building the orchestration logic in `packages/ai-core`. This includes the main agent loop that will decide when to break down projects, when to assign tasks, and when to ask clarifying questions.
- **Provider Integrations:** Flesh out `packages/ai-providers` to connect to LLM APIs (e.g., OpenAI, Anthropic, Gemini). Ensure robust error handling, rate limiting, and fallback strategies.
- **AI Memory & Tools:** Implement short-term and long-term context management in `packages/ai-memory` (potentially leveraging Postgres/pgvector or Redis). Define standard tool calling schemas in `packages/ai-tools`.
- **Review Duties:** Continue to review all incoming Pull Requests to ensure adherence to architectural constraints and coding standards.

## Developer 2 (Platform Engineer)
**Domain:** Platform Foundation (`apps/backend-api`, `packages/config`, `packages/types`)
**Goal:** Harden the backend infrastructure, focusing on security, multi-tenancy, and observability.

**Immediate Tasks:**
- **Authentication & Authorization:** Implement robust authentication (e.g., JWT-based) within `apps/backend-api`. Define guards and interceptors to protect endpoints.
- **RBAC & Multi-Tenancy:** Establish Role-Based Access Control. Ensure the `TenantMiddleware` is fully operational and that all database queries automatically scope to the correct organization/tenant.
- **Global Error Handling & Logging:** Finalize global exception filters to standardize API error responses. Implement centralized logging and metrics collection.
- **Schema & Migrations:** Work with Dev 5 to ensure database schemas in `packages/database` are correctly structured, indexed, and migrated.

## Developer 3 (Frontend Lead)
**Domain:** Manager Dashboard (`apps/manager-dashboard`, `packages/ui`)
**Goal:** Build out the user interface for project managers to interact with the system.

**Immediate Tasks:**
- **Application Scaffolding:** Scaffold the Next.js App Router application in `apps/manager-dashboard`. Set up the global layout, routing, and theme provider.
- **Shared UI Library:** Begin populating `packages/ui` with reusable components (e.g., Buttons, Modals, Data Tables, Forms) using standard design tokens.
- **Core Views:** Develop the Project Dashboard, Task Breakdown views, and the AI Chat Panel interface.
- **API Integration Prep:** Since the rule strictly forbids direct DB access from the frontend, coordinate with Dev 2 and Dev 5 to define the REST API contracts. Use mock data structures in the meantime to unblock UI development.

## Developer 4 (Communication Engineer)
**Domain:** Headless Connectivity & Background Processing (`apps/background-workers`, WhatsApp Modules)
**Goal:** Enable real-time, reliable communication with the workforce via WhatsApp.

**Immediate Tasks:**
- **[COMPLETED] Meta API Integration:** Replaced simulated logic in `apps/background-workers/src/workers/outgoing-messages.worker.ts` with actual HTTP calls to the Meta WhatsApp Business API.
- **[COMPLETED] Webhook Processing:** Enhanced `apps/backend-api/src/modules/whatsapp/whatsapp.controller.ts` to properly validate incoming Meta webhook payloads (signature verification) and reliably push messages to the `incoming_messages` queue.
- **[COMPLETED] Notification Engine:** Expanded the unified notifications module to handle different channels (email, in-app, SMS/WhatsApp) and robust template rendering.
- **[COMPLETED] Queue Monitoring:** Enabled robust queue monitoring, retry configurations, and exponential backoff strategies for background tasks.

## Developer 5 (Core Business Logic)
**Domain:** Core Data Entities (`packages/database/prisma/schema.prisma`, `apps/backend-api`)
**Goal:** Implement the complex business rules governing projects, tasks, and workflows.

**Immediate Tasks:**
- **Database Schema:** Define the Prisma schema for Projects, Milestones, Tasks, and Assignments in `packages/database`. Ensure proper relations and constraints.
- **Capability-Based APIs:** Build the corresponding NestJS modules, services, and controllers in `apps/backend-api`. **Crucial Rule:** Avoid simple CRUD. Create action-oriented endpoints like `POST /api/v1/projects/{id}/approve-plan` or `POST /api/v1/tasks/{id}/mark-complete`.
- **Event Emission:** Ensure that business logic services emit the correct events to the notifications module when state changes occur (e.g., notifying a user when a task is assigned).
- **Workflow State Machines:** Implement robust state management for tasks (e.g., Draft -> Assigned -> In Progress -> In Review -> Completed).
