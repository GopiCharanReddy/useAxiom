# GitHub Setup & Project Management

## Labels
Ensure the following labels exist in the GitHub repository:
- `domain: platform`, `domain: ai`, `domain: dashboard`, `domain: whatsapp`, `domain: backend`
- `priority: high`, `priority: medium`, `priority: low`
- `type: bug`, `type: feature`, `type: tech-debt`

## Milestones
Map GitHub Milestones directly to the Epics outlined in `sprint-plan.md` (e.g., "Epic 1: Platform Foundation").

## Branch Protection Rules
- Require at least 1 approving review on `main`.
- Require status checks to pass before merging (`Lint`, `Test`, `Build`).
- Disallow direct pushes to `main`.

## GitHub Projects Board
Setup an automated Kanban board with columns:
- `Todo`
- `In Progress`
- `In Review`
- `Done`
Link PRs to issues using closing keywords (e.g., `Closes #12`) to automatically move tickets to `Done`.
