# Copilot Project Instructions: RunDecode

Use these rules for all implementation work in this repository.

## Product intent

- Build a reusable web app that converts Zepp/Amazfit `.fit` files into AI-generated post-run analysis.
- Main output is plain text Vietnamese analysis, editable and copyable for Strava.

## Tech constraints

- Next.js (App Router), TypeScript.
- Frontend stack includes: Tailwind CSS, Zustand, react-hook-form, react-dropzone.
- AI provider: OpenRouter with `qwen/qwen3.6-plus:free` model (free tier strategy, Vietnamese-fluent).

## Input constraints

- Accept only `.fit` files.
- Reject any other extension.
- Validate backend with 3 checks:
  1. extension `.fit`
  2. MIME allowlist
  3. FIT signature marker in header
- Enforce request limit <= 4MB to stay within Vercel free-plan safety margin.

## Data extraction priorities

- Use `session` message first for summary metrics.
- Use `lap` messages for lap analysis and cardiac drift reasoning.
- Use `record` series only for derived metrics and fallback gaps.
- Strip GPS coordinates and device identifiers before sending data to AI.

## Prompt architecture

Always assemble AI request in this order:

1. system prompt constant (source of truth in code)
2. parsed structured data context
3. additional guardrails/instructions

Avoid runtime loading of markdown prompt files if a prompt constant is available.

## Output requirements

- Analysis body should be plain text (no markdown formatting in generated content).
- Include AI attribution header in analysis output.
- Return JSON payload with `analysis` and `metadata`.

## UX requirements

- Mobile-first by default.
- Single-column layout on mobile, expanded layout on desktop.
- Provide clear loading/error states.
- Keep copy action easy to reach on mobile.

## Error handling

- 400 invalid file type/signature
- 413 file too large
- 422 parse/validation failure
- 500 model request failure

## Security and privacy

- Never log raw GPS traces.
- Never expose API key in client code.
- Use HTTPS-only deployment defaults.
