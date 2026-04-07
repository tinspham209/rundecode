# Architecture

## 1. System overview

RunDecode is a stateless Next.js application that transforms Zepp/Amazfit `.fit` files into Vietnamese AI-generated run analysis.

Core UX pattern is **verify first, analyze second**:

1. Upload file
2. Parse preview metadata
3. User confirms data
4. User picks model
5. Analyze

This reduces wasted AI calls on invalid/corrupted files.

---

## 2. Runtime topology

```text
[Browser]
  ├─ Upload .fit
  ├─ POST /api/parse-fit
  ├─ Show preview metadata
  ├─ Select model from FREE_MODELS
  └─ POST /api/analyze-fit (file + model)
                |
                v
[Next.js API Routes]
  ├─ validate file
  ├─ parse FIT
  ├─ build prompt segments
  └─ call OpenRouter via aiAnalyzer
                |
                v
[JSON Response]
  analysis + metadata + model + tokensUsed + availableModels
```

---

## 3. Frontend architecture

### Main page (`app/page.tsx`)

Responsibilities:
- manage upload state
- trigger parse-preview endpoint automatically
- enforce preview-before-analyze behavior
- submit selected model with analysis request

### Client state (`stores/analysisStore.ts`)

Store fields:
- `analysis`
- `metadata`
- `loading`
- `error`
- `selectedModel`

Store actions:
- `setLoading`
- `setResult`
- `setError`
- `setSelectedModel`
- `reset`

---

## 4. Backend architecture

### Upload validation (`lib/fitUploadValidation.ts`)

Every upload path enforces:
- extension `.fit`
- MIME allowlist
- FIT signature marker (`.FIT`) in header bytes
- size limit `<= 4MB`

### Parsing (`lib/fitParser.ts`)

Parses and normalizes:
- session metrics (distance, time, pace, HR, cadence, calories, elevation)
- lap summaries
- derived signals (e.g., pause summary)

Privacy boundaries:
- no GPS coordinate payload in AI context
- no device identifiers in AI context

### Prompt assembly (`lib/buildPromptContext.ts`)

Prompt order is fixed:
1. system prompt constant
2. structured run context
3. additional guardrails

### AI gateway (`lib/aiAnalyzer.ts`)

Uses OpenRouter SDK:
- source of truth model list: `FREE_MODELS`
- default model: first item in array
- method: `chat.send({ chatRequest: ... })`
- retry once on rate-limit-like failures

---

## 5. API contracts

### `POST /api/parse-fit`

Input:
- `multipart/form-data`
- `file`

Output:
- `metadata` object for preview UI

### `POST /api/analyze-fit`

Input:
- `multipart/form-data`
- `file`
- `model` (optional; validated against `FREE_MODELS`)

Output:
- `analysis` (plain text)
- `metadata`
- `model`
- `tokensUsed`
- `availableModels`

---

## 6. Error model

- `400`: invalid payload/type/signature
- `413`: file too large
- `422`: parse domain validation failure
- `429`: provider rate-limited
- `500`: provider/server fallback

`/api/analyze-fit` extracts provider raw messages and maps known rate-limit cases to 429.

---

## 7. Deployment model

- stateless app (no DB required)
- environment variable: `OPENROUTER_API_KEY`
- suitable for Vercel Node runtime

---

## 8. Testing boundaries

Primary coverage includes:
- upload validation
- fit parsing and normalization
- prompt context generation
- parse/analyze API route contracts
- AI wrapper retry behavior

Current suite validates the multi-model request path and analyze-route error mapping.
