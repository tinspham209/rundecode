# RunDecode

RunDecode is app that converts `.fit` files into Vietnamese post-run analysis report by AI

The product now uses a **verification-first flow**:

1. Upload `.fit`
2. Auto-parse for preview metadata
3. User checks preview metrics
4. User selects AI model
5. Click **Analyze Run**
6. Receive editable plain-text analysis for Strava

---

## Current capabilities

- Strict `.fit`-only upload validation
- Parse preview endpoint before AI call
- Multi-model free-tier selection from UI
- OpenRouter AI analysis with retry on rate-limit errors
- Editable output + copy-to-clipboard UX
- Mobile-first UI

---

## Tech stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **UI:** React 18 + Tailwind CSS
- **Forms/Upload:** react-hook-form + react-dropzone
- **State:** Zustand
- **FIT parsing:** fit-file-parser
- **AI:** OpenRouter SDK (`@openrouter/sdk`)
- **Tests:** Vitest + Testing Library

---

## AI models

Configured in `lib/aiAnalyzer.ts` via `FREE_MODELS`:

- `qwen/qwen3.6-plus:free`
- `minimax/minimax-m2.5:free`
- `qwen/qwen3-coder:free`
- `openai/gpt-oss-120b:free`
- `google/gemma-3-27b-it:free`
- `meta-llama/llama-3.3-70b-instruct:free`
- `openrouter/free`

Default model = first item in the array.

---

## Quick start

1) Install dependencies

```bash
pnpm install
```

2) Configure environment

Create `.env` or `.env.local`:

```env
OPENROUTER_API_KEY=your_api_key_here
```

3) Start app

```bash
pnpm dev
```

4) Run tests

```bash
pnpm test
```

5) Build production

```bash
pnpm build
pnpm start
```

---

## API endpoints

### `POST /api/parse-fit`

Purpose: validate + parse FIT file and return preview metadata.

Request:
- `multipart/form-data`
- `file` field only

### `POST /api/analyze-fit`

Purpose: validate + parse + build prompt + run AI analysis.

Request:
- `multipart/form-data`
- `file` field (required)
- `model` field (optional, must be one of `FREE_MODELS`)

Response keys:
- `analysis`
- `metadata`
- `model`
- `tokensUsed`
- `availableModels`

Status codes:
- `400` invalid input/file/type/signature
- `413` file too large
- `422` parse validation failure
- `429` provider rate-limited
- `500` provider/server error

---

## Security and privacy

- API key is server-side only (`OPENROUTER_API_KEY`)
- No client-side secret exposure
- Strict upload checks (extension, MIME, FIT signature, size limit)
- GPS coordinates and device identifiers are excluded from AI prompt payloads

---

## Project map

```text
app/
  api/
    parse-fit/route.ts
    analyze-fit/route.ts
  page.tsx

components/
  AnalysisDisplay.tsx
  MetadataSidebar.tsx
  LoadingSpinner.tsx
  ErrorAlert.tsx

lib/
  fitUploadValidation.ts
  fitParser.ts
  buildPromptContext.ts
  aiAnalyzer.ts

stores/
  analysisStore.ts

docs/
  ARCHITECTURE.md
  DEVELOPER.md
```

---

## Related docs

- `docs/ARCHITECTURE.md`
- `docs/DEVELOPER.md`
- `docs/PROPOSAL.md`
