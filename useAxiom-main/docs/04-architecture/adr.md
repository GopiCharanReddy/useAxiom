# Architecture Decision Records (ADR): useAxiom

## Context
useAxiom is an enterprise SaaS application acting as an AI-powered project manager. Managers interact via a web dashboard, while employees interact exclusively via WhatsApp. The system must process natural language, coordinate with LLMs, and handle asynchronous webhooks reliably.

---

## ADR-001: Architectural Style - Modular Monolith
**Date:** 2026-07-08  
**Status:** Accepted  

**Context:** The project is entering the MVP phase. We need to iterate quickly while ensuring the architecture can scale to a large enterprise system in the future.
**Decision:** We will use a Modular Monolith architecture. The codebase will be a single deployable unit, but internally structured into distinct, decoupled domains (Auth, Projects, AI Orchestration, Webhooks).
**Consequences:** 
- **Positive:** Reduces operational complexity and deployment overhead. Avoids the network latency and distributed data management issues of microservices.
- **Negative:** Requires strict discipline from developers to avoid tangling domain boundaries.

---

## ADR-002: Backend Tech Stack - Node.js with TypeScript
**Date:** 2026-07-08  
**Status:** Accepted  

**Context:** The backend requires high concurrency for handling webhooks, robust asynchronous processing, and a strong ecosystem for AI/LLM integration.
**Decision:** We will use Node.js with TypeScript and the Express (or NestJS) framework.
**Consequences:** 
- **Positive:** Node.js's non-blocking I/O is ideal for proxying requests to LLMs and handling webhooks. TypeScript provides necessary type safety for enterprise applications. Sharing language syntax with the React frontend reduces cognitive load.
- **Negative:** CPU-heavy tasks (if any) could block the event loop, though this is mitigated by offloading to background workers.

---

## ADR-003: Primary Datastore - PostgreSQL
**Date:** 2026-07-08  
**Status:** Accepted  

**Context:** The application deals with highly structured, relational, and hierarchical data (Organizations -> Projects -> Milestones -> Tasks -> Messages). Multi-tenancy must be strictly enforced.
**Decision:** We will use PostgreSQL as the primary relational database.
**Consequences:** 
- **Positive:** ACID compliance guarantees data integrity. Advanced features like Row-Level Security (RLS) provide robust multi-tenant data isolation.
- **Negative:** Schema migrations require careful planning compared to NoSQL alternatives.

---

## ADR-004: Asynchronous Processing - Redis & Job Queues
**Date:** 2026-07-08  
**Status:** Accepted  

**Context:** The Meta WhatsApp API requires webhook endpoints to return a `200 OK` almost immediately. LLM responses take 2-10 seconds. We cannot process AI logic synchronously during the webhook request.
**Decision:** We will implement an asynchronous worker pattern using Redis as a message broker (e.g., BullMQ). Webhooks will immediately push payloads to the queue and return 200. Workers will process the queue independently.
**Consequences:** 
- **Positive:** Guarantees webhook reliability. Allows independent scaling of the worker fleet based on AI workload.
- **Negative:** Adds infrastructure complexity (requires a Redis cluster and worker processes).

---

## ADR-005: Client Interfaces - Web Dashboard & Headless WhatsApp
**Date:** 2026-07-08  
**Status:** Accepted  

**Context:** The core philosophy dictates that employees should not need another app, while managers need deep visibility.
**Decision:** We will build a React Single Page Application (SPA) for Managers/Admins only. We will explicitly *not* build a web or mobile client for Employees. Employee interaction will be 100% headless via the Meta WhatsApp Business API.
**Consequences:** 
- **Positive:** Drastically reduces frontend development scope. Increases employee adoption by meeting them in an app they already use.
- **Negative:** We are entirely dependent on Meta's WhatsApp API uptime and policy constraints for the core employee experience. UI constraints of WhatsApp limit how complex task interactions can be.
