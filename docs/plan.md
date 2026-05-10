# Product plan: multi-wearable-tracker

**Agent:** Non-Technical Planning  
**Inputs:** `docs/brief.md`, `docs/business.md`, stakeholder clarifications (this session).  
**Rule:** No tech stack or implementation detail — product behavior, scope, and journeys only.

---

## 1. Feature list (MoSCoW + source)

| Feature | Priority | Source |
| --- | --- | --- |
| iOS-first mobile app (Android later per brief) | Must | brief |
| English-only UI and copy | Must | brief |
| Connect **Whoop** via OAuth | Must | brief, business |
| Connect **Garmin** via OAuth | Must | brief, business |
| **No Apple Health** (or other bridges) in v1 | Must | clarification |
| Hub views for **existing vendor/API metrics** only: recovery, strain-style workload, sleep, HRV (and related fields as available per integration) — **no new proprietary composite formulas in MVP** | Must | brief |
| Ingestion and UI updates that feel **continuous**: async pipelines, **not** requiring manual sync every normal use | Must | brief |
| **Start or add an activity**; choose **activity type**; **timer**; **average heart rate**; **heart-rate zone** presentation in a **Whoop-like** activity experience | Must | brief |
| **Per-activity** confidence: user can open an affordance for **metric explanation** plus a **confidence table broken out by wearable** | Must | brief, business |
| **Single logical workout when both devices recorded the same session** — one activity, **two differentiated device traces** on shared charts (e.g. color per device; **two line series** on one graph where applicable). **Two separate activity rows for the same real-world workout is treated as an error state** to be resolved, not accepted as final | Must | clarification |
| **Session reconciliation wizard** — guides the user (and/or system suggestions) so vendor sessions are **merged or linked into one** hub activity with **both device contributions** visible; prevents leaving the hub in a “duplicate workout” state | Must | clarification, business |
| **Internal** integration and mapping specification maintained as a **build/QA artifact** (what each integration exposes, field mapping, “not available” states) | Must | business, clarification (MVP requires disciplined mapping work; **not** the user-facing page below) |
| **User-facing** “what we show and why” / **field map** page in the app | Won’t (MVP) | clarification |
| **Same product capabilities** whether the user has **one** or **multiple** wearables connected (no separate degraded “single-device app”; empty or partial data handled in-context) | Must | brief, clarification |
| Recover from **OAuth / connection errors** and **re-authorize** without losing orientation | Should | implied from success metrics |
| **Manage connections**: disconnect or pause a source, clear messaging on impact to charts | Should | implied |
| Standalone **confidence rubric** page (plain language, **no** “accuracy rank” framing) | Could | business, clarification (not MVP) |
| **Data export** | Won’t (MVP) | clarification |
| **Delete-all** stub | Won’t (MVP) | clarification |
| Rich map/route **filters** (Strava-style exploration) | Won’t (early) | brief |
| **Streaks** | Won’t (early) | brief |
| **Coaching** programs | Won’t (early) | brief |
| **AI assistant** | Won’t (early) | brief |
| **Payments** / monetization mechanics | Won’t (early) | brief |

**MoSCoW counts:** Must **14**, Should **2**, Could **1**, Won’t **8** (MVP deferrals + brief early out-of-scope).

**Scoping note (resolved):** “Integration & mapping spec as product artifact” **Must** applies to **internal** specification discipline for MVP; **user-facing** field map is explicitly **out of MVP** per clarification.

---

## 2. User flows (Must + Should)

### Flow M1 — First launch → empty hub

1. User installs app and opens it for the first time.
2. User sees value-oriented onboarding that sets expectation: **one hub** for Whoop- and Garmin-class metrics; optional second device; English-only.
3. User grants any **OS-level permissions** required for the experience described in Technical Planning (product framing only: “needed to show your data”).
4. User lands on **hub** with **empty or partial state** (no sources yet, or incomplete) and a **primary call to connect a source**.

**Source:** brief.

---

### Flow M2 — Connect Whoop

1. From hub or settings, user chooses **Connect Whoop**.
2. User completes vendor **OAuth** in system / in-app browser as required.
3. On success, user sees **confirmation** and hub begins to populate with **Whoop-backed** metrics that the integration supports.
4. On failure, user sees **actionable error** and path to retry (without technical jargon).

**Source:** brief, business.

---

### Flow M3 — Connect Garmin (second source)

1. User already has at least one source or is adding Garmin first — **same flow** as M2 pattern for **Connect Garmin**.
2. After success, hub and activity surfaces reflect **both sources** where data exists, with **clear per-source attribution** on charts and tables where relevant.

**Source:** brief, business.

---

### Flow M4 — Daily hub consumption

1. User opens app to **hub** (recovery, strain-style workload, sleep, HRV slices as available).
2. Data **refreshes without** requiring a manual sync for every visit; user may still have an optional **explicit refresh** affordance.
3. User understands **when data was last updated** at a glance (non-alarmist copy).

**Source:** brief.

---

### Flow M5 — Start / log in-app activity (Whoop-like session)

1. User starts **new activity** (or adds one), selects **activity type**.
2. During the activity, user sees **timer**, **average heart rate** (as available), and **heart-rate zones** in a Whoop-like layout.
3. User ends activity; session appears in **activity list** and opens to **detail**.

**Source:** brief.

---

### Flow M6 — Activity detail with **one** connected device

1. User opens an activity recorded from **one** wearable (or only one source has samples for that session).
2. Charts and summaries use **one** primary series; **zones and averages** match brief.
3. **Per-activity confidence** affordance is available; table shows **one wearable row** where applicable.

**Source:** brief, clarification (single-device parity).

---

### Flow M7 — Activity detail with **two** devices on the **same real-world workout**

1. User opens an activity that is **one logical workout** fed by **Whoop and Garmin**.
2. User sees **shared charts** with **two differentiated traces** (e.g. **two line series**, **color per device** — product may standardize colors in design; example colors are illustrative only).
3. User does **not** see two separate hub rows for the same workout once reconciliation is complete.

**Source:** clarification.

---

### Flow M8 — Session reconciliation wizard

1. System detects **candidate duplicate** vendor sessions (same window, overlapping activity) **or** user reports “same run twice.”
2. Wizard presents **clear explanation**: goal is **one workout, both devices**, not two activities.
3. User confirms or adjusts **which sessions belong together** (exact controls are UX detail; outcome is **one** hub activity).
4. User lands on **merged** activity detail (Flow M7). If user cancels mid-flow, hub must not silently show **two accepted duplicates** as final — user sees **unresolved** state with path back to wizard or support path (copy-level only here).

**Source:** clarification, business.

---

### Flow M9 — Per-activity confidence

1. On activity detail, user taps **confidence / info** affordance.
2. User reads **metric explanation** and a **confidence-style table by wearable** using **plain, non-alarmist** language (no “accuracy rank” vs other people or medical ground truth).
3. User dismisses and returns to activity.

**Source:** brief, business.

---

### Flow S1 — Reconnect after auth / token problem

1. User sees **non-destructive banner or card**: connection needs attention.
2. User taps **Reconnect**, repeats shortened OAuth where needed.
3. Hub and activities **resume** without requiring the user to reason about tokens.

**Source:** Should (implied).

---

### Flow S2 — Disconnect a source

1. User opens **connections** or equivalent settings area.
2. User chooses **Disconnect** for Whoop or Garmin, confirms consequence (charts lose that source; historical handling per Technical Planning).
3. Hub updates; **single-device parity** preserved (Flow M6 patterns).

**Source:** Should (implied).

---

## 3. Edge cases (by flow)

### M1

- User skips or denies OS permissions — **degraded but honest** empty states; clear path to settings.
- User is **secondary audience** (one device eventual) — copy still matches “hub,” not “multi-only.”

### M2 / M3

- OAuth **cancelled** mid-flow — no partial “connected” state; retry available.
- **One vendor connected** — hub and flows still valid (**Must** parity).
- **Garmin before Whoop** — order-agnostic connect flows.
- Vendor returns **partial metrics** — show **N/A** or omit slice with explanation, not fabricated values.

### M4

- **Stale data** because vendor/API delay — messaging emphasizes **last synced**, not blame.
- **Conflicting day boundaries** (sleep spanning midnight) — hub shows **vendor-aligned** day per Technical Planning; product surfaces **one primary daily story** where possible without inventing formulas.

### M5

- **No HR stream** on a device for that session — timer and zones show **honest limits**; confidence may reflect gaps.
- User **backgrounds app** during activity — timer and UX must remain **understandable** when they return (exact behavior in design/tech).

### M6

- **Only Garmin** or **only Whoop** connected — no empty “second line” ghost UI.
- Metric **exists on one vendor only** — no synthetic blending in MVP.

### M7

- **One device dropped samples** mid-workout — second line may **gap**; legend and confidence explain.
- **Different start/end times** between vendors — alignment is **technical**; product shows **aligned window** or notes **offset** in copy if user-visible discrepancy remains.

### M8

- **False positive** duplicate detection — user can **reject** merge; system must not corrupt unrelated sessions.
- **Three** candidate sessions (e.g. duplicate vendor glitch) — wizard must allow **resolution to one** logical workout without dead-end.
- User **never completes** wizard but two rows exist — remains **error / attention** state, not normalized success.

### M9

- **Single wearable** — table still usable; avoid implying comparison to a missing second device.
- **Legal-sensitive phrasing** — avoid “medical accuracy,” “diagnosis,” “better body.”

### S1 / S2

- Disconnect **only** source — hub empty state with **reconnect** emphasis.
- Reconnect **changes** historical availability — user sees **brief** explanation if dates shift.

---

## 4. Out of scope confirmation (cross-check `docs/brief.md`)

From `docs/brief.md` **Out of Scope** (early phases): rich **filters**, **streaks**, **coaching**, **AI assistant**, **payments** — **confirmed** out of MVP product scope.

**Additional Won’t / deferred for MVP (this plan):**

- **Apple Health** or other non–Whoop/Garmin pipes in v1.
- **User-facing** “what we show and why” / **field map** page.
- **Standalone** confidence rubric page (Could / not MVP).
- **Data export** and **delete-all** stub.

---

## 5. Open questions

### Blocking

- **None** at plan time — prior blocking items were answered in conversation (integrations, reconciliation intent, Apple Health, field map, rubric page, export/delete).

### Non-blocking (for Technical Planning, Designer, PM)

- Exact **OAuth scopes** and per-field availability for Whoop vs Garmin (brief open question).
- **Time-alignment and dedupe algorithms** for merging vendor sessions (brief; **product** outcome fixed: one logical workout, dual traces).
- Whether **per-activity confidence** ships as **MVP** or fast-follow if integration risk spikes (brief flagged; business leaned **in** — treat as **default Must** unless PM formally pulls).
- **App Review** and **regional** health-data constraints despite “legal deprioritized” in business analysis — non-blocking for **this** doc but **high risk** for launch.
- **Color and legend standards** for dual-device charts (Designer).
- **Kill criteria** from business (e.g. dual-ingest reliability in private testing) — PM / Decision Log.

---

## 6. Decision log (repo mirror)

Major scoping outcomes from stakeholder clarification (full entry on Notion Decision Log):

- v1 **Whoop + Garmin only**; **no Apple Health**.
- **One logical workout** with **dual-device visualization**; duplicate rows as final state **unacceptable**; **reconciliation wizard** **Must**.
- **Internal** mapping spec **Must**; **user-facing** field map **not MVP**.
- **Standalone** rubric page **not MVP**; **Could** later.
- **Export / delete-all** **deferred** (Won’t MVP).
- **Single-device parity** — **Must**.

*Authoritative log:* Notion Decision Log page per PM workflow.
