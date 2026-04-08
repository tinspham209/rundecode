# Architecture

## 1. System overview

RunDecode is a stateless Next.js 14 application that supports two analysis entry points:

1. **Strava-first flow** on `/`
2. **Manual FIT flow** on `/manual`

Both flows converge into the same AI generation strategy:

1. build system prompt
2. build structured context
3. append additional guardrails
4. call OpenRouter
5. render editable plain-text analysis

---

## 2. Runtime topology

```text
[Browser]
  ├─ StravaPanel on /
  │   ├─ OAuth bootstrap
  │   ├─ Fetch recent supported activities
  │   ├─ Fetch streams for selected activity
  │   ├─ Analyze selected activity
  │   └─ Sync analysis back to Strava description
  │
  └─ FitUploadPanel on /manual
      ├─ Upload .fit
      ├─ Parse preview first
      ├─ Verify metadata
      └─ Analyze using selected model

                ↓

[Next.js Route Handlers]
  ├─ /api/parse-fit
  ├─ /api/analyze-fit
  ├─ /api/analyze-strava
  └─ /api/strava/* proxy routes

                ↓

[OpenRouter]
  └─ chat.send(chatRequest)
```

---

## 3. Frontend architecture

### `app/page.tsx`

- Presents the Strava-first experience
- Renders `StravaPanel`
- Links to `/manual` for FIT upload fallback

### `app/manual/page.tsx`

- Dedicated manual FIT analysis page
- Renders `FitUploadPanel`

### Major UI components

- `StravaPanel.tsx`
  - OAuth bootstrap from search params
  - fetch activities + stats
  - per-activity analysis trigger
  - description sync trigger
  - profile form and toast feedback

- `FitUploadPanel.tsx`
  - `.fit` upload
  - preview-before-analyze UX
  - manual model selection

- `ActivityCard.tsx`
  - local wall-clock datetime formatting
  - route map when polyline exists
  - metrics grid
  - current Strava description
  - in-card AI analysis slot

- `AnalysisDisplay.tsx`
  - editable plain-text report
  - copy action
  - reset flow for manual FIT path

---

## 4. State architecture

### `stores/analysisStore.ts`

Global analysis UI state:

- `analysis`
- `metadata`
- `loading`
- `error`
- `selectedModel`

### `stores/authStore.ts`

Strava auth/session state:

- `athlete`
- `accessToken`
- `refreshToken`
- `expiresAt`
- `isAuthenticated`

### `stores/profileStore.ts`

Athlete profile and stats:

- manual profile fields
- HR zones
- Strava athlete stats

### `stores/stravaStore.ts`

Strava activity workflow state:

- filtered activities list
- monthly / weekly context
- selected activity
- extracted activity data
- per-activity analysis cache
- per-activity sync status

---

## 5. Backend architecture

### FIT path

#### `lib/fitUploadValidation.ts`

Validates:

- `.fit` extension
- MIME allowlist
- FIT signature bytes
- size limit `<= 4MB`

#### `lib/fitParser.ts`

Extracts and normalizes:

- session summary
- laps
- derived metrics

#### `app/api/parse-fit/route.ts`

- validate upload
- parse FIT
- return preview metadata only

#### `app/api/analyze-fit/route.ts`

- validate upload
- parse FIT
- build prompt segments
- call AI
- return normalized analysis envelope

### Strava path

#### `lib/stravaAuth.ts`

- OAuth URL building
- session bootstrap parsing
- token refresh threshold logic

#### `app/api/strava/*`

Proxy layer for:

- auth bootstrap
- token refresh
- activities list
- activity streams
- athlete stats
- activity description update

#### `lib/stravaContextBuilder.ts`

- builds monthly / weekly summaries
- applies MVP activity allowlist
- only includes supported activity types:
  - Run
  - Walk
  - Hike / Hiking
  - Trail / TrailRun

#### `lib/stravaActivityExtractor.ts`

- converts Strava activity + streams into normalized session/derived metrics

#### `app/api/analyze-strava/route.ts`

- accepts structured sanitized Strava payload
- builds Strava prompt segments
- reuses same AI gateway pattern as FIT flow

---

## 6. Prompt architecture

Prompt assembly lives in `lib/buildPromptContext.ts` and must preserve this order:

1. system prompt
2. structured context
3. additional guardrails

There are two entry builders:

- `buildPromptSegments(parsedFit, profile?)`
- `buildStravaPromptSegments({ ... })`

Dynamic runner profile values are sourced from the athlete profile form and merged into the system prompt via `buildRunAnalysisSystemPrompt(...)`.

---

## 7. AI integration

### `lib/aiAnalyzer.ts`

- provider: OpenRouter SDK
- default model: first entry of `FREE_MODELS`
- runtime-selected model supported
- retry once on rate-limit style errors
- returns normalized `{ analysis, tokensUsed, model }`

Current analysis output requirement:

- plain text only
- Vietnamese
- attribution header preserved per prompt rules

---

## 8. Error model

### FIT routes

- `400` invalid payload/file/signature
- `413` file too large
- `422` parse validation failure
- `429` provider rate limit
- `500` fallback error

### Strava routes

- `400` invalid query/payload
- `401` missing/invalid bearer token
- `403` insufficient permission from upstream
- `404` activity not found upstream
- `429` upstream or provider rate limit
- `500` unexpected proxy error

### Client-side UX

- react-hot-toast for success/error toasts
- `analysisStore.error` still stores the latest error message for component rendering paths

---

## 9. Privacy boundaries

- no raw GPS traces to AI
- no raw device identifiers to AI
- Strava secrets remain server-only
- app is stateless; no database required

---

## 10. Testing coverage

The repository currently validates:

- FIT validation and parsing
- prompt assembly
- OpenRouter wrapper behavior
- Strava API proxy routes
- Strava helper logic
- ActivityCard behavior
- Strava panel profile UX
- manual FIT upload flow

Canonical verification commands:

```bash
pnpm test
pnpm build
```
