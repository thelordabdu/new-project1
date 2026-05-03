---
name: git-conventions
description: Git branch naming, commit message format, and merge strategy for this project. Read this whenever creating a branch, writing a commit, or merging.
---

# Git Conventions

## Branch Hierarchy
main
└── epic/PROJ-E001-epic-name        ← one per Epic
├── feat/PROJ-001/short-desc    ← one per feature ticket
└── fix/PROJ-002/short-desc     ← one per bug ticket

- Every Epic gets its own branch off `main`
- Every ticket gets its own branch off its Epic branch
- Never branch a ticket directly off `main`

## Branch Naming

### Epic branches
epic/PROJ-E001-epic-name
- lowercase kebab-case
- Epic ID + short Epic name
- Example: `epic/PROJ-E001-user-auth`

### Ticket branches
feat/PROJ-001/short-description
fix/PROJ-002/short-description
- `feat/` for Story and Task tickets
- `fix/` for Bug tickets
- Ticket ID + 2-4 word description in kebab-case
- Example: `feat/PROJ-001/jwt-token-generation`
- Example: `fix/PROJ-007/refresh-token-expiry`

## Commit Message Format
one line summary (PROJ-001)

what changed and why
what changed and why
any side effects or notes


Rules:
- First line: max 72 characters, plain English, ticket ID in brackets at the end
- Blank line between summary and bullets
- Bullets: short, concrete, present tense
- No emojis, no vague messages like "fix stuff" or "wip"

Examples:
add JWT token generation and refresh logic (PROJ-001)

generate access token on login with 15min expiry
generate refresh token with 7d expiry stored in httpOnly cookie
expose POST /auth/refresh endpoint to rotate tokens


fix refresh token expiry check returning wrong status (PROJ-007)

expiry was compared against local time instead of UTC
updated validateToken() to use Date.now() consistently
affects login flow only, no DB changes


## Merge Strategy

### Ticket → Epic branch
- Merge directly, keep all commits
- PR title: `[PROJ-001] one line summary`
- No squash

### Epic branch → main
- Squash merge — one clean commit per Epic
- Squash commit message format:
[PROJ-E001] epic name — summary of what was built

ticket PROJ-001: what it did
ticket PROJ-002: what it did
ticket PROJ-003: what it did

- Delete Epic branch after merge

## PR Rules
- One PR per ticket (ticket branch → Epic branch)
- One PR per Epic (Epic branch → main) after all tickets Reviewed
- PR title must include ticket ID
- PR description must list acceptance criteria from the Notion ticket
- Never merge a ticket PR if Code Reviewer verdict is not Approved

## Code Writer Responsibilities
When starting a ticket:
1. Pull latest Epic branch
2. Create ticket branch off Epic branch
3. Work only on that branch

When done:
1. Commit with correct format
2. Push ticket branch
3. Open PR to Epic branch
4. Tell user to switch to Code Reviewer

## Code Reviewer Responsibilities
After approving a ticket:
1. Approve the PR
2. Merge ticket branch into Epic branch
3. Delete ticket branch
4. Tell Scrum agent to update Notion status to Reviewed

When all tickets in Epic are Reviewed:
1. Open PR from Epic branch to main
2. Squash merge with correct commit message
3. Delete Epic branch
4. Tell Scrum agent to mark Epic as Done

## Branch Protection
- `main` — requires PR, linear history, conversation resolution, no bypass
- `epic/*` — requires PR, conversation resolution, deletions allowed
- Never push directly to main or epic branches
- All merges go through PRs only