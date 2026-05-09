# Agent context: multi-wearable-tracker

> **Read this first.** This doc gives you everything you need to understand what we're building, where we are, and what the rules are. Don't make decisions that contradict this.

---

## What we're building

A **web app** (Next.js) that is a single hub for wearable metrics — Whoop and Garmin. The user connects both devices and sees their recovery, sleep, HRV, and workout data in one place with both device traces overlaid on the same charts.

This is a **solo + AI** build. Scope discipline is critical.

### The core idea in one sentence
> Connect Whoop + Garmin over BLE, collect raw sensor data, run our own metric algorithms, validate against Whoop's API, and progressively replace their numbers with ours.

---

## The two-layer architecture (read this carefully)

This is not an API wrapper. There are two systems running simultaneously:

**Layer 1 — Display (what users see):**
- Phase 1: Whoop API data. Familiar numbers, fast to ship.
- Phase 2+: Our computed metrics, once validated.

**Layer 2 — Learning (hidden from users):**
- Raw R-R intervals + accelerometer + SpO2 from BLE
- Our own algorithms compute HRV, recovery, strain, sleep
- Comparator diffs our output vs Whoop API output every day
- When we match Whoop within 5% for 14 consecutive days → auto-flag for admin review
- Admin approves → our metrics become primary. Whoop data moves to hidden DB column.
- Whoop data still ingested forever for ongoing validation. Never shown to users again.

The Whoop API is **training data**, not the product.

---

## Tech stack (decided)

| Layer | Choice |
|---|---|
| Framework | Next.js 14, App Router, TypeScript |
| Database | Supabase (hosted Postgres) |
| Auth | Supabase Auth — magic link |
| ORM | Prisma |
| Styling | Tailwind CSS |
| Deployment | Vercel |
| BLE | Web Bluetooth API (web MVP) |
| Signal processing | Custom TypeScript |
| GPS | Browser Geolocation API (web) / Core Location (iOS later) |

---

## Version map

### v0 — BLE proof of concept (NOW)
Connect to Whoop or Garmin over BLE. Capture R-R intervals. Log to console.  
No UI. No DB. No auth. No API.  
**Success = R-R interval stream in your terminal.**  
See `docs/v0/data-collection.md`.

### v0.1 — Signal processing
Filter artifacts. Compute RMSSD (HRV). Compare manually to what Whoop app shows.  
**Success = our HRV number is close to Whoop's.**

### v0.2 — Whoop API + comparator
Connect Whoop OAuth. Pull API data. Store both. Run nightly diff.

### v0.3–v0.5 — Storage + hub UI
Supabase schema. Hub page showing Whoop API metrics. Metric selection.

### v0.6–v0.9 — Workout view, GPS, migration system
Dual-trace workout view. Phone GPS overlay. Threshold detection + admin approval.

### v1.0 — Full MVP
All flows per `docs/plan.md`.

---

## Hard rules for the code agent

1. **Store raw, derive on read.** Never store a computed metric as source of truth. Keep raw R-R intervals, raw API responses.
2. **Never blend metrics from two providers.** Label everything by source.
3. **One workout, multiple device traces.** No merge concept. No reconciliation wizard. Both device traces attach to one workout row.
4. **Whoop API v2 only.** v1 is deprecated, removed October 2025.
5. **Never expose both `api_*` and `our_*` fields in the same client response.** The user only ever sees one source at a time, determined by `profiles.algo_phase`.
6. **Admin-only migration approval.** No user can trigger or see the migration. It's a DB-level flag + admin endpoint.
7. **GPS comes from the phone, not the wearable.** Whoop has no GPS. We use browser/device GPS and overlay it on BLE HR data.
8. **English only.** No i18n.

---

## What's out of scope for the entire project

- Apple Health (v1: Whoop + Garmin only)
- Garmin API (v1: Whoop API only — Garmin comes from BLE)
- Streaks, coaching, AI assistant, payments
- Route/map filters
- Data export
- User-facing "what we show and why" page

---

## Full docs index

| Doc | What it covers |
|---|---|
| `docs/brief.md` | Product brief, audience, value prop, success metrics |
| `docs/business.md` | Business analysis, viability score, risks |
| `docs/plan.md` | Full product plan, user flows, edge cases, MoSCoW |
| `docs/tech-plan.md` | Full technical architecture — read before writing any product code |
| `docs/algo-strategy.md` | Algorithm learning pipeline, migration logic, threshold definition |
| `docs/v0/data-collection.md` | v0 execution plan — BLE connection + R-R capture |
