# Effective Prompting for Google Stitch (RunDecode)

**Status:** Single source of truth for prompting Google Stitch redesign work in RunDecode.

This document defines how to write effective prompts so Google Stitch can redesign RunDecode without breaking product scope, UX rules, and privacy constraints.

---

## 1. Why this document exists

Use this file as the only canonical guide for Stitch redesign prompts.

Goals:

- keep redesign output aligned with RunDecode product intent
- preserve Strava-first and manual FIT flow behavior
- enforce mobile-first and accessibility-safe UI changes
- reduce prompt drift and one-off stylistic experiments

If prompt strategy changes, update this file instead of creating parallel prompt guides.

---

## 2. Non-negotiable product constraints

Every Stitch prompt must preserve these constraints:

1. **Primary UX routing**
   - `/` remains Strava-first.
   - `/manual` remains manual FIT fallback.

2. **Manual FIT flow order**
   - upload `.fit` -> parse preview -> verify metadata -> choose model -> analyze.
   - do not skip preview-before-analyze.

3. **MVP activity scope for Strava**
   - allowed: `Run`, `Walk`, `Hike/Hiking`, `Trail/TrailRun`.
   - do not expand to unsupported activity types.

4. **Output behavior**
   - analysis body remains plain text and editable.
   - copy/sync actions remain easy to access on mobile.

5. **Privacy and security**
   - never surface API keys/secrets in UI.
   - do not introduce UI that encourages sending raw GPS traces or device identifiers to AI.

6. **Design identity**
   - athletic + analytical, calm confidence, action-oriented, trustworthy.
   - dark-first readability and clear CTA hierarchy.

---

## 3. Prompt architecture (recommended structure)

Use the same 4-part structure in every redesign prompt.

### Part A — Objective

State what should change and why.

Template:

- Redesign target: `[screen/component]`
- Business intent: `[speed, clarity, trust, conversion]`
- User job-to-be-done: `[what user needs quickly]`

### Part B — Hard constraints

List immutable requirements from this repository.

Template:

- Keep route architecture and flow order unchanged.
- Keep primary action obvious.
- Keep mobile-first single-column defaults.
- Reuse existing primitives (`Card`, `Button`, `Input`, `Textarea`, `Badge`).
- Preserve loading/error/success states.

### Part C — Visual and interaction direction

Give style direction as outcomes, not pixel micromanagement.

Template:

- Tone: athletic + analytical, concise and practical copy.
- Hierarchy: one clear primary CTA per section.
- Information density: scannable in 3–5 seconds.
- Accessibility: keyboard path, visible focus, non-color-only status cues.

### Part D — Deliverable contract

Request outputs in implementation-friendly format.

Template:

- Provide: updated layout rationale, component map, state map, and responsive behavior notes.
- Include: loading/empty/error states.
- Include: before/after justification tied to constraints.
- Avoid: introducing new product flows unless explicitly requested.

---

## 4. High-quality prompt recipe

Use this recipe to craft a strong Stitch prompt.

1. Name exactly one redesign scope (page, section, or component).
2. Add user intent + current friction in one sentence.
3. Add non-negotiable constraints from section 2.
4. Add desired outcomes (clarity, speed, confidence, lower misclicks, etc.).
5. Ask for mobile-first and desktop expansion behavior.
6. Ask for explicit loading/error/success state treatment.
7. Ask for final output with rationale mapped to constraints.

---

## 5. Reusable prompt template

Copy and adapt this template for each Stitch redesign task:

```text
Redesign scope:
- [target page/component]

Context:
- RunDecode is a Next.js app for Strava-first running analysis with a manual FIT fallback.
- Primary route is `/` (Strava-first). Manual FIT flow is on `/manual`.

User problem to solve:
- [one concise friction statement]

Hard constraints (must keep):
- Keep `/` as Strava-first and `/manual` as manual FIT fallback.
- Keep manual FIT order: upload `.fit` -> parse preview -> verify metadata -> choose model -> analyze.
- Keep mobile-first, single-column default on narrow screens.
- Keep plain-text editable analysis output and easy copy action.
- Keep dark-first readability and strong CTA hierarchy.
- Reuse shared primitives and avoid ad-hoc style drift.
- Include explicit loading, success, and error states.

Design direction:
- Product tone: athletic + analytical, calm confidence, practical copy.
- Emphasize clarity, scanability, and thumb-friendly interactions.
- Do not add new product flows or unsupported activity types.

Deliverables:
- Proposed screen structure and component hierarchy.
- Interaction behavior for idle/loading/error/success.
- Responsive behavior (mobile first, desktop expansion).
- Short rationale mapping each major decision to the constraints above.
```

---

## 6. Screen-specific prompt add-ons

Use one add-on block depending on redesign target.

### 6.1 Homepage (`/`) — Strava-first

Add:

- prioritize Connect Strava and activity analysis path
- keep manual FIT entry visible but visually secondary
- activity cards must keep metrics, route context, analysis status, sync action

### 6.2 Manual page (`/manual`)

Add:

- make parse-preview state obvious before enabling analysis intent
- keep model selector grouped with analyze CTA
- maintain confidence-oriented validation messaging for `.fit` restriction

### 6.3 Analysis display

Add:

- keep plain text readable and editable
- keep copy and reset actions reachable on mobile
- metadata readable but secondary to analysis text

---

## 7. Prompt anti-patterns (avoid)

Do not:

- ask for “complete redesign” without constraints
- ask for style-only changes without UX/state requirements
- over-constrain with low-level CSS values too early
- request unsupported product expansion (e.g., ride/swim workflows)
- hide critical actions behind menus on mobile

---

## 8. Definition of done for Stitch redesign prompts

A prompt is ready when it clearly includes:

1. exact redesign scope
2. user problem
3. immutable product constraints
4. mobile-first behavior expectations
5. loading/error/success behavior requirements
6. output contract and rationale mapping

If any item is missing, refine the prompt before using Stitch.

---

## 9. Example prompts

### Example A — Improve homepage decision clarity

```text
Redesign the homepage (`/`) to make first-time user decisions faster.

Context: RunDecode is Strava-first. Users should immediately understand that the primary path is connecting Strava, while manual FIT upload remains a fallback on `/manual`.

Hard constraints:
- Keep route architecture unchanged.
- Keep activity analysis and sync workflow intact.
- Keep mobile-first single-column behavior by default.
- Maintain dark-first visual identity and accessibility.

Goals:
- Increase clarity of the first primary action.
- Improve scanability of activity cards and status states.
- Keep secondary manual path discoverable but less visually dominant.

Deliverables:
- New layout structure, component hierarchy, and CTA hierarchy.
- Explicit idle/loading/error/success state behavior.
- Responsive notes for narrow vs wide viewports.
- Rationale mapped to each hard constraint.
```

### Example B — Improve manual FIT confidence

```text
Redesign the manual FIT page (`/manual`) to improve confidence and reduce missteps before analysis.

Hard constraints:
- Accept `.fit` only and preserve parse-preview-before-analyze flow.
- Keep model selection near the analyze action.
- Keep plain-text editable analysis output after generation.
- Keep mobile-first behavior and thumb-friendly actions.

Goals:
- Make the current step obvious (upload, preview, ready-to-analyze).
- Make errors and validations highly actionable.
- Reduce visual clutter while preserving metadata verification.

Deliverables:
- Revised section hierarchy and interaction states.
- Error/loading/success pattern details.
- Mobile and desktop behavior notes.
- Brief rationale tied to constraints.
```

---

## 10. Governance

- This file is the **single source of truth** for Google Stitch prompting strategy in RunDecode.
- If team preferences change, update this document directly.
- Do not create alternative prompt-guideline files for the same purpose.
