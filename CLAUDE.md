# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development server
npm run dev        # or: yarn dev

# Production build
npm run build

# Run all tests
npm test           # runs: node --test

# Run a single test file
node --test tests/import/parser.test.js

# Preview production build
npm run preview
```

**Environment:** Copy `.env.example` to `.env` and set `VITE_DEBUG_MODE=true` to enable console logging.

## Architecture Overview

This is a React + Vite SPA (no routing) — the entire app lives in a single view managed by `App.jsx`.

### State model

All transcript state lives in `App.jsx` and flows down as props. The core data shape:

```js
{
  terms: [{ termIndex, name, isHighlighted, isMinimized, rows: [{ id, name, units, grade, retakeOf, isManuallyUnlinked }] }],
  transfers: [{ credits, ... }],
  transferEarned: number,
  equivalences: [{ courseA, courseB }],
  nextRowId: number,
}
```

Row IDs are monotonically increasing integers (stored as strings). They are the stable identity for retake links (`retakeOf` points to another row's `id`).

### GPA calculation pipeline (`src/utils/calculations.js`)

1. **`computeRetakeExclusionsMap(terms, equivalences, systemEquivalences, useTransitive)`** — builds a Union-Find structure over all rows, grouping same-named courses (and user/system equivalences). Returns `{ cumulativeExclusions, retakeGroups, retakeChainInfo, getGroupId }`.
2. **`termCalc(term, excludeInfo)`** — computes per-term attempted/earned/QP/GPA.
3. **`computeCumMetrics(terms, upToTermIdx, excludeInfo)`** — computes cumulative metrics up to a given term, respecting best-grade retake logic.

Key rules encoded here:
- GPA scale uses +/- grades up to 4.0 (`A = 4.0`, `B+ = 3.4`, etc.)
- `W` and `P` grades are `null` points — they count toward attempted credits but are excluded from the GPA denominator.
- `UW = 0.0` (counted in GPA denominator).
- GPA is **truncated** (floor) to 3 decimal places; other values are rounded to 2.
- When a course is retaken, all earlier inferior attempts are excluded from cumulative GPA starting from the term after they were taken. The best grade wins; ties go to the later attempt.
- `isManuallyUnlinked: true` on a row opts it out of automatic same-name grouping.

### Retake / equivalence system

- **Auto-linking:** rows with matching course names are automatically grouped.
- **Manual links:** `retakeOf` field on a row explicitly links it to an earlier row.
- **Manual unlinks:** `isManuallyUnlinked: true` prevents a row from being auto-grouped.
- **User equivalences:** pairs of course codes declared equivalent via the Equivalences modal (stored in `equivalences` state).
- **System equivalences:** loaded from `src/data/equivalences.json`; only active when `isExperimental = true` in App.jsx (currently hardcoded `false`).
- **Transitive closure** (`useTransitive = true` experimental mode): uses a name-level Union-Find so that if A≡B and B≡C then A≡C.

### Session persistence (`src/utils/sessionManager.js`)

Sessions are stored in **IndexedDB** (`gpaCalculator` database, `sessions` object store). Each session record: `{ id, name, lastModified, data }` where `data` is the full app state blob. Auto-save is debounced 400 ms after any state change.

### Import pipeline

Two entry points in `ImportModal`, both converge to `applyImportedTerms()` in `src/utils/importUtils.js`:

- **CSV (`src/utils/csvParser.js`):** Parses BYU-style transcript CSV exports. Term headers are identified by a date pattern + season keyword. Course rows are identified by position of numeric credit columns and a valid grade in column +3.
- **Paste (`src/utils/pasteParser.js`):** State-machine line-by-line parser for pasted transcript text. Recognizes course codes via regex (supports hyphenated `PE-C160`, slash `ED/P205`, dotted `PH.S100`, single-letter prefix `B211`).

Both parsers return `{ terms, nextRowId, diagnostics, validation }`.

Import modes (`applyImportedTerms`): `replace` | `append` | `merge`. Merge matches on normalized term name.

### Component responsibilities

- **`TermCard`** — renders one term; delegates row editing to `CourseRow`; opens `CalculationDetailsModal`.
- **`CourseRow`** — single editable row; handles grade/unit input; shows retake indicator (`**`).
- **`TransferCredits`** — manages the transfer credits list; `transferEarned` is derived from this list via `useEffect`.
- **`TranscriptStats`** — displays cumulative metrics computed in `App.jsx`.
- **`SessionManager`** — slide-in panel for switching/creating/renaming/deleting sessions and triggering import.
- **`TrainingModule`** — separate full-screen view (`currentView === "training"`); entered via Header button.

### Testing

Tests use Node's built-in `node:test` runner (no Jest/Vitest). Test files live in `tests/` and import directly from `src/utils/`. Fixtures are in `tests/fixtures/import/`.
