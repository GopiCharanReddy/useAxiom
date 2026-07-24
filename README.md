# useAxiom - Autonomous AI-Driven Project & Team Management Platform

**useAxiom** is an enterprise AI-driven workspace management platform designed to automate project planning, employee workload tracking, and daily project progress reminders via WhatsApp integration.

---

## Key Features

- **Axiom Assistant (AI Co-Pilot)**: Context-aware AI assistant helping managers track project deadlines, identify employee workload bottlenecks, flag risks, and manage sprint deliverables.
- **Automatic AI Reminder System**: Automatically schedules and dispatches daily personalized WhatsApp reminder messages to employees counting down to their project deadlines (supports customizable AI Tones: _Professional_, _Friendly_, _Strict_).
- **Manual & AI Project Assignments**: Assign project goals and tasks manually or through Axiom Assistant with instant WhatsApp notifications to recipient phone numbers.
- **Manager Dashboard**:
  - `/projects`: View, create, and manage active project goals and milestone tasks.
  - `/team`: Workload distribution, assigned tasks, and contact phone sync.
  - `/reminders`: Overview of active reminder schedules, delivery logs, pause/resume controls, and manual trigger buttons.
  - `/settings`: Global automation configurations, AI execution strategy, and scheduled delivery times.

---

## Monorepo Architecture

This codebase is structured as a Turborepo monorepo:

```text
useAxiom/
├── apps/
│   ├── manager-dashboard/   # Next.js 14 App Router Frontend (Port 8000)
│   ├── backend-api/         # NestJS REST API Server (Port 3001)
│   └── background-workers/  # BullMQ & Redis Worker Queue Processors
├── packages/
│   ├── ai-core/             # AI Orchestrator & Execution Engines
│   ├── ai-providers/        # LLM Provider Adapters (OpenAI, Gemini, Mock)
│   ├── ai-memory/           # Conversation Memory Stores
│   ├── ui/                  # Shared React UI Component Library
│   ├── database/            # Prisma Schema & Database Models
│   └── types/               # Shared TypeScript Interfaces
```

---

## Quick Start Guide for Teammates

### 1. Prerequisites

Ensure you have the following installed on your machine:

- **Node.js**: v18.0.0 or higher
- **pnpm**: v8.0.0 or higher (`npm install -g pnpm`)

### 2. Installation

Clone the repository and install all dependencies:

```bash
git clone https://github.com/Shrinivas3070/Idiots.git
cd useAxiom
pnpm install
```

### 3. Build Shared Packages

Build internal workspace packages before running the development servers:

```bash
pnpm build
```

### 4. Start Development Server

Run the entire monorepo in development mode:

```bash
pnpm run dev
```

This starts:

- **Manager Dashboard**: `http://localhost:8000`
- **Backend API**: `http://localhost:3001/api/v1`

---

## Development & Verification Commands

- **Build Backend API**: `pnpm --filter backend-api build`
- **Build AI Providers**: `pnpm --filter @useaxiom/ai-providers build`
- **Type Check Frontend**: `cd apps/manager-dashboard && npx tsc --noEmit`
- **Format Code**: `pnpm run format`

---

## Git Workflow & Conventional Commits

All commit messages must follow Conventional Commits format (max header length: 100 characters):

```bash
git commit -m "feat(reminders): add manual phone number entry for reminders"
git commit -m "fix(api): fix missing imports in notifications controller"
```
