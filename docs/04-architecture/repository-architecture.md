# Repository Architecture: useAxiom

## 1. Monorepo Strategy
**Recommendation:** `pnpm` workspaces + `Turborepo`
**Justification:** Provides strict dependency isolation and fast, cached builds across the complex Next.js, NestJS, and AI domains.

## 2. Complete Folder Structure
```text
useAxiom/
├── apps/
│   ├── manager-dashboard/   # Next.js SPA
│   ├── backend-api/         # NestJS Core API
│   └── background-workers/  # Node.js/BullMQ Background Tasks
├── packages/
│   ├── ui/                  # Shared React components (Tailwind)
│   ├── types/               # Shared TypeScript interfaces
│   ├── config/              # Shared configs (ESLint, TSConfig)
│   ├── utils/               # Shared helpers
│   ├── ai-core/             # AI Orchestrator & base logic
│   ├── ai-providers/        # OpenAI/Gemini SDK abstractions
│   ├── ai-tools/            # Tool definitions (JSON schema)
│   └── ai-memory/           # Short/Long term context & RAG handlers
├── docs/
│   ├── 01-product/          
│   ├── ...
├── infra/                   # Docker, K8s, Terraform
├── scripts/                 # Local dev tools
├── .github/                 # CI/CD and Issue Templates
├── package.json             
├── pnpm-workspace.yaml      
└── turbo.json               
```

## 3. Package Ownership
- `apps/backend-api`: Dev 2 + Dev 5
- `apps/manager-dashboard`: Dev 3
- `packages/ai-*`: Dev 1
- `packages/types`, `config`, `utils`: Dev 2
- `packages/ui`: Dev 3
