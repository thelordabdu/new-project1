# Business analysis: multi-wearable-tracker

**Agent:** Business Brainstorming  
**Inputs:** `docs/brief.md` + stakeholder clarifications (integrations, confidence UX, MVP legal stance, monetization, wedge, team).  
**Tone:** Assumptions are stress-tested; unproven claims are flagged.

---

## Clarifications received (binding for this analysis)


| Topic                     | Answer                                                                                                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| v1 integrations           | **Whoop** and **Garmin**                                                                                                                |
| Confidence in MVP         | **Per activity**, per wearable: user taps an affordance (e.g. small icon) for **metric explanation** + **confidence table** by wearable |
| Legal/compliance (MVP v1) | **Explicitly deprioritized** — ship working product first                                                                               |
| Monetization              | **Undecided**; priority is execution                                                                                                    |
| Differentiation           | **Single hub** to compare wearables and understand relative “accuracy” / trust **without manufacturer framing**                         |
| Team                      | **Solo + AI**; runway excluded from scoring per stakeholder                                                                             |


---

## 1. Market size & demand

**Risk score: 7 / 10** (10 = severe risk)

- **Demand story (plausible but unproven):** Multi-wearable use is real among enthusiasts, yet **no evidence** was supplied for install intent, price sensitivity, or willingness to OAuth a third-party app to two vendors simultaneously.
- **Beachhead is narrow:** Primary audience is a **subset of a subset** (people with Whoop *and* Garmin-level engagement who also want a neutral hub). TAM is not quantified; treating “global English” as demand is a category error — it is **reach**, not pull-through.
- **Secondary audience** (single device + confidence) helps top-of-funnel only if confidence UX is credible; otherwise it collapses into “another health viewer.”

**Unproven until shipped:** conversion from “interesting demo” to weekly active hub.

---

## 2. Competition & differentiation

**Risk score: 8 / 10**

- **Incumbents you do not displace; you flank them:** Apple Health, Google Health Connect, and vendor apps already aggregate *some* signals and own trust, notifications, and OS hooks. Your wedge — **neutral comparison and confidence framing** — is the entire argument. If that reads as **amateur diagnostics** or **implied medical truth**, you lose instantly.
- **“Without manufacturer biases” is a positioning landmine:** It implies **objective ground truth** you almost certainly will not have without controlled validation. Competitors’ legal and UX teams will not ignore comparative claims; users may misread confidence tables as **rankings of medical accuracy**.
- **Aggregation APIs** (e.g. unified fitness backends) could out-feature you on connector breadth unless your UX is sharply better for **two-device reconciliation** and **session-level explainability**.

**Evidence gap:** no competitive matrix, no user interviews cited, no retention hypothesis beyond the brief.

---

## 3. Technical feasibility

**Risk score: 6 / 10**

- **Two integrations sounds minimal; it is not.** OAuth lifecycle, token refresh, background delivery, **time alignment**, **duplicate workouts** (vendor app + your in-app start), and **partial field availability** across Whoop vs Garmin are classic integration tar pits. The brief already flags dedupe rules as unknown — that is **core product integrity**, not polish.
- **“Whoop-class metrics without new formulas”** still requires **honest field mapping**: what exists per API vs what you must omit or relabel. Shipping wrong mappings destroys the “neutral hub” brand in one release.
- **Per-activity confidence table:** feasible as **heuristic + disclosure-heavy UX**, not as lab-grade inference. Solo + AI raises execution variance: one weak spec on confidence definitions becomes a trust bug.

**Mitigation that actually moves the needle:** integration matrix + reconciliation spec before UI polish.

---

## 4. Regulatory & legal risks

**Risk score: 9 / 10**

- Stakeholder stance: **MVP v1 ignores law/compliance** to ship faster. That does **not** reduce real-world exposure — it **concentrates** it into a cliff (store policy, vendor ToS, GDPR/UK GDPR if EU users appear, state privacy laws, **comparative accuracy claims**, potential medical-device misclassification in some jurisdictions).
- **Health data** + **comparative “confidence”** is the worst combination for “we will fix legal later.” A single misleading row in a confidence table is a **reputational and liability** event even if you never monetize.
- **Vendor dependency:** ToS changes, scope removals, or app-review questions can **kill distribution** faster than product quality saves you.

**Explicit debt:** “Ship first, legal later” is a **timeboxed strategy**, not absolution. Post-v1 you either budget counsel or shrink claims and geography.

---

## 5. Feature risk

**Risk score: 6 / 10**

- **MVP scope is ambitious for one builder:** ingest + hub + activity flow (timer, zones, avg HR) + **expandable per-metric education** + **multi-wearable confidence table** is multiple products stitched together.
- **Confidence UX** is high-touch: copy, edge cases (one device, conflicting HR, missing samples), and **non-alarmist** presentation (per handoff to Designer) must be nailed or the feature becomes **FUD**.
- **Out-of-scope list** (filters, streaks, coaching, AI, payments) is healthy — scope creep remains the killer if integrations slip.

---

## 6. Overall viability score

### Weighted risk inputs


| Dimension                     | Weight   | Risk (1–10) | Weighted contribution |
| ----------------------------- | -------- | ----------- | --------------------- |
| Market size & demand          | 20%      | 7           | 1.40                  |
| Competition & differentiation | 25%      | 8           | 2.00                  |
| Technical feasibility         | 25%      | 6           | 1.50                  |
| Regulatory & legal            | 15%      | 9           | 1.35                  |
| Feature risk                  | 15%      | 6           | 0.90                  |
| **Composite weighted risk**   | **100%** | —           | **7.15 / 10**         |


### Viability score (10 = strong go)

**Viability: 5.5 / 10**

**Justification (one paragraph):** The idea has a **clear emotional wedge** (neutral comparison across wearables) and a **focused v1 connector set** (Whoop + Garmin), which lowers breadth risk versus “integrate everything.” Differentiation is intellectually coherent but **legally and narratively fragile** if confidence is read as objective ranking. Technical work is **bounded but non-trivial** because reconciliation and mapping integrity are the product. Regulatory posture for MVP is **explicitly aggressive**; that caps upside in any serious distribution or partnership path until reversed. Net: **worth building as a learning and retention experiment**, not bankable as a scaled consumer business without later course correction on claims, geography, and compliance.

---

## 7. Feature opportunities (only from risk findings)


| Opportunity                                                                                                                      | Traces to risk                                                         | Impact | Effort     |
| -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------ | ---------- |
| **Integration & mapping spec as product artifact** (public-facing “what we show and why”)                                        | Technical: wrong mapping kills trust; Competition: neutral positioning | High   | Medium     |
| **Session reconciliation wizard** (detect double-recorded runs; user picks primary source rules)                                 | Technical: duplicate sessions                                          | High   | High       |
| **Confidence rubric page** — plain-language signals (sensor coverage, GPS vs optical, gaps) **without** “accuracy rank” language | Competition + Regulatory: implied medical / bias claims                | High   | Medium     |
| **“Single-device” mode** that still explains limits of one wearable                                                              | Market: secondary audience funnel                                      | Medium | Low        |
| **Data export / delete-all stub** even if legal is deferred                                                                      | Regulatory: future cliff mitigation                                    | Medium | Low–Medium |


---

## 8. Final recommendation

### Verdict: **PROCEED**

**Rationale:** Stakeholder constraints (two vendors, ship-first, solo+AI) point to a **disciplined MVP** that can validate the core hypothesis: users want a **comparison-native** activity and recovery view. Kill criteria should be explicit: if OAuth completion or **dual-ingest reliability** fails in private testing, **PIVOT** to single-vendor depth before public marketing.

### Next steps (3–5)

1. **Lock Whoop + Garmin API field map** for MVP metrics (include “not available” states).
2. **Write dedupe rules** for parallel vendor recording before building zone charts.
3. **Define confidence copy + rubric** with legal review queued immediately after first working build (even if not blocking v0).
4. **Ship to a tiny cohort** of real two-device users; measure connect-funnel completion and weekly return, not vanity installs.
5. **Decision checkpoint:** before App Store positioning, reassess **comparative claims** and **geography** — the current stance is a **launch ceiling**, not a permanent strategy.

---

## Decision log (repo mirror)

- **Verdict:** PROCEED  
- **Viability score:** 5.5 / 10  
- **Weighted composite risk:** 7.15 / 10

*Authoritative log entry:* Notion Decision Log (see PM workflow).