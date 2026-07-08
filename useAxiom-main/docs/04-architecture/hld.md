# High-Level Design (HLD): useAxiom

## 1. Introduction & Objectives
The useAxiom platform is an enterprise-grade AI-powered execution agent. This High-Level Design (HLD) outlines a production-ready architecture designed to scale from an MVP to serving large organizations. The primary architectural goals are **Reliability**, **Data Isolation**, **Extensibility**, and **Asynchronous Resilience** (especially concerning third-party AI and WhatsApp integrations).

## 2. Overall System Architecture
The system employs a **Modular Monolith** architecture for the backend to accelerate MVP delivery while maintaining clean domain boundaries, allowing for future microservice extraction. It utilizes a Single Page Application (SPA) for the web dashboard and relies heavily on asynchronous event-driven queues to handle AI inference and WhatsApp webhooks without blocking the main event loop.

## 3. Component Diagram
```mermaid
graph TD
    %% Clients
    Manager[Manager/Admin] -->|HTTPS / REST| CDN[CDN / WAF]
    CDN --> WebUI[Web Dashboard SPA]
    WebUI -->|REST API| API_GW[Load Balancer / API Gateway]
    
    %% Webhook Source
    Meta[Meta WhatsApp API] -->|HTTPS Webhook| API_GW
    
    %% Backend Modules
    subgraph Modular Monolith (Backend)
        API_GW --> API_Server[Express/Node.js API Server]
        API_Server --> AuthMod[Auth & Tenant Module]
        API_Server --> ProjMod[Project & Task Module]
        API_Server --> HookMod[Webhook Router]
        
        HookMod -->|Enqueue| QueueBroker[(Redis Job Queue)]
        ProjMod -->|Enqueue AI Jobs| QueueBroker
    end
    
    %% Background Workers
    subgraph Background Processing
        QueueBroker --> Worker[Worker Fleet]
        Worker --> AI_Orchestrator[AI Orchestration Engine]
        Worker --> Notification_Engine[Notification Engine]
    end
    
    %% External Integrations
    AI_Orchestrator <-->|HTTPS| LLM[LLM Provider - OpenAI/Gemini]
    Notification_Engine -->|HTTPS| Meta
    
    %% Data Persistence
    API_Server --> PrimaryDB[(PostgreSQL - Primary)]
    Worker --> PrimaryDB
    PrimaryDB --> ReplicaDB[(PostgreSQL - Read Replica)]
```

## 4. Module Decomposition
- **Auth & Tenant Module:** Manages organization onboarding, SSO/JWT authentication, and Role-Based Access Control (RBAC). Enforces strict multi-tenancy.
- **Project & Task Module:** Core domain logic for CRUD operations on Projects, Milestones, and Tasks. Handles the state machine for task progression.
- **Webhook Router Module:** Verifies cryptographic signatures from Meta, acknowledges the HTTP request immediately, and drops the payload into the background queue.
- **AI Orchestration Engine (Worker):** Responsible for constructing prompts, managing conversational memory, invoking external LLMs, and parsing structured JSON responses or intent classifications.
- **Notification Engine (Worker):** Formats outbound messages and pushes them to the Meta WhatsApp Business API. Handles rate limits and retries.

## 5. Technology Stack Recommendations
- **Frontend:** React (Vite) + Tailwind CSS + React Query (for robust state management and caching).
- **Backend API & Workers:** Node.js with TypeScript (Express or NestJS) to leverage a unified ecosystem and strong async I/O performance.
- **Database:** PostgreSQL (Relational integrity is crucial for multi-tenant hierarchical data).
- **In-Memory Cache & Queue:** Redis (Used for BullMQ/Celery job queues and rate-limiting).
- **Infrastructure:** AWS, Google Cloud, or managed platforms like Vercel/Render for MVP, transitioning to Kubernetes for enterprise scale.

## 6. Deployment Architecture
- **Web Dashboard:** Statically generated and hosted on a CDN (e.g., Vercel, AWS CloudFront).
- **Backend Services:** Containerized using Docker. Deployed as scalable stateless services behind a load balancer.
- **Worker Fleet:** Deployed independently from the API servers to allow scaling based on queue depth (e.g., Auto-scaling based on Redis queue length).
- **Database:** Managed PostgreSQL instance (e.g., AWS RDS) with automated backups and Multi-AZ failover.

## 7. External Integrations
- **Meta WhatsApp Business API:** The sole communication channel for employees. Requires secure webhook endpoints, template message approvals, and 24-hour conversational window management.
- **LLM Providers (OpenAI/Anthropic/Gemini):** Used for task generation and intent parsing. API keys must be securely managed via secrets managers.

## 8. Communication Patterns
- **Synchronous (REST):** Used for all Manager dashboard interactions (e.g., fetching projects, approving tasks).
- **Asynchronous (Pub/Sub & Queues):** Used for all AI generation tasks and WhatsApp message processing. This ensures the web dashboard remains snappy and webhooks do not time out.

## 9. Event-Driven Workflows
**Example: Inbound WhatsApp Message**
1. Employee sends "Done".
2. Meta fires webhook to `POST /webhooks/whatsapp`.
3. Webhook Router verifies signature and immediately returns `200 OK` to Meta.
4. Payload is pushed to Redis queue `incoming_messages`.
5. Worker picks up payload, queries DB for employee context.
6. Worker passes context + message to LLM.
7. LLM returns `INTENT: COMPLETED`.
8. Worker updates Task status in PostgreSQL.
9. Worker triggers Notification Engine to send "Great job!" via WhatsApp.

## 10. Security Architecture
- **Data Isolation:** Enforced via Row-Level Security (RLS) in PostgreSQL, ensuring `organization_id` strictly partitions data.
- **Encryption:** TLS 1.3 for all data in transit. AES-256 for data at rest.
- **Authentication:** Short-lived JWTs with HttpOnly refresh tokens for managers.
- **Webhook Security:** SHA-256 HMAC signature verification for all Meta payloads to prevent spoofing.

## 11. Scalability Strategy
- **Database Scaling:** Read-heavy dashboard queries can be routed to PostgreSQL read replicas.
- **Compute Scaling:** API Servers and Background Workers scale independently. If AI processing slows down, the worker fleet scales out without impacting dashboard responsiveness.
- **Caching:** Redis will cache organization settings, permissions, and active task context to reduce database load during intensive LLM prompt construction.

## 12. Observability, Logging, Error Handling
- **Structured Logging:** All logs output in JSON format, enriched with `organization_id`, `trace_id`, and `user_id`.
- **APM & Tracing:** Tools like Datadog or New Relic to trace a request from the dashboard, through the API, into the job queue, and out to the LLM.
- **Error Handling:** Background jobs have automatic exponential backoff retries for transient errors (e.g., LLM timeouts). Dead Letter Queues (DLQ) capture failed jobs for manual review.

## 13. Infrastructure Considerations
- **Environment Parity:** Staging and Production environments must be identical in architecture to ensure webhook testing is accurate.
- **CI/CD:** Automated pipelines (e.g., GitHub Actions) enforcing code linting, unit testing, and zero-downtime deployments.
