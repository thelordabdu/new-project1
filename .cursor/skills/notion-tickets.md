---
name: notion-tickets
description: How to create, read, and update Epics and tickets in Notion. Read this whenever you need to interact with the Notion tickets database.
---

# Notion Tickets

## IDs
- Tickets database ID: `c65aa39b89ff4e8c84bc31f068ca5462`
- Decision Log page ID: `353b0cf4-90ef-8110-8741-fee732e87ea4`
- Project Status page ID: `353b0cf4-90ef-81b1-96c5-cbc313652776`

Use `personal-notion` MCP for all operations.

## Ticket ID Format
- Epics: `PROJ-E001`, `PROJ-E002`, etc.
- Tickets: `PROJ-001`, `PROJ-002`, etc.
- Title always starts with a label: `[BE]`, `[FE]`, `[BE+FE]`, `[DB]`, `[API]`, `[INFRA]`, `[DESIGN]`, `[TEST]`, `[DEVOPS]`

## Field Reference
| Field | Type | Values |
|---|---|---|
| Title | text | `[LABEL] Ticket title` |
| Ticket ID | text | `PROJ-001` |
| Type | select | Epic, Story, Task, Bug |
| Status | select | Backlog, Todo, In Progress, In Review, Done, Needs Rework, Blocked, Reviewed |
| Milestone | select | Epic title |
| Complexity | select | S, M, L, XL |
| Labels | multi-select | [BE], [FE], [BE+FE], [DB], [API], [INFRA], [DESIGN], [TEST], [DEVOPS] |
| Epic | relation | links to parent Epic in same database |
| Dependencies | text | comma-separated ticket IDs |
| Narrative | text | "As [who], we want [what] so that [why]" |
| Acceptance Criteria | text | bullet list of verifiable conditions |
| Approach | text | technical approach, 2-4 sentences |
| Scope | text | in scope / out of scope |
| Notes | text | constraints, references, hints |

## Status Flow
Backlog → Todo → In Progress → In Review → Done
→ Needs Rework → In Progress
→ Blocked
→ Reviewed (after Code Reviewer approves)

## Creating an Epic
1. Create ticket with Type: Epic
2. Set Status: Backlog
3. Leave Epic relation empty (Epics have no parent)
4. Set Milestone to the Epic's own title

## Creating a Ticket
1. Create ticket with Type: Story, Task, or Bug
2. Link to parent Epic via the Epic relation field
3. Set Milestone to the parent Epic's title
4. Set all required fields — never leave Narrative, Acceptance Criteria, or Approach empty

## Updating Status
Use `personal-notion` to update the Status field of the ticket by its Ticket ID.

Trigger status updates when:
- Code Writer starts a ticket → In Progress
- Code Writer completes a ticket → Done
- Code Reviewer requests changes → Needs Rework
- Code Reviewer blocks → Blocked
- Code Reviewer approves → Reviewed
- All tickets in Epic reviewed → Epic status → Done