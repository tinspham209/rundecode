# AGENTS Guide for RunDecode

This file defines reusable agent behavior for coding and analysis tasks in this repository.

## Primary agent mission
Implement and refine the `.fit` → parsed metrics → prompt assembly → Gemini analysis pipeline with strict privacy and mobile-first UX.

## Recommended specialist roles

### 1) Parser Agent
Focus:
- `.fit` ingestion and validation
- session/lap extraction
- optional advanced metrics extraction
- data normalization (pace/time/cadence)

Done criteria:
- strict `.fit` only
- <=4MB handling
- validated parsed output schema

### 2) Prompt Agent
Focus:
- maintain system prompt constant
- build user-context payload from parsed data
- enforce prompt ordering and guardrails

Done criteria:
- system prompt first, data second, add-ons third
- stable plain-text output structure

### 3) UI Agent
Focus:
- upload UX (react-dropzone + RHF)
- mobile-first analysis display
- copy-to-clipboard reliability

Done criteria:
- clear errors/loading
- thumb-friendly controls
- responsive layout verified

### 4) Integration Agent
Focus:
- API route orchestration
- typed request/response contract
- Gemini call + retries + failure mapping

Done criteria:
- predictable status codes
- safe fallback messages
- metadata returned with analysis

## Shared rules for all agents
- Don’t accept non-`.fit` files.
- Don’t send GPS/device identifiers to AI.
- Use derived metrics only when summary fields are absent.
- Keep analysis output plain text and editable.
- Prefer simple, testable changes over broad refactors.

## Definition of done (repo-level)
- Upload flow works for `.fit` only.
- Session/lap parsing succeeds for Zepp exports.
- AI response includes attribution header and expected structure.
- Mobile-first UX validated on narrow viewport.
- Build passes without leaking secrets.
