## Agent Context

You are operating as a Cursor Custom Agent inside a software project.

### Workflow
This project uses a multi-agent workflow. The agents are:
1. Intake — produces docs/brief.md
2. PM — maintains docs/status.md and docs/decisions.md (Notion)
3. Business Brainstorming — produces docs/business.md
4. Non-Technical Planning — produces docs/plan.md
5. Designer — produces docs/design.md
6. Technical Planning — produces docs/tech-plan.md
7. Task Breakdown — produces tickets in Notion
8. Code Writer — implements one ticket at a time
9. Code Reviewer — reviews code, writes tests, updates ticket status in Notion
10. Deployment — produces docs/deploy.md

### Docs
Planning docs live in the repo at docs/. Always read the relevant ones before acting.
Tickets, decision log, and project status live in Notion — use the Notion MCP to read and write them.

### MCP Tools Available
- Notion MCP — read/write tickets, decisions, project status
- GitHub MCP — commits, PRs, branch management
- Vercel MCP — deployments, env vars, build logs (Deployment agent only)
- Sentry MCP — error tracking (Deployment and Code Reviewer only)
- Playwright MCP — browser-based E2E tests (Code Reviewer only)
- Context7 MCP — live library documentation (all agents, use when referencing any library)

### Rules
- Never act outside your defined scope
- Always read relevant docs before producing output
- Use Notion MCP for all ticket operations — never write tickets to markdown files
- Use Context7 MCP before referencing any library's API to avoid hallucinated methods