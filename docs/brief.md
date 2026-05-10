# Project brief: multi-wearable-tracker

## Intake session answers (reference)

Stakeholder answers captured during intake; these inform every section below.


| #   | Topic                               | Decision                                                                                                                                                                                                                                                                                                                                                                                        |
| --- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Audience**                        | Primary: **multi-wearable enthusiasts**. Secondary: users with **one** wearable may still connect it to view **wearable-specific confidence** on activity (and metrics), even without a second device.                                                                                                                                                                                          |
| 2   | **Locale**                          | **Global** reach; **English-only** copy and UI.                                                                                                                                                                                                                                                                                                                                                 |
| 3   | **Platform**                        | **Mobile app**, **iOS first**, then Android.                                                                                                                                                                                                                                                                                                                                                    |
| 4   | **MVP metrics / formulas**          | **No new proprietary formulas in MVP.** Ship **Whoop-app-class metrics** that already exist from integrations (recovery, strain-style workload, sleep, HRV, etc.)—the objective is **one hub** with familiar numbers; wearing mostly one band is fine, with an **optional second (or more) device** when desired. **Post-MVP:** additional formulas may be considered once ingestion is stable. |
| 5   | **v1 success**                      | **Correctly** ingest and reconcile data **across wearables**; experience is **fast** and **asynchronous**; users should **not need to manually sync every time**; updates should feel **real-time** (within normal OS and API limits).                                                                                                                                                          |
| 6   | **Explicitly out of scope (early)** | Rich **filters**, **streaks**, **coaching**, **AI assistant**, **payments**.                                                                                                                                                                                                                                                                                                                    |
| 7   | **Slug**                            | `multi-wearable-tracker`                                                                                                                                                                                                                                                                                                                                                                        |


**Additional scope from idea refinement (same session):** Users should be able to **start or add an activity**, choose **activity type**, see a **timer**, **average heart rate**, and **heart-rate zone** mapping in a **Whoop-like** activity experience. **Confidence** per metric (or session)—reflecting wearable capability and context—is desired; **technical feasibility** of confidence in MVP is an open question for Technical Planning.

## Problem Statement

People who use more than one wearable (for example a recovery-focused band and a GPS-capable sports watch) must juggle vendor-specific apps. Native apps typically optimize for one device, so recovery signals and workout detail live in separate places and do not compose into one trustworthy daily story. Users want a **single hub** that reflects familiar recovery and activity metrics in one place, optionally blending sources when multiple devices are connected.

## Target User / Audience

- **Primary:** Multi-wearable enthusiasts who want one consolidated view of recovery and activity-oriented metrics across connected devices.
- **Secondary:** Users with **one** connected wearable who still want a unified place to view vendor-aligned metrics and understand **how reliable** those readings are for a given activity or metric (single-device “confidence” context).
- **Locale:** Global audience; **English-only** product copy and UX for the foreseeable scope.

## Core Value Proposition

A **mobile-first** application (**iOS first**, then Android) that acts as **one hub** for wearable-backed metrics users already associate with leading recovery-focused apps (for example recovery, strain-style workload, sleep, HRV where available): connect multiple wearables when desired, see aligned charts and live-style activity views, **start or log an activity** with activity type, **timer**, **average heart rate**, and **heart-rate zone** presentation comparable to reference UX—without inventing new proprietary composite scores during MVP. Data should feel **continuous**: aggregated **correctly** from each source, **responsive**, and **asynchronous** so users are not forced into constant manual sync.

## Assumptions

- MVP focuses on **Whoop-app-class metrics that already exist** from vendors/APIs (recovery, strain-style workload, sleep, HRV, etc.)—**no new proprietary formulas in MVP**; **post-MVP** may introduce additional composite metrics once ingestion and trust UX are stable.
- Users accept that **vendor APIs, OAuth flows, and platform policies** dictate what raw data and derived fields are available; not every “Whoop-like” number may be reproducible one-to-one from every brand.
- **Confidence indicators** (per metric or per session) are **desirable** but may be implemented as **transparent heuristics** (device class, sensor completeness, workout type, signal quality) rather than lab-grade certainty—feasibility and legal framing belong to Technical Planning and legal review.
- **Real-time** is interpreted as **near-real-time**: background refresh and timely UI updates when new samples arrive, subject to OS background limits and partner rate limits.

## Open Questions / Unknowns

- Which **exact** integrations and OAuth scopes are achievable for iOS v1 (Whoop, Garmin, Apple Health as hub, etc.) and which metrics map cleanly vs. require approximation or omission.
- Whether **per-metric confidence** can be shipped in MVP or deferred to a fast-follow once baseline ingestion works.
- How **activity start** on-device interacts with **parallel recording** on native vendor apps (duplicate sessions, deduplication rules).
- **Privacy and compliance** (health data retention, regional rules) for a global English-first launch.

## Success Metrics

- **Correct multi-source ingestion:** **Correctly** pull and reconcile data from **different wearables** (device identity, time alignment, no systematic loss for supported integrations).
- **Performance and UX:** App feels **fast**; pipelines are **async**; users **do not need to manually sync every time** for normal daily use; updates feel **real-time** (see assumptions on platform limits).
- **Adoption signal (directional):** Users with multiple devices complete connection of a second source without abandoning the flow at disproportionate rates (exact thresholds set with PM once instrumentation exists).

## Out of Scope

For early phases (explicitly **not** MVP unless pulled in by a later planning pass):

- **Cool filters** (rich map/route filters à la Strava-style exploration).
- **Streaks** as a gamification layer.
- **Coaching** programs.
- **AI assistant**.
- **Payments** / monetization mechanics.

## Project Type (confirmed)

**Consumer mobile application:** native **iOS first**, then **Android**, with English-only UI.

**Project slug:** `multi-wearable-tracker`

## Handoff Notes


| Downstream agent           | Note                                                                                                                                                |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PM**                     | Track Decision Log and Project Status; translate success metrics into measurable KPIs and milestones.                                               |
| **Business Brainstorming** | Stress-test viability of confidence scoring, partner dependency risk, and differentiation vs. single-vendor apps.                                   |
| **Non-Technical Planning** | Turn brief into user journeys: onboarding, multi-device connection, activity flow, single-device confidence UX; define MVP feature cuts.            |
| **Designer**               | iOS-first patterns for recovery dashboards, live activity/timer + HR zones, optional confidence treatment without alarmist UX.                      |
| **Technical Planning**     | Integration matrix (APIs, HealthKit, dedupe), sync architecture, definition of “existing metrics” per source, feasibility of confidence heuristics. |
| **Scrum**                  | Epic boundaries: ingest + hub UI first; activity session UX + zones second wave; confidence as stretch or phase-2.                                  |
| **Code Writer**            | Implement against `docs/tech-plan.md` after it exists; no stack choices from this brief alone.                                                      |
| **Code Reviewer**          | Pay attention to health-data handling and integration correctness.                                                                                  |
| **Deployment**             | Mobile release tracks (TestFlight, Play), secrets for OAuth clients, environment separation when backends exist.                                    |
