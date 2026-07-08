# Sprint Plan & Implementation Roadmap

## Sprint 1: Foundations Only
- **Dev 1 (Tech Lead):** AI package architecture, interfaces, provider abstraction, prompt package structure, agent skeletons. No AI logic.
- **Dev 2 (Platform):** Turborepo, NestJS skeleton, Docker, ESLint, Husky, environment and shared configs.
- **Dev 3 (Frontend):** Next.js dashboard shell, routing, layout, theme, shared UI.
- **Dev 4 (Communication):** Queue infrastructure (BullMQ), notification module skeleton, WhatsApp module skeleton.
- **Dev 5 (Business):** Backend module skeletons (Project, Task, Analytics modules).

## Sprint 2: Core Data & Basic UI
- **Platform:** Authentication, Organization, RBAC.
- **Frontend:** Login screen, Dashboard view.
- **Business:** Project CRUD.
- **AI:** Planner Agent initial implementation.
- **Communication:** Notification APIs.

## Sprint 3: Deep Execution & Generation
- **Business:** Tasks, Assignments, Milestones.
- **Frontend:** Project pages, Task pages.
- **AI:** Task generation logic.
- **Communication:** Reminder engine.

## Sprint 4: Advanced AI & Headless Ops
- **AI:** Assignment Agent, Conversation Agent, Reporting Agent.
- **Communication:** Full WhatsApp integration.
- **Business:** Task Dependencies.
- **Frontend:** Approval UI for AI-generated plans.

## Sprint 5: Integration Sprint
- **Everyone:** Wire everything together. End-to-end testing of the AI task generation flowing into WhatsApp notifications, employee replies routing through the Conversation Agent, and updating the Manager Dashboard.
