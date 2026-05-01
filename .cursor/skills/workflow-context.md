---
name: workflow-context
description: Read this once at the start of every session. Contains the full agent roster, MCP tool names, Notion IDs, doc locations, and global rules for this project.
---

# Workflow Context

## What You Are
You are a Cursor Custom Agent operating inside a multi-agent software development workflow. This file orients you to the full system before you act.

## Agent Roster
| # | Agent | Output |
|---|---|---|
| 1 | Intake | docs/brief.md |
| 2 | PM | Notion: Project Status, Decision Log |
| 3 | Business Brainstorming | docs/business.md |
| 4 | Non-Technical Planning | docs/plan.md |
| 5 | Designer | docs/design.md |
| 6 | Technical Planning | docs/tech-plan.md |
| 7 | Scrum | Notion: Epics + Tickets |
| 8 | Code Writer | Code |
| 9 | Code Reviewer | Code + Notion ticket status |
| 10 | Deployment | docs/deploy.md |

Never act outside your defined agent scope.

## MCP Tools
| Tool | Use for |
|---|---|
| `personal-notion` | Tickets, Epics, Decision Log, Project Status |
| `personal-github` | Commits, PRs, branch management |
| `context7` | Live library docs — always use before referencing any library API |
| `vercel` | Deployments, env vars, build logs (Deployment agent only) |
| `sentry` | Error tracking (Deployment + Code Reviewer only) |
| `playwright` | E2E browser tests (Code Reviewer only) |

Never use work MCP names in personal projects. Only use MCP names listed above.

## Notion IDs
- Tickets database ID: `c65aa39b89ff4e8c84bc31f068ca5462`
- Tickets data source ID: `862d0adb-13e0-43d3-a56b-f2dc2bf4677b`
- Decision Log page ID: `353b0cf4-90ef-8110-8741-fee732e87ea4`
- Project Status page ID: `353b0cf4-90ef-81b1-96c5-cbc313652776`
- Project Workspace root page ID: `353b0cf4-90ef-8166-ba61-fb1ff0ee8dda`

## Docs Location
All planning docs live in the repo at `docs/`. Read them before acting.

| Doc | Produced by |
|---|---|
| docs/brief.md | Intake |
| docs/business.md | Business Brainstorming |
| docs/plan.md | Non-Technical Planning |
| docs/design.md | Designer |
| docs/tech-plan.md | Technical Planning |
| docs/deploy.md | Deployment |

Tickets, Epics, Decision Log, and Project Status live in Notion — never in markdown files.

## Global Rules
- Always read relevant docs before producing any output
- Always use `context7` before referencing any library's API
- Always use `personal-notion` for ticket operations — never write tickets to markdown
- Never act outside your defined agent scope
- Never make decisions on behalf of the user without asking first