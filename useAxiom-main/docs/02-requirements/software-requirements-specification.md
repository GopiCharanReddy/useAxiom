# Software Requirements Specification (SRS) for useAxiom

## 1. Introduction
This Software Requirements Specification (SRS) provides a comprehensive overview of the entire system architecture, functionality, and constraints for **useAxiom**. It is intended to serve as the foundational blueprint for engineers, architects, product managers, and stakeholders involved in the development lifecycle.

## 2. Purpose
The purpose of useAxiom is to act as an AI-powered task management and execution agent for enterprise teams. It addresses the friction of traditional task management tools by offloading the manual overhead of planning, assigning, tracking, and reminding to an intelligent AI assistant. 

## 3. Scope
useAxiom provides a unified web dashboard for managers and organization administrators to oversee projects, combined with a WhatsApp-exclusive interface for employees. The platform encompasses AI-driven task generation, intelligent resource allocation, natural language processing for employee updates, and automated progress tracking. The scope focuses purely on execution and task management, explicitly omitting HR, payroll, and traditional CRM functionalities.

## 4. Definitions
- **AI Agent:** The intelligent core of useAxiom that handles task generation, intent parsing, and automated communications.
- **Organization Admin:** The tenant owner responsible for account settings and billing.
- **Manager:** The primary user of the web dashboard who defines goals and approves AI-generated plans.
- **Employee:** The execution worker who communicates exclusively via WhatsApp.
- **MVP (Minimum Viable Product):** The initial release focusing on "AI Assisted" mode where managers retain approval authority over AI actions.

## 5. Product Perspective
useAxiom is an independent enterprise SaaS application. It operates in a multi-tenant cloud environment. From a user perspective, it functions as a two-sided platform: a sophisticated web application for management and a headless, conversational interface (via WhatsApp Business API) for the workforce.

## 6. Product Vision
To redefine enterprise execution by shifting the burden of project management from humans to AI. Managers make decisions; AI executes. Employees should never need to learn or log into another application—WhatsApp is their workspace.

## 7. User Personas
### 7.1 Organization Admin (e.g., Sarah, Operations Director)
Sarah needs to onboard her company quickly. She focuses on setting up the WhatsApp Business integration, managing billing, and configuring global AI behavior rules.
### 7.2 Manager (e.g., David, Project Manager)
David is tired of chasing updates in Jira. He wants to type a one-paragraph project goal and have the AI break it down, suggest who should do what, and notify him only when things go off track.
### 7.3 Employee (e.g., Alex, Developer/Designer)
Alex hates checking task boards. They want a simple WhatsApp message at 9 AM telling them what to do, and the ability to reply "Blocked, API is down" without logging into a portal.

## 8. Overall System Description
The system consists of three primary layers:
1. **Manager Web Dashboard:** A secure, interactive UI for project definition, AI collaboration, and analytics.
2. **AI Orchestration Engine:** The backend intelligence responsible for LLM interactions, task breakdown, scheduling logic, and NLP intent parsing.
3. **Conversational Gateway:** The webhook and message processing pipeline interacting with the Meta WhatsApp API to route messages to and from employees.

## 9. Functional Requirements
### 9.1 Authentication & Authorization Module
- **FR-1.1:** The system shall authenticate Managers and Admins using secure credentials (e.g., email/password or SSO).
- **FR-1.2:** The system shall enforce Role-Based Access Control (RBAC) ensuring employees cannot access the web dashboard.
### 9.2 Organization Management Module
- **FR-2.1:** Admins shall be able to create an organization and manage subscription tiers.
- **FR-2.2:** Admins shall be able to integrate their corporate Meta WhatsApp Business account via standard OAuth/API key flows.
- **FR-2.3:** Admins shall be able to invite Managers (via email) and Employees (via phone number).
### 9.3 Project Management Module
- **FR-3.1:** Managers shall be able to create new projects by providing a title, description/objective, and target deadline.
- **FR-3.2:** Managers shall be able to view a master list of all projects and their real-time execution status.
- **FR-3.3:** The system shall allow managers to manually override, edit, or delete any task, milestone, or assignment.
### 9.4 AI Engine & Orchestration Module
- **FR-4.1:** The AI shall parse a manager's project objective and generate a structured list of milestones, tasks, and effort estimations.
- **FR-4.2:** The AI shall analyze employee workload and skills to recommend task assignments.
- **FR-4.3:** The AI shall parse inbound WhatsApp messages from employees to classify intent (e.g., Task Complete, Blocked, Extension Needed).
- **FR-4.4:** The AI shall proactively flag projects as "At Risk" if blockers are detected in employee communications.
### 9.5 WhatsApp Communication Module
- **FR-5.1:** The system shall automatically send daily task summaries to employees via WhatsApp at a configured time.
- **FR-5.2:** The system shall process incoming employee WhatsApp replies in near real-time.
- **FR-5.3:** The system shall send automated reminders for approaching or missed deadlines.
### 9.6 Reporting & Analytics Module
- **FR-6.1:** The dashboard shall display a visual summary of team velocity, project health, and blocked tasks.

## 10. Non-Functional Requirements
- **NFR-1 Security:** All tenant data must be strictly isolated. Data at rest and in transit must be encrypted.
- **NFR-2 Performance:** Dashboard interactions must respond in < 2 seconds. Inbound WhatsApp webhooks must be acknowledged in < 3 seconds.
- **NFR-3 Reliability:** The system must guarantee at-least-once delivery of employee messages to the AI processing queue.
- **NFR-4 Usability:** The web dashboard must possess a premium, intuitive aesthetic. The WhatsApp conversational flow must feel natural and human-like, not robotic.

## 11. Business Rules
- **BR-1:** AI shall not create top-level projects independently.
- **BR-2:** AI shall not alter organization-level settings or billing.
- **BR-3:** AI shall not terminate or remove employees from the system.
- **BR-4:** During the MVP phase (AI Assisted Mode), AI cannot finalize task assignments without explicit manager approval.

## 12. User Stories
- **US-1:** As a Manager, I want to describe a project in plain English so the AI can automatically generate the required tasks and milestones.
- **US-2:** As a Manager, I want to receive alerts only when an employee is blocked, so I don't have to micromanage their daily progress.
- **US-3:** As an Employee, I want to receive my tasks on WhatsApp so I don't have to learn a new software tool.
- **US-4:** As an Employee, I want to reply "Done" to a task message so my manager knows I finished it without me filling out a form.

## 13. Complete Use Cases
### Use Case 1: AI Project Planning
- **Actor:** Manager, AI Agent
- **Trigger:** Manager creates a new project and inputs an objective.
- **Flow:** Manager submits objective -> AI analyzes request -> AI generates milestones, tasks, and suggested assignees -> System displays draft plan -> Manager reviews, edits, and clicks "Approve" -> Tasks are saved and scheduled.
### Use Case 2: Employee Status Update
- **Actor:** Employee, AI Agent
- **Trigger:** Employee replies to a WhatsApp task message.
- **Flow:** Employee texts "I'm stuck on the database migration" -> WhatsApp webhook triggers backend -> AI parses text for intent -> AI identifies "Blocker" -> AI updates task status to BLOCKED -> AI sends notification to Manager dashboard.

## 14. System Assumptions
- Employees have a smartphone with WhatsApp installed and agree to use it for work communication.
- The organization has authorization to use the Meta WhatsApp Business API.
- LLM providers (e.g., OpenAI, Gemini) maintain reasonable uptime and latency to support conversational parsing.

## 15. Constraints
- **Interface Constraint:** No web or mobile dashboard will be built for employees.
- **Compliance Constraint:** System must adhere to Meta's WhatsApp Business messaging policies and opt-in rules.

## 16. Risks
- **Risk 1: AI Hallucinations.** The AI might misinterpret an employee's joke as a task blocker. *Mitigation: Implement strict prompt engineering and allow managers to override AI status changes.*
- **Risk 2: WhatsApp API Changes.** Meta changes their API or pricing structure. *Mitigation: Abstract the messaging layer so alternative platforms (SMS/Slack) could be added later.*
- **Risk 3: Latency.** LLM inference takes too long, making the WhatsApp bot feel unresponsive. *Mitigation: Use background queues and fast models for simple intent classification.*

## 17. Success Metrics
- **Manager Time Saved:** Reduction in hours spent on project planning and follow-ups.
- **Update Frequency:** Percentage of assigned tasks that receive a natural language update from employees.
- **AI Accuracy Rate:** The percentage of times the AI correctly parses employee intent without requiring manual manager correction (Target > 95%).

## 18. MVP Scope
- Manager Web Dashboard (Auth, Projects, AI Chat, Task Approvals, basic Analytics).
- AI Engine configured for "AI Assisted" mode (generates tasks, recommends assignments, parses WhatsApp replies).
- Employee WhatsApp interface (receiving daily plans, sending status updates).
- Support for one LLM provider and Meta WhatsApp Business API.

## 19. Future Scope
- **Autonomous Mode:** AI assigns and schedules work without needing manager approval.
- **Integrations:** Jira, GitHub, Slack, Microsoft Teams, Google Calendar.
- **Predictive Analytics:** AI identifying historical risks and predicting project delays before they happen.

## 20. Acceptance Criteria
- A Manager can create a project, and the AI returns a structured task list within 15 seconds.
- A Manager can approve the AI task list, which successfully transitions tasks to "Pending".
- An Employee receives a WhatsApp message containing their approved tasks.
- An Employee replies "Done" on WhatsApp, and the task status updates to "Completed" on the Manager's dashboard within 10 seconds.

## 21. Open Questions / Future Considerations
- *Opt-in Management:* How should we handle employees who ignore the WhatsApp opt-in message?
- *Complex Responses:* How should the AI handle an employee sending an image or voice note via WhatsApp? (Should we transcribe voice notes in Phase 2?)
- *Timezones:* How do we elegantly handle sending 9 AM daily summaries when employees are distributed globally?
