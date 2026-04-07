# Developer Guide

## 1. Prerequisites

- Node.js `>=20 <23`
- pnpm
- OpenRouter API key

Environment:

```env
OPENROUTER_API_KEY=your_api_key_here
```

---

## 2. Local development

Install and run:

```bash
pnpm install
pnpm dev
```

Run tests:

```bash
pnpm test
```

Build:

```bash
pnpm build
```

---

## 3. Product flow (do not break)

Required UX sequence:

1. Upload `.fit`
2. Auto `POST /api/parse-fit`
3. Show preview metadata
4. User selects model
5. User clicks **Analyze Run**
6. `POST /api/analyze-fit` with `file` + `model`

Do not call analyze endpoint before preview is completed.

---

## 4. Multi-model rules

Source of truth: `lib/aiAnalyzer.ts` → `FREE_MODELS`.

When adding/removing models:
- update `FREE_MODELS`
- keep first element as default model
- ensure UI dropdown displays updated list
- ensure route validation still checks membership with `FREE_MODELS.includes(modelParam)`
- update tests if response contract changes

---

## 5. Validation rules (must keep)

In `lib/fitUploadValidation.ts`:
- extension `.fit`
- MIME allowlist
- FIT signature marker
- max size `<= 4MB`

Apply these checks consistently to both parse and analyze endpoints.

---

## 6. Parser and prompt rules

### Parser (`lib/fitParser.ts`)

- session message is summary truth
- lap messages drive split/lap analysis
- records are fallback-derived signals
- throw `ParseValidationError` on domain-invalid data

### Prompt builder (`lib/buildPromptContext.ts`)

Keep order stable:
1) system prompt
2) structured data context
3) additional guardrails

Generated analysis must remain plain text.

---

## 7. AI integration rules

In `lib/aiAnalyzer.ts`:
- provider: OpenRouter SDK
- method: `chat.send` with `chatRequest`
- selected model comes from request or default
- retry once for rate-limit patterns
- return normalized shape `{ analysis, model, tokensUsed }`

Never expose API key to client.

---

## 8. API contract and statuses

### `/api/parse-fit`
- returns preview `metadata`

### `/api/analyze-fit`
- accepts optional `model`
- returns `analysis`, `metadata`, `model`, `tokensUsed`, `availableModels`

Status code mapping:
- `400` bad request/invalid file
- `413` file too large
- `422` parse validation
- `429` provider rate limit
- `500` fallback server/provider error

---

## 9. Testing expectations

Before merging changes:

- `pnpm test` must pass
- `pnpm build` must pass
- if contracts changed, update route tests

Important test files:
- `tests/api-parse-fit-route.test.ts`
- `tests/api-analyze-fit-route.test.ts`
- `tests/ai-analyzer.test.ts`
- `tests/prompt-context.test.ts`

---

## 10. Common edit map

- Upload gatekeeping: `lib/fitUploadValidation.ts`
- Parser logic: `lib/fitParser.ts`
- Prompt assembly: `lib/buildPromptContext.ts`
- AI call + model list: `lib/aiAnalyzer.ts`
- Analyze API: `app/api/analyze-fit/route.ts`
- Parse API: `app/api/parse-fit/route.ts`
- UI flow + dropdown: `app/page.tsx`
- Shared state: `stores/analysisStore.ts`
