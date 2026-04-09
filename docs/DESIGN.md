# Design System & Design Agents

## 1. Purpose

This document defines how RunDecode should **look and feel** across all pages and features.

It follows practical principles introduced by Google Stitch-style UI workflows:

- component-first composition
- clear visual hierarchy
- consistent spacing and typography
- strong mobile defaults
- accessible interaction and readable content

Goal: every new UI change should feel like it belongs to the same product.

---

## 2. Product personality

RunDecode visual personality:

- **Athletic + analytical** (performance-focused, not playful noise)
- **Calm confidence** (dark surfaces, high readability)
- **Action-oriented** (clear CTA hierarchy)
- **Trustworthy** (explicit states, predictable behavior)

Tone in UI copy:

- concise
- supportive
- practical
- no fluff

---

## 3. Design Agent roles

Use these agent responsibilities when designing or reviewing UI work.

### A) Visual System Agent

Focus:

- color, typography, spacing, elevation
- token consistency
- dark-theme readability and contrast

Done criteria:

- no random one-off style values unless justified
- text contrast is readable on all major surfaces
- spacing rhythm is consistent across cards/forms/lists

### B) Interaction Agent

Focus:

- button hierarchy
- feedback loops (loading/success/error)
- keyboard and touch behavior

Done criteria:

- primary action is always obvious
- disabled/loading states are explicit
- interactions are thumb-friendly on mobile

### C) Content & IA Agent

Focus:

- headings, labels, helper text
- section order and readability
- information density by viewport size

Done criteria:

- users can scan screen intent in 3–5 seconds
- labels are plain language
- no important info hidden behind unclear affordances

### D) Accessibility Agent

Focus:

- semantic structure
- focus states
- aria/label quality
- motion and contrast safety

Done criteria:

- keyboard path is usable
- visible focus exists for all interactive controls
- visual state changes are not color-only

### E) QA Consistency Agent

Focus:

- compare new screens to existing patterns
- prevent style drift
- enforce mobile-first baseline

Done criteria:

- new UI reuses existing primitives when possible
- no duplicated components with minor style forks
- responsive behavior is validated on narrow viewport

---

## 4. Stitch-style design rules for RunDecode

### 4.1 Hierarchy first

- each screen must have one obvious primary action
- headings must clearly communicate screen purpose
- secondary actions should not visually compete with primary CTA

### 4.2 Component-first layout

- build screens from reusable primitives (`Card`, `Button`, `Input`, `Textarea`, `Badge`)
- avoid custom ad-hoc containers when a shared primitive exists
- keep component variants predictable and minimal

### 4.3 Rhythm and spacing

- use consistent vertical rhythm between sections
- align card paddings and content grids
- avoid dense “wall of controls” layouts on mobile

### 4.4 Typography rules

- clear heading scale (screen title > section title > labels)
- body copy optimized for scanability
- avoid long all-caps labels

### 4.5 Color and contrast

- preserve RunDecode dark-first contrast quality
- success/error states must be readable and distinct
- do not rely on color alone for status communication

### 4.6 Motion and feedback

- use motion only to clarify state changes
- loading states should explain what is happening
- success/error feedback should be immediate and specific

### 4.7 Mobile-first behavior

- single-column by default on small screens
- critical actions remain reachable without awkward scrolling
- large enough tap targets for thumb usage

### 4.8 Data clarity

- metrics should be grouped by meaning (effort, pace, heart rate, elevation)
- show context labels, not only raw numbers
- preserve plain-text analysis readability for edit/copy/sync workflows

---

## 5. Screen-level look and feel

### Homepage (`/`) — Strava-first

- clear hero/title explaining value
- immediate path to connect Strava
- activity cards emphasize: route, key metrics, analysis status, sync action
- manual FIT path visible but secondary

### Manual page (`/manual`)

- upload and validation flow is linear and explicit
- parse-preview shown before analyze action
- model selection and analyze CTA grouped clearly

### Analysis presentation

- plain text remains editable and easy to copy
- metadata stays readable without stealing focus
- avoid visual clutter around final report output

---

## 6. Reusable pattern rules

### Buttons

- one primary button per section
- secondary/ghost styles for low-priority actions
- destructive actions require explicit intent

### Cards

- card title answers: “What is this block?”
- card description answers: “Why should I care?”
- card content is concise and actionable

### Forms

- labels always visible
- helper text when field meaning may be ambiguous
- inline validation messages are specific

### Toasts and alerts

- keep messages actionable
- surface exact backend error message when available
- success messages should confirm completed action

---

## 7. Accessibility and quality checklist

Before shipping any UI change:

1. Primary action is clear at first glance
2. Keyboard navigation works
3. Focus indicators are visible
4. Contrast is readable in dark mode
5. Loading/empty/error states are explicit
6. Mobile layout remains clear on narrow viewport
7. No duplicate pattern created without reason

---

## 8. Definition of design done

A UI task is complete when:

- it follows the shared primitives and spacing system
- it maintains RunDecode visual tone and hierarchy
- it is mobile-first and accessibility-safe
- it preserves clarity for fitness data and analysis actions
- it passes functional checks without introducing style drift

---

## 9. Scope note

This document governs UI/UX behavior for RunDecode product surfaces.

If a future feature conflicts with these rules, update this file first and then implement code changes to keep design decisions explicit.
