# Product Proposal

**Status:** Current proposal aligned to the implemented app as of 2026-04-08

This document consolidates the previous FIT-only proposal and the Strava integration proposal into one up-to-date product direction.

---

## 1. Product goal

RunDecode helps runners turn workout data into editable Vietnamese AI analysis that is easy to review, copy, and sync to Strava.

The app now supports two complementary entry paths:

1. **Strava-first analysis** for fast activity selection and direct sync back to description
2. **Manual `.fit` analysis** as a reliable fallback for Zepp / Amazfit exports

---

## 2. Current MVP scope

### Included

- Strava authentication
- recent supported activity list
- per-activity AI analysis
- sync generated analysis back to Strava description
- manual `.fit` upload + parse preview + analysis
- editable plain-text output
- mobile-first UX

### Supported Strava activity types

- Run
- Walk
- Hike / Hiking
- Trail / TrailRun

### Explicitly out of scope in MVP

- Ride
- Swim
- Workout / gym sessions
- persistent user history database
- team / social / account systems

---

## 3. UX direction

### Primary route: `/`

The homepage should stay Strava-first.

Expected UX:

1. Connect Strava
2. Save/edit athlete profile
3. Fetch recent supported activities
4. Review activity card details
5. Run analysis for one selected activity
6. See analysis directly inside that card
7. Optionally sync analysis back to Strava description

### Fallback route: `/manual`

Expected UX:

1. Upload `.fit`
2. Preview metadata before AI call
3. Choose model
4. Run analysis
5. Edit/copy output

This split keeps the homepage focused while preserving the verification-first FIT workflow.

---

## 4. AI product strategy

### Provider choice

- OpenRouter
- Free-model allowlist maintained in code
- default model = first entry in `FREE_MODELS`

### Output strategy

- Vietnamese plain text only
- optimized for Strava description usage
- attribution preserved through prompt rules
- editable by user before reuse

### Prompt strategy

Prompt composition remains strict:

1. system prompt
2. structured data context
3. additional guardrails

This must stay stable across both FIT and Strava flows.

---

## 5. Data strategy

### FIT path

Use session + lap + derived metrics from parsed `.fit` files.

### Strava path

Use:

- athlete profile
- athlete stats
- recent monthly/weekly context
- selected activity summary
- selected activity streams-derived metrics

### Privacy boundary

Do not send:

- GPS traces
- raw device identifiers

to the AI provider.

---

## 6. Operational requirements

### Environment

- `OPENROUTER_API_KEY`
- `STRAVA_CLIENT_ID`
- `STRAVA_CLIENT_SECRET`
- `STRAVA_REDIRECT_URI`

### Build/runtime requirements

- stateless deployment
- no required database
- production build must stay green
- test suite must remain green

---

## 7. Acceptance criteria

The product direction is considered healthy when all of the following remain true:

- supported Strava activities load and filter correctly
- activity cards show metrics, local date/time, and current Strava description
- in-card AI analysis works
- sync-to-Strava-description works
- manual FIT preview-before-analyze flow works on `/manual`
- output stays plain text and editable
- `pnpm test` passes
- `pnpm build` passes

---

## 8. Product decisions currently locked in

| Area                | Current decision                     |
| ------------------- | ------------------------------------ |
| Homepage            | Strava-first                         |
| Manual FIT flow     | Separate `/manual` route             |
| AI provider         | OpenRouter                           |
| Activity scope      | Run / Walk / Hike / Trail only       |
| Sync-back to Strava | Yes, via activity description update |
| Storage             | Stateless, no DB required            |
| Output format       | Plain-text Vietnamese                |
| Mobile priority     | Yes                                  |

---

## 9. Near-term follow-up ideas

These are potential next steps, not current required scope:

- model fallback recommendation UI on 429
- inline editing for per-activity generated text before sync
- richer training load interpretation
- optional activity re-fetch after sync for stronger source-of-truth refresh

---

## 10. Documentation rule going forward

This file is now the single proposal source of truth.

Do not create a second proposal document for Strava or FIT flow changes. Update this file instead so the documentation set stays centralized in:

- `README.md`
- `docs/PROPOSAL.md`
- `docs/DEVELOPER.md`
- `docs/ARCHITECTURE.md`
- `docs/DESIGN.md`
- `docs/EFFECTIVE_PROMPTING_STITCH.md`
