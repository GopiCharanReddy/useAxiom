# REST API Specification: useAxiom

## 1. API Design Principles
- **Business Capability Focus:** APIs reflect user intents and workflows rather than simple database CRUD operations (e.g., `POST /projects/{id}/approve-plan` instead of `PUT /projects/{id}`).
- **REST Conventions:** Nouns for resources (`/projects`), verbs for specific actions (`/projects/{id}/generate-plan`).
- **Versioning:** URI versioning (`/api/v1/`) to ensure long-term stability.
- **Idempotency:** All `PUT` and `DELETE` requests are idempotent. Action-oriented `POST` requests utilize `Idempotency-Key` headers to safely handle retries (crucial for webhook workflows).
- **Pagination, Filtering, Sorting:** Standardized query parameters (e.g., `?page=1&limit=20&sort=-created_at&status=ACTIVE`).

## 2. Authentication & Authorization
- **JWT Strategy:** Short-lived Access Tokens (15 mins) passed in the `Authorization: Bearer` header. Long-lived Refresh Tokens stored in secure, `HttpOnly` cookies.
- **RBAC & Isolation:** Every authenticated request parses the JWT to extract `user_id`, `role`, and `organization_id`. The application layer and database RLS use `organization_id` to strictly isolate tenant data.

## 3. API Modules Overview
The API is divided into logical domains:
- **Identity:** `/auth`, `/users`, `/organizations`
- **Execution:** `/projects`, `/tasks`, `/approvals`
- **Intelligence:** `/ai`, `/analytics`
- **Communications:** `/webhooks`, `/notifications`

## 4. Endpoint Specifications & Business Workflows

### 4.1 Identity & Organization
- **`POST /api/v1/auth/login`**
  - **Purpose:** Authenticate manager/admin.
  - **Request:** `{ "email", "password" }`
  - **Response:** `{ "access_token", "user": { "id", "role", "organization_id" } }`
- **`POST /api/v1/organizations/{id}/invite-user`**
  - **Purpose:** Admin invites a manager or employee.
  - **Request:** `{ "email", "phone_number", "role" }`
  - **Response (201):** User profile.

### 4.2 Project & Task Execution (Approvals)
- **`POST /api/v1/projects`**
  - **Purpose:** Manager creates a project objective.
  - **Request:** `{ "name", "objective", "target_deadline" }`
  - **Response (201):** `{ "id", "status": "PLANNING" }`
- **`POST /api/v1/projects/{id}/approve-plan`**
  - **Purpose:** Manager approves the AI's proposed milestone and task list.
  - **Business Rule:** Transitions all child tasks from `PROPOSED` to `PENDING`.
  - **Response (200):** Success confirmation.
- **`POST /api/v1/tasks/{id}/approve`**
  - **Purpose:** Ad-hoc approval of a single AI-generated task or assignment.
  - **Request:** `{ "assignee_id_override", "estimated_hours_override" }` (Optional)

## 5. AI APIs
These APIs act as the bridge between the Manager Dashboard and the AI Orchestrator.
- **`POST /api/v1/projects/{id}/generate-plan`**
  - **Purpose:** Triggers the AI Planner Agent.
  - **Response (202 Accepted):** Returns a job ID. The UI polls or connects via WebSocket for completion.
- **`POST /api/v1/ai/chat`**
  - **Purpose:** Manager converses with the AI about project health.
  - **Request:** `{ "project_id", "message": "Why is David blocked?" }`
  - **Response (200):** `{ "reply", "confidence_score", "suggested_actions": [] }`
- **`POST /api/v1/ai/recommend-assignments`**
  - **Purpose:** Triggers the Assigner Agent to suggest personnel for a batch of tasks based on workload context.

## 6. WhatsApp APIs
- **`POST /api/v1/webhooks/whatsapp`**
  - **Purpose:** Receives inbound messages and status callbacks from Meta.
  - **Auth:** No JWT. Uses `X-Hub-Signature-256` HMAC validation.
  - **Business Rule:** Must respond with `200 OK` within 3 seconds. Payload is pushed to Redis for asynchronous AI processing.
- **`POST /api/v1/notifications/send-summary`**
  - **Purpose:** Internal API to manually trigger the 9 AM summary broadcast (usually invoked via Cron job).

## 7. Analytics APIs
- **`GET /api/v1/analytics/dashboard`**
  - **Purpose:** Populates the Manager's main view.
  - **Query Params:** `?timeframe=7d`
  - **Response:** `{ "active_projects", "blocked_tasks", "ai_interventions_count", "team_velocity" }`
- **`GET /api/v1/analytics/team-workload`**
  - **Purpose:** Shows current capacity to aid in assignment decisions.

## 8. Search APIs
- **`GET /api/v1/search`**
  - **Purpose:** Global omni-search across the organization.
  - **Query Params:** `?q=marketing&types=projects,tasks,employees`
  - **Response:** Paginated list of unified search results.

## 9. Error Handling
Standardized RFC 7807 Problem Details format for all 4xx/5xx responses:
```json
{
  "type": "https://api.useaxiom.com/errors/ai-confidence-low",
  "title": "AI Confidence Too Low",
  "status": 422,
  "detail": "The AI could not confidently parse the employee's intent. Manual review required.",
  "trace_id": "req-12345abc"
}
```

## 10. API Security
- **Rate Limiting:** IP-based and Tenant-based rate limits enforced via Redis API Gateway to prevent noisy-neighbor issues.
- **Input Validation:** Strict JSON schema validation using Zod/Joi before hitting controllers.
- **Webhook Verification:** Cryptographic signature validation for all inbound Meta traffic to prevent spoofing.

## 11. API Observability
- **Correlation IDs:** Every inbound request is assigned an `x-correlation-id` that propagates through logs, job queues, AI agent runs, and database audit logs.
- **Metrics:** Prometheus endpoints exposed for `request_duration_seconds`, `ai_agent_latency`, and `whatsapp_delivery_failures`.

## 12. API Lifecycle
- **Deprecation:** 6-month notice for breaking changes. Clients notified via headers (`Deprecation`, `Link` to documentation).
- **Extensibility:** All JSON responses permit extra fields without breaking clients to ensure additive changes do not require version bumps.

## 13. Future Extensibility
The API is structured to cleanly accept future integrations:
- **`POST /api/v1/webhooks/github`** for PR status syncing.
- **`POST /api/v1/webhooks/jira`** for bidirectional task state syncing.
- **`GET /api/v1/calendar/sync`** for MS Teams/Google Calendar blocking based on task estimates.
