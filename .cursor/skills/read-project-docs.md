---
name: read-project-docs
description: How to read the docs/ folder. Read this when you need to know which docs exist, what order to read them, and what to do if one is missing.
---

# Read Project Docs

## Doc Reading Order
Always read docs in this order — each doc builds on the previous:

1. `docs/brief.md` — project idea, target user, value prop, scope
2. `docs/business.md` — risk analysis, viability, feature opportunities
3. `docs/plan.md` — features (MoSCoW), user flows, edge cases
4. `docs/design.md` — screens, components, design system
5. `docs/tech-plan.md` — stack, architecture, data models, API, folder structure
6. `docs/deploy.md` — hosting, CI/CD, env vars, launch checklist

Only read the docs relevant to your task. Not every agent needs every doc.

## What To Do If a Doc Is Missing
| Missing doc | Action |
|---|---|
| docs/brief.md | Stop. Tell the user to run the Intake agent first. |
| docs/business.md | Warn the user. Ask if they want to proceed without it. |
| docs/plan.md | Stop. Tell the user to run Non-Technical Planning first. |
| docs/design.md | Warn the user. Ask if they want to proceed without it. |
| docs/tech-plan.md | Stop. Tell the user to run Technical Planning first. |
| docs/deploy.md | Only relevant for Deployment agent. |

## What Each Doc Contains
- `brief.md` — problem statement, target user, value prop, assumptions, open questions, success metrics, out of scope
- `business.md` — risk scores per area, viability score, feature opportunities, verdict (proceed/pivot/kill)
- `plan.md` — full feature list with MoSCoW priority, user flows per feature, edge cases, open questions
- `design.md` — design system (colors, typography, spacing), screen inventory, component inventory, UX issues
- `tech-plan.md` — stack, architecture diagram (Mermaid), data models, API surface, folder structure, integrations, security, dev setup, testing strategy, risk flags
- `deploy.md` — hosting setup, env vars, CI/CD config, domain, database provisioning, monitoring, launch checklist