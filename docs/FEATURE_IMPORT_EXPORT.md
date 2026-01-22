# Feature Specification: Smart Transcript Import

## Objective
Implement a system to populate the GPA Calculator terms and courses by uploading a structured file.

## Format Analysis

### 1. CSV (Recommended)
**Why:**
- **Parsing:** Extremely fast and reliable in client-side JavaScript.
- **Editing:** Users can easily edit their data in Excel/Sheets before uploading.
- **Structure:** Naturally maps to the row/column structure of a transcript.

**Proposed Schema:**
```csv
Term, Course Code, Credits, Grade
Fall 2023, MATH 101, 3.0, A
Fall 2023, CS 102, 4.0, B+
Spring 2024, ENG 200, 3.0, A-
```

### 2. PDF
**Why Not:**
- Parsing structure from PDF tables is fragile.
- Requires complex heuristics to distinguish between headers, footers, and coursework.
- Often requires server-side processing or heavy client-side libraries.

### 3. JSON
**Why Not:**
- Good for machine backup (e.g., "Export State"), but humans cannot easily write or edit JSON files from scratch.

## Implementation Plan (CSV)

1.  **UI Component:** Add an "Import Data" button to the `SessionManager` or `Header`.
2.  **Parser:** Use a simple CSV parsing logic (split by newline, then comma).
3.  **Mapping Logic:**
    *   Group rows by `Term` column.
    *   Create new Term objects in the app state.
    *   Map `Grade` letters to the internal scale (handle validation).
4.  **Feedback:** Show a preview of parsed data before confirming the overwrite/append.
