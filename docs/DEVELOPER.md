# Developer Guide

## 1. Prerequisites

- Node.js `>=20 <23`
- pnpm
- OpenRouter API key
- Strava app credentials (for Strava-first flow)

Required environment variables:

```env
OPENROUTER_API_KEY=your_openrouter_key
STRAVA_CLIENT_ID=your_strava_client_id
STRAVA_CLIENT_SECRET=your_strava_client_secret
STRAVA_REDIRECT_URI=http://localhost:3000/api/strava/callback
```

---

## 2. Local development

Install dependencies:

```bash
pnpm install
```

Run locally:

```bash
pnpm dev
```

Run tests:

```bash
pnpm test
```

Build production bundle:

```bash
pnpm build
```

---

## 3. Product flows you must preserve

### A. Strava-first flow (`/`)

1. User authenticates with Strava
2. App fetches recent supported activities only
3. User selects an activity card
4. App fetches streams and analyzes that activity
5. Analysis appears in-card
6. User may sync the generated analysis to Strava description

### B. Manual FIT flow (`/manual`)

1. User uploads `.fit`
2. App calls `POST /api/parse-fit`
3. UI shows metadata preview
4. User chooses model
5. User clicks **Analyze Run**
6. App calls `POST /api/analyze-fit`

Do not remove preview-before-analyze from the FIT path.

---

## 4. Activity scope rules (MVP)

Strava activity allowlist must stay limited to:

- `Run`
- `Walk`
- `Hike` / `Hiking`
- `Trail` / `TrailRun`

Do not show/analyze unsupported types like:

- Ride
- Swim
- Workout
- gym/cross-training activities

The filtering logic currently lives in `lib/stravaContextBuilder.ts` and is reused by `app/api/strava/activities/route.ts`.

---

## 5. Prompt and output rules

### Source of truth

- system prompt: `src/prompts/runAnalysisSystemPrompt.ts`
- prompt assembly: `lib/buildPromptContext.ts`

### Order contract

Always keep:

1. system prompt
2. structured context
3. additional guardrails

### Output contract

- structured JSON internal response
- plain text report (Vietnamese)
- attribution preserved
- includes intensity, recovery, and coaching insights
- suitable for Strava description

---

## 6. AI model rules

Model list lives in `lib/aiAnalyzer.ts` → `FREE_MODELS`.

When changing models:

- update `FREE_MODELS`
- remember the first entry becomes default
- keep UI dropdown aligned
- keep request validation aligned
- update tests if response contract or expectations change

---

## 7. Validation rules you must keep

### FIT upload validation

Apply to both parse and analyze FIT routes:

- extension `.fit`
- MIME allowlist
- FIT signature marker
- size `<= 4MB`

### Strava sync rules

- description sync must remain server-side via proxy route
- never expose `STRAVA_CLIENT_SECRET` client-side

---

## 8. Toast and error UX

Current toast system: `react-hot-toast`

Rules:

- use `toast.success(...)` for success confirmations
- use `toast.error(...)` when API returns a known error response
- preserve the actual backend error message whenever possible
- keep `analysisStore.error` aligned where existing UI still depends on it

---

## 9. High-value edit map

- AI gateway: `lib/aiAnalyzer.ts`
- Prompt builder: `lib/buildPromptContext.ts`
- System prompt: `src/prompts/runAnalysisSystemPrompt.ts`
- FIT parse/validate: `lib/fitParser.ts`, `lib/fitUploadValidation.ts`
- Strava auth: `lib/stravaAuth.ts`
- Strava context/filtering: `lib/stravaContextBuilder.ts`
- Strava extraction: `lib/stravaActivityExtractor.ts`
- Strava UI orchestration: `components/StravaPanel.tsx`
- Manual FIT UI: `components/FitUploadPanel.tsx`
- Activity card UX: `components/ActivityCard.tsx`

---

## 10. Testing expectations

Before merging any meaningful change:

```bash
pnpm test
pnpm build
```

Important test files include:

- `tests/api-analyze-fit-route.test.ts`
- `tests/api-analyze-strava-route.test.ts`
- `tests/api-strava-routes.test.ts`
- `tests/prompt-context.test.ts`
- `tests/strava-helpers.test.ts`
- `tests/page-upload.test.tsx`
- `tests/activity-card.test.tsx`

---

## 11. Documentation policy

Primary docs are:

- `README.md`
- `docs/PROPOSAL.md`
- `docs/DEVELOPER.md`
- `docs/ARCHITECTURE.md`
- `docs/DESIGN.md`
- `docs/EFFECTIVE_PROMPTING_STITCH.md`

If a product/process change is significant, update these docs instead of creating new proposal variants.
