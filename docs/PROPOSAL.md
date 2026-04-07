# RunDecode Proposal (Updated)

**Status:** Implemented baseline + multi-model upgrade  
**Date:** 2026-04-08  
**Budget target:** $0 (free-tier only)

---

## 1) Goal

Build a reusable web app that transforms Zepp/Amazfit `.fit` files into Vietnamese AI post-run analysis that is editable and easy to paste to Strava.

---

## 2) Current implemented flow

### Verification-first pipeline

1. User uploads `.fit`
2. App calls `POST /api/parse-fit` to validate + parse
3. UI shows preview metadata (distance, pace, HR, cadence, calories, elevation, start time)
4. User selects an AI model from dropdown
5. User clicks **Analyze Run**
6. App calls `POST /api/analyze-fit` with file + model
7. API returns analysis + metadata + model info

This avoids wasting AI calls on invalid files and improves user control.

---

## 3) AI strategy

### Provider

- OpenRouter via `@openrouter/sdk`

### Model strategy

- Model list is configurable via `FREE_MODELS` in `lib/aiAnalyzer.ts`
- Current list contains multiple free fallback models
- UI lets user choose model per request
- API validates selected model against allowlist

### Reliability

- AI call retries once on rate-limit-like failures
- Analyze route maps provider rate-limit cases to HTTP `429`
- Raw provider messages can be surfaced for actionable error UX

---

## 4) Data and privacy constraints

### Upload constraints

- file extension `.fit`
- MIME allowlist
- FIT signature marker in header
- size limit `<= 4MB`

### Privacy constraints

- no API keys on client
- no GPS trace leakage in AI payloads
- no device identifier leakage in AI payloads

---

## 5) Prompt architecture

Prompt assembly order remains strict:

1. System prompt constant (`src/prompts/runAnalysisSystemPrompt.ts`)
2. Structured parsed context (`lib/buildPromptContext.ts`)
3. Additional guardrails

Output must remain plain text, editable, and suitable for Strava description.

---

## 6) API contracts

### `POST /api/parse-fit`
- Input: `file`
- Output: `metadata`

### `POST /api/analyze-fit`
- Input: `file`, optional `model`
- Output:
  - `analysis`
  - `metadata`
  - `model`
  - `tokensUsed`
  - `availableModels`

Status code contract:
- `400` invalid request/type/signature
- `413` file too large
- `422` parse validation failure
- `429` upstream/provider rate-limit
- `500` fallback server/provider error

---

## 7) UX direction

### Implemented

- mobile-first upload + preview + analyze flow
- model dropdown before analysis
- loading/error states
- editable analysis output with copy action

### Next UX improvement (optional)

Add one-click “Switch to another model” suggestion when analysis fails with 429, preselecting the next model in `FREE_MODELS`.

---

## 8) Architecture summary

- Next.js App Router frontend
- Two route handlers:
  - `/api/parse-fit` for preview
  - `/api/analyze-fit` for analysis
- Stateless processing (no DB required)
- OpenRouter server-side integration only

---

## 9) Delivery checklist (current)

- [x] OpenRouter migration complete
- [x] Multi-model selection in UI
- [x] Analyze route model validation + response model metadata
- [x] Parse-preview gate before analyze
- [x] Test suite passing
- [x] Build passing
- [x] Docs aligned (README, ARCHITECTURE, DEVELOPER, PROPOSAL)

---

## 10) Success criteria

- Upload works only for valid `.fit` files
- Preview metadata appears before AI call
- User can choose model for each analysis
- Analysis response is plain Vietnamese text with attribution header
- App remains free-tier compatible and production-ready
# 🏃 RunDecode: Run Analysis Web App - Implementation Proposal

**Status:** Proposal Ready for Implementation  
**Date:** April 7, 2026  
**Budget:** $0 (100% free)

---

## 🎯 Executive Summary

Build a free, reusable Next.js web application that converts Zepp `.fit` run data files into structured JSON, auto-parses and previews core metadata first for verification, then sends verified data to OpenRouter's free qwen/qwen3.6-plus model for Vietnamese analysis using an in-code system prompt constant (no runtime `.md` file read), and outputs an editable, copyable report ready for Strava.

**Key Benefit:** Zero cost forever. No setup required beyond a free OpenRouter API key (30 seconds).

---

## 📋 Project Overview

### Objective
Create a hobby-grade run analysis tool that:
1. Accepts `.fit` file uploads (from Zepp/Amazfit devices)
2. Auto-parses binary data immediately after upload for preview verification
3. Shows metadata preview (including run date/time) before AI analysis
4. Sends verified JSON + system prompt to OpenRouter qwen AI only when user clicks Analyze
5. Outputs editable Vietnamese analysis text
6. User copies output directly to Strava description

### Problem Solved
- Manual run analysis is time-consuming
- AI analysis currently costs money (OpenAI, etc.)
- Most tools don't support Vietnamese output
- Your system prompt is highly specific to your profile—automate it
- Users may waste AI requests on wrong/corrupted uploads; metadata preview reduces this

### Target User
- You (Tin, 27, Đà Nẵng runner)
- Future: any runner who uploads .fit files
- Use case: hobby runs, training tracking

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (React + Tailwind + RHF + Dropzone + Zustand)    │
│  ├─ Upload Form (.fit only, drag/drop + validation)         │
│  ├─ Loading State (spinner)                                 │
│  ├─ Analysis Display (editable text area)                   │
│  └─ Metadata Sidebar (distance, pace, HR, etc.)             │
└────────────────┬────────────────────────────────────────────┘
                 │ POST /api/analyze-fit
                 ↓
┌─────────────────────────────────────────────────────────────┐
│  Backend (Next.js API Route)                                │
│  ├─ File validation (strict .fit only + signature checks)   │
│  ├─ Upload guard (<= 4MB to stay under Vercel free limits)  │
│  ├─ Binary parsing (fit-file-parser)                        │
│  │  └─ Extract: session (distance, time, HR, cadence, etc.) │
│  │  └─ Extract: lap data (for Cardiac Drift analysis)       │
│  │  └─ Extract: advanced metrics (if available)             │
│  │  └─ Strip: GPS (lat/lng), device IDs (privacy)           │
│  ├─ JSON serialization                                       │
│  └─ Gemini API call                                          │
│     └─ System Prompt: TypeScript constant                    │
│     └─ Context: system prompt → parsed JSON → add-ons       │
│     └─ Response: plain Vietnamese text                       │
└────────────────┬────────────────────────────────────────────┘
                 │ Analysis JSON
                 ↓
┌─────────────────────────────────────────────────────────────┐
│  Response to Frontend                                        │
│  ├─ analysis: "<plaintext_vietnamese_report>"               │
│  ├─ metadata: { distance, pace, time, avg_hr, ... }         │
│  └─ attribution: "Analysis by AI"                           │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Update (Verification-First Flow)

New request sequence to reduce unnecessary AI usage:

1. User selects valid `.fit` file
2. Frontend auto-calls `POST /api/parse-fit`
3. Backend validates + parses FIT, returns preview `metadata`
4. UI shows metadata preview (including `start_time`) for user verification
5. User explicitly clicks **Analyze Run**
6. Frontend calls `POST /api/analyze-fit` for OpenRouter analysis

This keeps the expensive/slow AI request behind an explicit user confirmation step.

---

## 💾 Tech Stack

| Layer                | Technology                                | Why                                                 |
| -------------------- | ----------------------------------------- | --------------------------------------------------- |
| **Frontend**         | React 18 + Tailwind CSS + Mobile-first UX | Fast, clean UI, responsive                          |
| **State Management** | Zustand                                   | Lightweight global state for upload/progress/result |
| **Forms**            | react-hook-form                           | Performant form handling + validation               |
| **File Upload UI**   | react-dropzone                            | Drag/drop UX with strict file acceptance            |
| **Framework**        | Next.js 14+ (App Router)                  | TypeScript, API routes, zero config deploy          |
| **Parsing**          | fit-file-parser (npm)                     | Parse binary .fit files → JSON                      |
| **AI**               | OpenRouter + qwen/qwen3.6-plus:free       | Free-tier strategy, stable Vietnamese output        |
| **Deployment**       | Vercel                                    | Free tier, auto-deploy, native Next.js support      |
| **Database**         | None                                      | No persistence—stateless (user uploads & leaves)    |

---

## 📊 Cost Analysis

### Breakdown
| Resource                    | Free Tier                    | Cost                             |
| --------------------------- | ---------------------------- | -------------------------------- |
| **Google Gemini 1.5 Flash** | 1,000 req/min, 1M tokens/day | $0 forever                       |
| **Vercel Hosting**          | 100GB bandwidth, auto-scale  | $0 forever                       |
| **Domain (optional)**       | —                            | $0 (use `.vercel.app` subdomain) |
| **Database**                | N/A                          | N/A (no persistence)             |
| **Total Monthly**           | —                            | **$0**                           |
| **Total Yearly**            | —                            | **$0**                           |

### Assumptions
- 50–100 analyses/month (hobby use)
- ~5,000–10,000 tokens per analysis
- Well within Gemini free tier limits (1M tokens/day = 100k+ analyses/day)
- You will never hit rate limits

---

## 🔒 Privacy & Security

### Data Handling
✅ **GPS stripping**: Coordinates removed before API calls  
✅ **Device ID removal**: No device fingerprinting saved  
✅ **Strict `.fit` only acceptance**: MIME + extension + FIT signature  
✅ **Request size protection**: hard limit at 4MB (safe threshold for Vercel free)  
✅ **No persistence**: No database, no logs, no history  
✅ **HTTPS only**: Vercel enforces TLS  
✅ **API key protection**: Environment variables, never exposed in client code  
✅ **Prompt injection prevention**: System prompt is immutable from user input

### Privacy Best Practices
- User's .fit file processed locally on your Vercel server
- Only parsed JSON (no GPS, no device ID) sent to Gemini
- Gemini API has data retention options (set to "no retention" if needed)
- User deletes .fit file from device after analysis (not your responsibility)

---

## 🎯 Detailed Implementation Plan

### Phase 1: Project Setup (1–2 hours)

#### Step 1: Initialize Next.js Project
```bash
npx create-next-app RunDecode --typescript --tailwind --app
cd RunDecode
```

**Output:**
- `package.json` with Next.js 14, React 18, Tailwind CSS
- `app/` directory with App Router
- `.env.local` (create if missing)

#### Step 2: Get Google Gemini API Key
1. Visit https://ai.google.dev/
2. Click "Get API Key"
3. Create/select Google Cloud Project
4. Copy key → `.env.local`: `GOOGLE_GENAI_API_KEY=<your_key>`
5. Add `.env.local` to `.gitignore`

**Output:**
- Free API key ready to use
- No credit card required (truly free tier)

#### Step 3: Install Dependencies
```bash
npm install fit-file-parser @google/generative-ai dotenv zustand react-hook-form react-dropzone zod @hookform/resolvers
npm install --save-dev @types/node
```

**Output:**
- `package.json` updated
- `node_modules/` ready for use

---

### Phase 2: Backend Parsing (2–3 hours)

#### Step 4: Create API Route `/api/analyze-fit` (POST)
**File:** `app/api/analyze-fit/route.ts`

**Responsibilities:**
- Accept multipart/form-data with `.fit` file
- Validate file type with 3-layer checks:
  - extension must be `.fit`
  - MIME in allowlist (`application/octet-stream`, vendor FIT MIME if present)
  - file signature contains `.FIT` marker in FIT header bytes
- Validate file size `<= 4MB` to stay within Vercel free plan safety margin
- Return 400 if invalid, with error message
- Call parser function (Step 5)
- Call Gemini function (Step 7)
- Return 200 with analysis JSON

**Error Handling:**
- 400: Invalid file type/size
- 413: File too large (limit 4MB)
- 500: Parsing error (suggest retry)
- 500: Gemini API error (suggest retry, log error)

**Output:**
- `/app/api/analyze-fit/route.ts` (200–250 lines)

#### Step 5: Create `.fit` Parser (`lib/fitParser.ts`)

**Responsibilities:**
- Accept Buffer (binary file data)
- Use `fit-file-parser` library to decode
- Extract `session` message:
  - `total_distance` (m) → convert to km
  - `total_timer_time` (s) → convert to HH:MM:SS
  - `avg_heart_rate`, `max_heart_rate` (bpm)
  - `total_calories` (kcal)
  - `avg_cadence` (cycles/min) → multiply by 2 for steps/min
  - `enhanced_avg_speed` (m/s) → convert to pace (min'sec"/km)
  - `total_ascent` (m) for elevation
- Extract `lap` messages (if available):
  - For each lap: lap#, distance, time, avg_hr, avg_speed, avg_cadence
- Extract additional high-value fields (if present) for stronger analytics:
  - Session: `total_descent`, `min_heart_rate`, `training_load`, `training_stress_score`, `recovery_time`, `avg_temperature`, `max_temperature`
  - Lap: `max_heart_rate`, `max_speed`, `avg_temperature`, `max_temperature`, `lap_trigger`
  - Record aggregates (computed server-side): HR drift trend, pace volatility, cadence stability, split consistency
  - Running Dynamics (device-dependent): `vertical_oscillation`, `vertical_ratio`, `ground_contact_time`, `stance_time_percent`, `step_length`, left/right balance
  - Events: timer start/stop pauses, pause duration, resume count
  - Device info: battery status warning (if available)
- **CRITICAL: Strip GPS data (lat, lng) and device IDs**
- Validate data (non-zero distance, HR in range 40–200)
- Return structured JSON object

**JSON Output Format:**
```json
{
  "session": {
    "totalDistance": 10.5,
    "totalTime": "00:42:35",
    "avgHeartRate": 145,
    "maxHeartRate": 162,
    "totalCalories": 520,
    "avgCadence": 175,
    "avgSpeed": 2.95,
    "avgPace": "5'40\"/km",
    "totalAscent": 45
  },
  "laps": [
    {
      "lapNumber": 1,
      "distance": 5.2,
      "time": "00:21:15",
      "avgHeartRate": 142,
      "avgSpeed": 2.93,
      "avgPace": "5'44\"/km",
      "avgCadence": 173
    },
    {
      "lapNumber": 2,
      "distance": 5.3,
      "time": "00:21:20",
      "avgHeartRate": 148,
      "avgSpeed": 2.97,
      "avgPace": "5'36\"/km",
      "avgCadence": 177
    }
  ]
}
```

**Output:**
- `lib/fitParser.ts` (150–200 lines)

#### Step 6: Build AI Prompt Context (`lib/buildPromptContext.ts`)

**Responsibilities:**
- Accept parsed JSON from Step 5
- Transform into human-readable format for Gemini
- Build final prompt payload in strict order:
  1. **System Prompt** (from code constant, equivalent to `system-prompt.md`)
  2. **Parsed FIT Data** (session + laps + advanced metrics)
  3. **Additional Prompt Instructions** (small guardrails: be concise, preserve exact output template, include AI attribution header)
- Build user message with:
  - Session-level summary
  - Lap-by-lap breakdown (if available)
  - Advanced analytics signals and warnings
  - Request for Vietnamese analysis

**Example Context:**
```
Dữ liệu chạy hôm nay:
- Quãng đường: 10.50 km
- Thời gian: 00:42:35
- Nhịp tim trung bình: 145 bpm (max: 162 bpm)
- Nhịp chân: 175 steps/min
- Elevation: 45 m
- Calories: 520 kcal

Dữ liệu từng lap:
Lap 1: 5.2 km, 21'15", HR 142 bpm, Pace 5'44"/km, Cadence 173 spm
Lap 2: 5.3 km, 21'20", HR 148 bpm, Pace 5'36"/km, Cadence 177 spm

Hãy tạo báo cáo phân tích chi tiết theo hướng dẫn trong system prompt.
```

**Output:**
- `lib/buildPromptContext.ts` (50–100 lines)

---

### Phase 3: AI Integration (1–2 hours)

#### Step 7: Create Gemini API Wrapper (`lib/aiAnalyzer.ts`)

**Responsibilities:**
- Initialize Google Generative AI client
- Use TypeScript constant prompt (no runtime filesystem read)
- Accept parsed JSON + context string
- Call Gemini 1.5 Flash with:
  - System instruction: `RUN_ANALYSIS_SYSTEM_PROMPT` constant
  - User message: parsed data + additional instructions from Step 6
  - Model: `gemini-1.5-flash`
  - Temperature: 0.7 (balanced creativity)
- Handle API errors (retry 1x on rate limit)
- Return analysis text (plain Vietnamese)
- Log token usage for monitoring

**Output:**
```typescript
interface AnalysisResponse {
  analysis: string;          // Plain Vietnamese text
  tokensUsed: number;
  model: string;
}
```

**Output:**
- `lib/aiAnalyzer.ts` (100–150 lines)

#### Step 7.1: Extract Prompt into Code Constant (`src/prompts/runAnalysisSystemPrompt.ts`)

**Responsibilities:**
- Enhance current prompt template with:
  - explicit AI attribution header requirement
  - advanced metrics interpretation rules (running dynamics, pause events, heat stress)
  - fallback logic for missing fields
- Export as immutable string constant:

```ts
export const RUN_ANALYSIS_SYSTEM_PROMPT = `...`;
```

**Why:**
- No filesystem I/O at runtime
- Easier versioning/testing
- One import path for backend AI calls

---

### Phase 4: Frontend UI (2–3 hours)

#### Step 8: Create Upload Form & Main Page (`app/page.tsx`)

**Responsibilities:**
- Use `react-hook-form` + `zod` for validation and submission handling
- Use `react-dropzone` for mobile-friendly drag/drop + tap-to-select upload
- Use Zustand store for upload state/result/error across components
- Display upload card with:
  - `.fit` file input only (`accept=".fit"`)
  - hard validation message if file is not `.fit`
  - upload button (disabled while loading)
  - Loading spinner + status text
  - Error alert (if parsing/API fails)
- After successful upload, transition to analysis display
- Responsive design (mobile-first Tailwind; default optimized for < 768px)
- Accessibility: proper labels, keyboard nav

**UI Flow:**
1. User lands on page → Upload form visible
2. User selects .fit file → Button enabled
3. User clicks Upload → Loading spinner, "Đang phân tích..."
4. Backend processes (5–10 seconds typically)
5. Success → Analysis displayed below
6. Error → Error message with retry button

**Output:**
- `app/page.tsx` main component

#### Step 9: Create Analysis Display Component (`components/AnalysisDisplay.tsx`)

**Responsibilities:**
- Header with attribution: "Báo cáo phân tích chạy (Analysis by AI)"
- Mobile-first layout:
  - **Default mobile:** single column, sticky action bar (Copy / Re-analyze)
  - **Desktop:** two-column (analysis + metadata)
  - **Text area:** large, thumb-friendly, min 16px font, optimized line-height
  - **Quick anchors:** jump links to sections (🏁 📊 ⚠️ 🍉 🚀)
  - **Metadata:** compact cards with expandable details on mobile
    - Distance: 10.50 km
    - Pace: 5'40"/km
    - Total Time: 00:42:35
    - Avg HR / Max HR: 145 / 162 bpm
    - Cadence: 175 spm
    - Elevation: 45 m
    - Calories: 520 kcal
- Buttons:
  - "Copy to Clipboard" (copies edited text only, one-thumb reachable on mobile)
  - "Analyze Another Run" (reset form)
- Copy feedback: "Copied!" toast for 2 seconds

**Output:**
- `components/AnalysisDisplay.tsx` (150–200 lines)

#### Step 10: Create Error & Loading Components

**Files to create:**
- `components/LoadingSpinner.tsx` — Animated spinner + status text
- `components/ErrorAlert.tsx` — Error message + retry button
- `components/MetadataSidebar.tsx` — Run metrics display

**Output:**
- 3 reusable components

#### Step 11: Styling & Responsive Design

**Tailwind Configuration:**
- Dark mode support (optional toggle)
- Mobile breakpoints: sm, md, lg
- Color scheme: clean, minimal (white/gray on light, gray/black on dark)
- Accessibility: high contrast, focus states

**Pages:**
- `/app/page.tsx` — Main upload + analysis (responsive)
- `/app/layout.tsx` — Global layout, metadata tags
- `globals.css` — Tailwind directives, custom classes

**Output:**
- Fully responsive, mobile-friendly UI

---

### Phase 5: Local Testing (2–3 hours)

#### Step 12: Test .fit Parsing with Sample File

**Test File:** `Zepp20260406192022.fit` (your sample file)

**Steps:**
1. Write test script: `scripts/test-parser.ts`
   - Load `Zepp20260406192022.fit`
   - Call `parseFitFile()`
   - Log JSON output to console
   - Verify fields are present and reasonable
2. Check output:
   - ✅ `totalDistance` > 0 (km)
   - ✅ `avgHeartRate` in range 100–180 bpm
   - ✅ `avgCadence` > 0 (spm)
   - ✅ `laps.length` > 0 (if present)
   - ✅ No GPS coordinate fields in output
   - ✅ No device ID fields in output
3. Fix any parsing issues

**Command:**
```bash
npx ts-node scripts/test-parser.ts
```

**Expected Output:**
```json
{
  "session": { ... },
  "laps": [ ... ]
}
```

#### Step 13: Test Gemini API Integration

**Steps:**
1. Create mock JSON data (from Step 12 output or sample)
2. Call `aiAnalyzer.generateAnalysis(mockData)` directly
3. Verify response:
   - ✅ Returns plain Vietnamese text
   - ✅ Includes all sections from system-prompt.md
   - ✅ No markdown formatting
   - ✅ Includes emoji (🏁, 📊, ⚠️, etc.) as per system prompt
4. Check Gemini dashboard:
   - ✅ API key valid
   - ✅ Token usage reasonable (~5–10k tokens per analysis)

**Command:**
```bash
npm run dev
# Call /api/analyze-fit manually with curl or Postman
```

#### Step 14: End-to-End Frontend Test

**Steps:**
1. Start dev server: `npm run dev`
2. Visit `http://localhost:3000`
3. Upload `Zepp20260406192022.fit`
4. Wait for analysis (5–10 seconds)
5. Verify:
   - ✅ Loading spinner appears
   - ✅ Analysis displays in editable text area
   - ✅ Metadata sidebar shows correct values
   - ✅ Copy button works (test paste in Notes)
   - ✅ Formatting preserved (no markdown artifacts)
   - ✅ "Analyze Another Run" resets form
   - ✅ Works on mobile (use Chrome DevTools)

---

### Phase 6: Deployment (1–2 hours)

#### Step 15: Prepare for Production Build

**Checklist:**
- [ ] Remove console.log() debug statements
- [ ] Remove test files / scripts folder
- [ ] Verify `.env.local` is in `.gitignore`
- [ ] Create `.env.example`:
  ```
  GOOGLE_GENAI_API_KEY=your_key_here
  ```
- [ ] Build locally: `npm run build`
  - ✅ No TypeScript errors
  - ✅ No build warnings
  - ✅ Next.js optimizations complete
- [ ] Test production build locally: `npm run start`
  - ✅ Upload .fit file
  - ✅ Analyze works end-to-end
  - ✅ No errors in terminal

#### Step 16: Deploy to Vercel

**Steps:**
1. Initialize Git (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: RunDecode - Run analysis web app"
   ```

2. Push to GitHub:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/RunDecode.git
   git push -u origin main
   ```

3. Connect to Vercel:
   - Visit https://vercel.com/
   - Sign in with GitHub
   - Import your `RunDecode` repository
   - Vercel auto-detects Next.js
   - Add environment variable:
     - Key: `GOOGLE_GENAI_API_KEY`
     - Value: Your Gemini API key (from Step 2)
   - Click "Deploy"
   - Vercel auto-deploys (2–5 minutes)

4. Test deployed URL:
   - Vercel provides URL: `https://RunDecode-<random>.vercel.app`
   - Upload real .fit file
   - Verify analysis works
   - Check Vercel logs (Deployments tab) for errors

5. Optional: Add custom domain
   - Domain settings in Vercel dashboard
   - Point DNS → Vercel nameservers (if desired)

**Output:**
- Live app at `https://RunDecode-<random>.vercel.app`
- Auto-deploy on every GitHub push

#### Step 17: Post-Deployment Monitoring

**Monthly Checklist:**
- [ ] Check Gemini API dashboard for token usage
- [ ] If usage spikes, investigate in Vercel logs
- [ ] Rotate API key every 6 months (security best practice)
- [ ] Keep `.env.local` out of git (verify `.gitignore`)
- [ ] Test with new .fit file quarterly (regression test)

**Optional Optimizations:**
- Add file upload caching by hash (if analyzing same run twice)
- Implement rate limiting per IP (if app becomes popular)
- Add analytics (Vercel Web Analytics)

---

## 🔬 FIT Data Research Upgrade (for Better Analytics)

Based on Garmin FIT Activity + Decoding guides, we can improve analysis quality by parsing more than baseline session/lap values.

### Core Messages to Parse
- Required: `file_id`, `activity`, `session`, `lap`, `record`
- Useful optional: `event`, `device_info`, `hrv`, `developer_data`

### Additional Metrics to Extract/Compute
- **Load & Recovery:** training load, stress score, recovery time (if present)
- **Heat Stress:** avg/max temperature and heat-adjusted HR interpretation
- **Pause Efficiency:** timer start/stop counts, total paused duration
- **Pacing Quality:** split variance, pace volatility, negative/positive split
- **HR Quality:** drift slope, HR decoupling vs pace, spike detection
- **Cadence Quality:** cadence variability + end-of-run drop-off
- **Running Dynamics (if available):** vertical oscillation, ground contact time, step length, stance balance
- **Sensor Reliability Flags:** low battery sensors from `device_info`, missing-data ratios

### Robustness Rules
- Support both summary-first and summary-last FIT message ordering
- Handle smart-recording irregular intervals (not strictly every second)
- Fall back gracefully when optional messages are absent

---

## 📁 File Structure (Final)

```
RunDecode/
├── app/
│   ├── api/
│   │   └── analyze-fit/
│   │       └── route.ts              (Backend: .fit upload → Gemini API → JSON response)
│   ├── layout.tsx                    (Global layout + metadata)
│   ├── page.tsx                      (Main UI: upload form + analysis display)
│   └── globals.css                   (Tailwind directives)
├── components/
│   ├── AnalysisDisplay.tsx           (Editable text area + metadata sidebar)
│   ├── LoadingSpinner.tsx            (Loading state + status text)
│   ├── ErrorAlert.tsx                (Error message + retry button)
│   └── MetadataSidebar.tsx           (Run metrics display)
├── lib/
│   ├── fitParser.ts                  (Binary .fit → JSON parsing)
│   ├── buildPromptContext.ts         (JSON → human-readable context for AI)
│   └── aiAnalyzer.ts                 (Gemini API wrapper)
├── src/
│   └── prompts/
│       └── runAnalysisSystemPrompt.ts (System prompt constant used by Gemini)
├── scripts/
│   └── test-parser.ts                (Test .fit parsing with sample file)
├── .env.local                        (Your Gemini API key, NOT committed)
├── .env.example                      (Template for env vars)
├── .gitignore                        (Include .env.local)
├── package.json                      (Dependencies, scripts)
├── system-prompt.md                  (Source prompt reference; synchronized into TS const)
├── PROPOSAL.md                       (This file)
└── README.md                         (Setup instructions for future users)
```

---

## 🚀 Quick Start Timeline

| Phase              | Duration  | Key Deliverable                                |
| ------------------ | --------- | ---------------------------------------------- |
| 1. Setup           | 1–2h      | Project initialized, Gemini API key ready      |
| 2. Backend Parsing | 2–3h      | .fit → JSON parser + API route working         |
| 3. AI Integration  | 1–2h      | Gemini API calls successful, Vietnamese output |
| 4. Frontend UI     | 2–3h      | Upload form + analysis display (mobile-ready)  |
| 5. Testing         | 2–3h      | All components tested locally                  |
| 6. Deployment      | 1–2h      | Live on Vercel, custom domain (optional)       |
| **TOTAL**          | **9–15h** | **Production-ready app deployed**              |

**Estimate:** ~2–3 days of focused work (or 1 week part-time)

---

## ✅ Success Criteria

### Functional Requirements
- ✅ User uploads `.fit` file only (reject all other formats)
- ✅ Parse binary → JSON (session + lap data)
- ✅ Parse enriched metrics when available (events, heat, dynamics)
- ✅ Strip GPS data for privacy
- ✅ Send JSON + system prompt to Gemini
- ✅ Receive plain Vietnamese analysis
- ✅ Display editable text area
- ✅ Copy to clipboard works
- ✅ Works on mobile (responsive)
- ✅ Clear error messages if parsing/API fails

### Non-Functional Requirements
- ✅ Zero cost (fully free tier)
- ✅ < 2 second time-to-interactive on button click
- ✅ < 10 seconds total analysis time (usually 5–8s)
- ✅ No user auth required
- ✅ No database required
- ✅ Privacy: no GPS, no device IDs persisted
- ✅ Accessible (WCAG 2.1 AA)
- ✅ Mobile-first responsive design
- ✅ Upload request size enforced at `<= 4MB` for Vercel free plan safety
- ✅ No unplanned costs (within Gemini free tier 1M tokens/day)

### Deployment Requirements
- ✅ Deploy to Vercel (1-click from GitHub)
- ✅ Live URL: `https://RunDecode-<random>.vercel.app`
- ✅ Auto-deploy on GitHub push
- ✅ Custom domain optional
- ✅ HTTPS enforced

---

## 🎯 Key Decisions (Locked In)

| Decision                  | Choice                 | Rationale                                                             |
| ------------------------- | ---------------------- | --------------------------------------------------------------------- |
| **Lap-by-lap extraction** | YES                    | Matches system prompt (Cardiac Drift analysis)                        |
| **MVP scope**             | .fit only              | Faster delivery; refactor for TCX/GPX later if needed                 |
| **AI attribution**        | YES (header)           | "Báo cáo phân tích chạy (Analysis by AI)" per Strava ToS transparency |
| **AI model**              | Gemini 1.5 Flash       | 100% free, 1000 req/min, excellent Vietnamese quality                 |
| **Data format**           | .fit → JSON            | Cleaner pipeline, easier debugging, modular                           |
| **Privacy**               | Strip GPS + device IDs | Protect location privacy, no device fingerprinting                    |
| **Editable output**       | YES                    | User tweaks before Strava (flexibility + agency)                      |
| **Persistence**           | NO (stateless)         | Simpler architecture, faster load time, lower overhead                |
| **Deployment**            | Vercel                 | Free tier, native Next.js, auto-deploy                                |

---

## 🔮 Future Enhancements (Out of Scope)

These are nice-to-have features for future iterations:

1. **Support TCX/GPX files** — Extend parser to handle Strava exports, Apple Health
2. **Save analysis history** — Persistent storage (Supabase free tier)
3. **User accounts** — Track trends across runs (auth + database)
4. **Custom system prompts** — Let users upload their own coaching instructions
5. **Sharing** — Generate short link to share analysis with coach
6. **Notifications** — Email analysis to user after upload
7. **Batch uploads** — Analyze multiple files in one session
8. **Export formats** — Download as PDF, Markdown, HTML
9. **Integration with Strava API** — Auto-post analysis to Strava
10. **Advanced metrics** — VO2 Max estimates, training load, recovery score

---

## 📞 Support & Questions

### During Implementation
- **Q: .fit parsing fails on my device file**
  - A: Use `garmin-fit` library (more robust) as fallback; test with Python fitparse for comparison
- **Q: Gemini API rate-limited**
  - A: Unlikely at hobby volume; fallback to Llama 3.1 via Together.ai (500k tokens free/month)
- **Q: Copy to clipboard not working**
  - A: Browser permission issue; use browser devtools to debug; may need HTTPS (Vercel handles)
- **Q: How to debug parsing issues?**
  - A: Log raw .fit buffer, intermediate JSON, Gemini request/response to console

### After Deployment
- **Q: Can I add more users?**
  - A: Yes—share live URL. Each user uploads independently (no persistence).
- **Q: How do I update the system prompt?**
  - A: Update `src/prompts/runAnalysisSystemPrompt.ts` (source of truth), optionally mirror to `system-prompt.md` for documentation, then re-deploy.
- **Q: Will this work offline?**
  - A: No—requires Gemini API call. Could build local version with Ollama/Llama.cpp later.

---

## 📝 Next Steps

1. **Review this proposal** with your requirements
2. **Get Gemini API key** (30 seconds at https://ai.google.dev/)
3. **Start Phase 1** (project setup) or request implementation assistance
4. **Test locally** with your `.fit` file
5. **Deploy to Vercel** (1-click)
6. **Use for your runs!**

---

## 📄 Appendix: Reference Data

### Your Runner Profile (from system-prompt.md)
- **Name:** Tin
- **Location:** Đà Nẵng, Vietnam
- **Age:** 27
- **Weight:** 75 kg
- **Max HR:** 182 bpm
- **Resting HR:** 50 bpm
- **VO2Max:** 49
- **Device:** Zepp / Amazfit Balance
- **Community:** @1ohana.runclub

### Heart Rate Zones
- Zone 1 (Easy Recovery): 116–134 bpm (64–74% HRmax)
- Zone 2 (Aerobic Base): 135–150 bpm (74–82% HRmax)
- Zone 3 (Tempo): 151–165 bpm (83–91% HRmax)
- Zone 4 (Threshold): 166–174 bpm (91–96% HRmax)
- Zone 5 (VO2 Max): 175–182 bpm (96–100% HRmax)

### Sample Output (What Strava Will See)
```
Báo cáo phân tích chạy (Analysis by AI)
🏁 TỔNG QUAN & ĐÁNH GIÁ
Distance: 10.50 km, Pace: 5'40"/km, Time: 00:42:35, Cadence: 175 spm, Calories: 520 kcal.

[... full Vietnamese analysis following system-prompt.md structure ...]

[Copy this entire text, paste into Strava activity description]
```

---

**Document Version:** 1.1  
**Last Updated:** April 7, 2026  
**Author:** AI Assistant (GitHub Copilot)  
**Status:** ✅ Ready for Implementation
