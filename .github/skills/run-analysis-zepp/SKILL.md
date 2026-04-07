---
name: run-analysis-zepp
description: Build and maintain a .fit-to-AI running analysis workflow for Zepp/Amazfit data in Next.js apps. Use this whenever the user mentions .fit files, run analytics, Zepp/Amazfit exports, Gemini prompt assembly, lap-by-lap analysis, Strava-ready descriptions, or mobile-first analysis UI—even if they do not explicitly ask for a “skill”.
---

# Run Analysis Zepp Skill

## Purpose

Use this skill to implement and operate a reusable run-analysis pipeline:

1. parse `.fit` activity files,
2. extract session/lap + advanced metrics,
3. assemble prompt payloads,
4. call Gemini,
5. return strict plain-text Vietnamese analysis output for Strava.

## Scope

- Input format: `.fit` only (MVP scope)
- Deployment target: Next.js on Vercel free tier
- AI target: Gemini 1.5 Flash (free plan)
- Output: plain text report, editable and copyable

## Trigger contexts

Use this skill when user asks to:

- parse `.fit` files
- generate post-run analytics
- improve system prompts or AI output quality
- enforce strict upload validation
- optimize mobile-first analysis UX
- structure API prompt flow for Gemini

## Non-negotiables

- Reject non-`.fit` uploads.
- Enforce backend request size <= 4MB.
- Validate file with extension + MIME + FIT header signature.
- Strip GPS/device identifiers before AI call.
- Use session/lap summaries first; use record-level only for derived metrics.
- Keep output plain text (no markdown in final generated analysis body).

## Implementation checklist

1. Validate upload

- Accept `.fit` only.
- Size <= 4MB.
- Signature contains `.FIT` marker in header.

2. Parse data

- Session fields: distance, timer time, avg/max HR, calories, cadence, avg speed, ascent.
- Lap fields: distance, elapsed/timer time, avg/max HR, avg speed, cadence.
- Optional enrichments: temperature, descent, pause events, device battery warnings, running dynamics.

3. Derived analytics

- Pace normalization (`min'sec"/km`)
- HR drift and pace volatility
- cadence stability and end-run drop
- pause/resume and stopped time summary

4. Prompt assembly order

- System prompt first
- Parsed structured data second
- Additional guardrails third

5. Response handling

- return `analysis` and `metadata`
- preserve AI attribution header
- keep editable output for copy-to-clipboard flow

## Output contract for backend

Return JSON:

```json
{
	"analysis": "plain-text vietnamese report",
	"metadata": {
		"distance_km": 0,
		"pace": "0'00\"/km",
		"time": "00:00:00",
		"avg_hr": 0,
		"max_hr": 0,
		"cadence_spm": 0,
		"calories": 0,
		"elevation_gain_m": 0
	}
}
```

## Mobile-first UX guidance

- Single-column default on small screens
- Sticky bottom action bar for copy/re-analyze
- 16px+ textarea font for readability
- Compact metric cards with expand/collapse
- keep important CTA controls thumb-reachable

## Failure handling

- 400 invalid type/signature
- 413 over-size
- 422 parse failed/missing required session fields
- 500 model failure (safe retry message)

## Notes

If the user requests other formats (TCX/GPX), treat as post-MVP and propose parser abstraction layer without changing current strict `.fit` scope unless explicitly approved.
