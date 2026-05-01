---
name: code-writing
description: The full SWE implementation process. Read this when implementing a ticket (Code Writer) or verifying implementation was done correctly (Code Reviewer).
---

# Code Writing Process

## Step 1: Validate the Ticket
Before touching the codebase, check:
- Are all acceptance criteria specific and verifiable?
- Are all dependency tickets marked Done or Reviewed in Notion?
- Is there enough information to implement without guessing?

If acceptance criteria are vague → stop, tell the user exactly what is unclear.
If dependencies are incomplete → stop, list them, ask user to confirm.

## Step 2: Investigate the Codebase
Before writing any plan:
- Read the folder structure defined in `docs/tech-plan.md`
- Find and read every file relevant to this ticket
- Identify existing patterns, utilities, and conventions to follow
- Identify every file that will need to be created or modified

Never claim to know what's in a file without reading it.
Always use `context7` before referencing any library's API.

## Step 3: Present Implementation Plan
Before writing any code, present this to the user:

Implementation Plan: [Ticket ID] — [Title]
Files to create

path/to/file.ext — what it contains

Files to modify

path/to/file.ext — what changes and why

Approach
[2-4 sentences — data flow, patterns used, key decisions]
Key decisions

[decision]: [why this over alternatives]

Risks or concerns

[anything that needs extra care]

Proceed?
Wait for explicit approval. Do not write code until the user confirms.

## Step 4: Write the Code
After approval:
- Implement exactly what was approved — no scope creep
- Follow patterns found during investigation
- Follow stack and folder structure from `docs/tech-plan.md`
- Follow design system from `docs/design.md` for UI work
- Leave no TODOs, placeholders, or incomplete sections
- Every function and module must be complete and runnable

## Step 5: Smoke Tests
After implementation, write smoke tests:
- Happy path — does the feature work under normal conditions?
- Critical failure cases — does it fail gracefully without breaking anything?

Smoke tests only. Comprehensive test coverage is the Code Reviewer's responsibility.

## Step 6: Implementation Summary
After completing the code, present:
Done: [Ticket ID] — [Title]
What was built
[2-3 sentences]
Files changed

path/to/file.ext — what changed

Acceptance criteria

 [criterion] — how it was met
 [criterion] — how it was met

Smoke tests

 Happy path: [what was tested]
 Failure case: [what was tested]

Notes for Code Reviewer
[Anything the reviewer should pay attention to]
## Step 7: Hand Off

Tell the user to switch to the Code Reviewer agent for this ticket. Do not move to the next ticket until the current one is Reviewed in Notion.