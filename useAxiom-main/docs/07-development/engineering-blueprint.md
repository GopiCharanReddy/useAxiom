# Engineering Blueprint: useAxiom

## 1. Overview
This Engineering Blueprint is the strict Low-Level Design (LLD) and execution plan for implementing the **useAxiom** platform. It maps the approved architecture (HLD, DB Design, API Specs, ADD, UX) into a chronological development sequence.

**Rule for Developers & AI Agents:** Do not skip steps. Do not build UI before the backend module is tested. Do not integrate AI until the base CRUD operations are functional.

## 2. Technology Stack Recap
- **Backend:** Node.js, TypeScript, Express (or NestJS).
- **Frontend:** React, Vite, TypeScript, Tailwind CSS.
- **Database:** PostgreSQL (with Prisma or TypeORM).
- **Message Broker / Cache:** Redis (with BullMQ).
- **Integrations:** Meta WhatsApp Business API, OpenAI/Gemini SDK.

## 3. Strict Execution Sequence

### Sequence 1: Foundation & Scaffolding
- **1.1 Backend Init:** Initialize Node.js/TS project. Configure ESLint, Prettier, and environment variables.
- **1.2 Database Init:** Spin up local PostgreSQL. Initialize the ORM (Prisma/TypeORM).
- **1.3 Base Schema:** Run initial migrations for the `organizations`, `users`, and `roles` tables.
- **1.4 Redis Init:** Spin up local Redis. Configure BullMQ worker queues.

### Sequence 2: Auth & Tenancy (The Core)
- **2.1 JWT Service:** Implement JWT generation and verification middleware.
- **2.2 Tenant Middleware:** Implement middleware to enforce `organization_id` extraction and validation on all routes.
- **2.3 Auth APIs:** Implement `POST /auth/login` and `POST /organizations/{id}/invite-user`.
- **2.4 Testing:** Write integration tests ensuring a user from Org A cannot access Org B data.

### Sequence 3: Project Execution Engine
- **3.1 Execution Schema:** Migrate `projects`, `milestones`, `tasks`, and `assignments` tables.
- **3.2 CRUD APIs:** Implement standard creation and retrieval endpoints for projects.
- **3.3 State Machine:** Implement the task state transition logic (`PROPOSED` -> `PENDING` -> `IN_PROGRESS` -> `COMPLETED`).
- **3.4 Approval APIs:** Implement `POST /projects/{id}/approve-plan` and `POST /tasks/{id}/approve`.

### Sequence 4: AI Orchestrator & Workers
- **4.1 AI Schema:** Migrate `ai_agent_runs`, `ai_decisions`, and `ai_approval_requests` tables.
- **4.2 Queue Consumers:** Create the BullMQ worker processes that listen for AI tasks.
- **4.3 LLM Client:** Wrap the LLM provider SDK (OpenAI/Gemini) with retry logic and structured JSON output parsers.
- **4.4 Planner Agent:** Implement the specific prompt logic to take a project objective and generate a structured task list. Connect this to `POST /projects/{id}/generate-plan`.
- **4.5 Testing:** Mock the LLM and verify the worker correctly saves `PROPOSED` tasks to the database.

### Sequence 5: Conversational Gateway (WhatsApp)
- **5.1 WhatsApp Schema:** Migrate `whatsapp_messages` and `conversation_threads`.
- **5.2 Webhook API:** Implement `POST /webhooks/whatsapp` to verify Meta HMAC signatures and push payloads to Redis immediately.
- **5.3 Conversation Agent Worker:** Implement the queue consumer that takes the raw WhatsApp message, fetches active task context, and queries the LLM for Intent Classification.
- **5.4 Outbound Notifications:** Implement the service to call Meta's API to send outbound messages (e.g., Daily 9 AM summaries).

### Sequence 6: Manager Web Dashboard (Frontend)
- **6.1 UI Scaffolding:** Initialize React/Vite project. Configure routing and Tailwind.
- **6.2 Auth Views:** Build Login and Org Setup screens.
- **6.3 Dashboard View:** Build the main analytics and health dashboard.
- **6.4 Project Views:** Build the Project List and Project Detail pages.
- **6.5 Approval Workflow UI:** Build the specific interfaces allowing managers to review and edit AI-proposed task lists before approving them.
- **6.6 AI Chat Panel:** Implement the slide-out conversational interface for the manager.

## 4. Module Dependencies Graph
To prevent blocked work, modules must be built in this dependency order:
`Database/ORM` -> `Auth/Tenancy` -> `Project Core` -> `AI Workers` -> `WhatsApp Webhooks` -> `Frontend Dashboard`.

## 5. Development Rules for AI Agents
1. **Always read the context:** Before implementing a module, re-read the relevant section in `api_specifications.md` and `database_design.md`.
2. **Build incrementally:** Write the schema -> Write the service logic -> Write the controller -> Write the tests.
3. **No mock data in prod paths:** Ensure the database is actually hooked up before moving to the next sequence.
4. **Log everything:** Ensure `console.info` or a logging library tracks the entry and exit of background workers.
