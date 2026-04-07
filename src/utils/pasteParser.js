import { normalizeCourseCode, validateImportedTerms } from "./importUtils.js";

const VALID_GRADES = new Set([
	"A",
	"A-",
	"B+",
	"B",
	"B-",
	"C+",
	"C",
	"C-",
	"D+",
	"D",
	"D-",
	"E",
	"F",
	"UW",
	"W",
	"P",
]);

const GRADE_ALIASES = {
	WT: "W",
};

const DATE_REGEX = /\d{1,2}\/\d{1,2}\/\d{4}/;
const TRANSFER_REGEX = /Transfer Term/i;

// Term header patterns - match lines like "2023 Spring Semester" or "2025 Term 2"
const TERM_HEADER_PATTERNS = [
	// "2023 Spring Semester" with date
	/^(\d{4}\s+(?:(?:First|Second|Third|Fourth)\s+)?(?:Fall|Winter|Spring|Summer)(?:\s+(?:Semester|Term|Session|Block(?:\s+\d+)?))?)(?:\s+\d{1,2}\/\d{1,2}\/\d{4})?/i,
	// "2025 Semester Winter" (reversed order)
	/^(\d{4}\s+Semester\s+(?:Fall|Winter|Spring|Summer))(?:\s+\d{1,2}\/\d{1,2}\/\d{4})?/i,
	// "2025 Term 2"
	/^(\d{4}\s+Term\s+\d+)(?:\s+\d{1,2}\/\d{1,2}\/\d{4})?/i,
	// "2026 Block 1"
	/^(\d{4}\s+Block\s+\d+)(?:\s+\d{1,2}\/\d{1,2}\/\d{4})?/i,
];

// Lines to skip (only when not parsing a course)
const SKIP_PATTERNS = [
	/^Beginning of/i,
	/^End of/i,
	/^Course\s*$/i,
	/^Code\s*$/i,
	/^Credits\s*$/i,
	/^Attempted\s*$/i,
	/^Earned\s*$/i,
	/^Quality\s*$/i,
	/^Points\s*$/i,
	/^Grade\s*$/i,
	/^Description\s*$/i,
	/^Term Totals:/i,
	/^Cum Totals:/i,
	/^Term GPA:/i,
	/^Cum GPA:/i,
	/^Course\s+Code$/i,
	/^Credits\s+Attempted$/i,
	/^Credits\s+Earned$/i,
	/^Quality\s+Points$/i,
	/^Course\s+Description$/i,
];

const normalizeSpaces = (value = "") => value.replace(/\s+/g, " ").trim();

const normalizeGrade = (value = "") => {
	// Remove ** suffix and normalize
	const cleaned = (value || "").replace(/\s*\*+\s*$/, "").trim();
	const normalized = normalizeSpaces(cleaned).split(" ")[0].toUpperCase();
	return GRADE_ALIASES[normalized] || normalized;
};

const buildIssue = ({
	code,
	severity = "warning",
	title,
	detail,
	lineNumber,
	rawLine,
}) => ({
	code,
	severity,
	title,
	detail,
	lineNumber,
	rawLine,
});

const buildSkippedLine = ({ code, reason, lineNumber, rawLine }) => ({
	code,
	reason,
	lineNumber,
	rawLine,
});

/**
 * Check if a line is a term header and extract the term name
 */
const extractTermHeader = (line) => {
	const cleaned = normalizeSpaces(line);

	if (!cleaned) {
		return null;
	}

	if (TRANSFER_REGEX.test(cleaned)) {
		return { type: "transfer", rawText: cleaned };
	}

	for (const pattern of TERM_HEADER_PATTERNS) {
		const match = cleaned.match(pattern);
		if (match) {
			return {
				type: "term",
				termName: normalizeSpaces(match[1]),
				rawText: cleaned,
			};
		}
	}

	// Check if it looks like a term header but didn't match
	if (/\d{4}/.test(cleaned) && /\b(Fall|Winter|Spring|Summer|Semester|Term|Block)\b/i.test(cleaned)) {
		// Try to extract just the term part
		const termMatch = cleaned.match(/(\d{4}\s+(?:Semester\s+)?(?:Fall|Winter|Spring|Summer|Term\s+\d+|Block\s+\d+)(?:\s+Semester)?)/i);
		if (termMatch) {
			return {
				type: "term",
				termName: normalizeSpaces(termMatch[1]),
				rawText: cleaned,
			};
		}
		return { type: "unknown", rawText: cleaned };
	}

	return null;
};

/**
 * Check if a line should be skipped
 */
const shouldSkipLine = (line) => {
	const cleaned = normalizeSpaces(line);
	if (!cleaned) {
		return true;
	}

	for (const pattern of SKIP_PATTERNS) {
		if (pattern.test(cleaned)) {
			return true;
		}
	}

	return false;
};

/**
 * Parse pasted text to extract course information
 * The pasted format has course code on one line, course name on next, then credits/grade info on separate lines
 */
export const parsePastedTranscript = (text) => {
	const lines = text
		.replace(/\r\n/g, "\n")
		.replace(/\r/g, "\n")
		.split("\n")
		.map((line) => normalizeSpaces(line));

	const terms = [];
	const diagnostics = {
		issues: [],
		skippedLines: [],
		detectedTerms: [],
		ignoredTransfers: [],
		summary: {
			totalLines: lines.length,
			parsedTerms: 0,
			parsedCourses: 0,
			skippedLines: 0,
			ignoredTransfers: 0,
			warningCount: 0,
			errorCount: 0,
		},
	};

	let currentTerm = null;
	let termCounter = 1;
	let rowCounter = 1;

	// State machine for parsing course blocks
	let pendingCourseCode = null;
	let pendingCourseName = null;
	let pendingCredits = [];

	const finalizeCourse = () => {
		if (pendingCourseCode && currentTerm && pendingCredits.length >= 3) {
			// Find the grade in pendingCredits (it's the non-numeric value)
			let grade = null;
			const numericCredits = [];
			
			for (const val of pendingCredits) {
				const trimmed = val.trim();
				if (/^[A-Z][+-]?$/i.test(trimmed)) {
					grade = normalizeGrade(trimmed);
				} else if (/^\d+\.?\d*$/.test(trimmed)) {
					numericCredits.push(parseFloat(trimmed));
				}
			}

			if (grade && VALID_GRADES.has(grade) && numericCredits.length >= 1) {
				currentTerm.rows.push({
					id: String(rowCounter),
					name: normalizeCourseCode(pendingCourseCode),
					units: numericCredits[0], // First numeric is attempted credits
					grade,
					retakeOf: null,
				});
				rowCounter += 1;
			}
		}
		
		pendingCourseCode = null;
		pendingCourseName = null;
		pendingCredits = [];
	};

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const lineNumber = i + 1;

		if (!line) {
			continue;
		}

		// Check for term header
		const termHeader = extractTermHeader(line);
		if (termHeader) {
			// Finalize any pending course before moving to new term
			finalizeCourse();

			if (termHeader.type === "transfer") {
				currentTerm = null;
				diagnostics.ignoredTransfers.push({
					lineNumber,
					rawLine: termHeader.rawText,
				});
				continue;
			}

			if (termHeader.type === "unknown") {
				diagnostics.issues.push(
					buildIssue({
						code: "unknown-term-header",
						severity: "warning",
						title: "Unrecognized term header",
						detail: "This line looks like a term header but did not match any supported pattern.",
						lineNumber,
						rawLine: termHeader.rawText,
					})
				);
			}

			if (termHeader.type === "term" || termHeader.type === "unknown") {
				const termName = termHeader.termName || termHeader.rawText;
				if (!currentTerm || currentTerm.name !== termName) {
					currentTerm = {
						termIndex: termCounter,
						name: termName,
						rows: [],
					};
					termCounter += 1;
					terms.push(currentTerm);
					diagnostics.detectedTerms.push({
						lineNumber,
						rawLine: termHeader.rawText,
						termName,
					});
				}
			}
			continue;
		}

		// Skip header/summary lines
		if (shouldSkipLine(line)) {
			continue;
		}

		// Check if this is a course code (e.g., "FHGEN110", "GE103", "REL 275C", "REL  275C")
		// Allow optional spaces between letters and numbers
		const courseCodeMatch = line.match(/^([A-Z]{2,6})\s*(\d{2,4}[A-Z]?)$/i);
		if (courseCodeMatch) {
			// Finalize previous course if any
			finalizeCourse();
			
			// Combine without spaces
			pendingCourseCode = (courseCodeMatch[1] + courseCodeMatch[2]).toUpperCase();
			continue;
		}

		// If we have a pending course code, collect data
		if (pendingCourseCode) {
			// Check if this is a grade (single letter with optional +/- and optional **)
			if (/^[A-Z][+-]?\s*\*{0,2}\s*$/i.test(line)) {
				pendingCredits.push(line.replace(/\s*\*+\s*$/, "").trim());
				// After getting grade, try to finalize
				finalizeCourse();
				continue;
			}
			
			// Check if this is a credit number
			if (/^\d+\.?\d*$/.test(line)) {
				pendingCredits.push(line);
				continue;
			}
			
			// Check if this line has credits and grade together (e.g., "3.00 3.00 10.20 B+ **")
			const combinedMatch = line.match(/^(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+([A-Z][+-]?)\s*\*{0,2}\s*$/i);
			if (combinedMatch) {
				pendingCredits.push(combinedMatch[1], combinedMatch[2], combinedMatch[3], combinedMatch[4]);
				finalizeCourse();
				continue;
			}
			
			// If not a number or grade, it's probably the course name
			if (!pendingCourseName && line.length > 3) {
				pendingCourseName = line;
				continue;
			}
		}

		// Didn't match anything significant
		if (line.length > 2 && !/^\d+\.?\d*$/.test(line)) {
			diagnostics.skippedLines.push(
				buildSkippedLine({
					code: "unrecognized",
					reason: "Line did not match course code, grade, or term pattern.",
					lineNumber,
					rawLine: line,
				})
			);
		}
	}

	// Finalize any remaining course
	finalizeCourse();

	const validation = validateImportedTerms(terms);

	diagnostics.summary = {
		totalLines: lines.filter((l) => l).length,
		parsedTerms: terms.length,
		parsedCourses: terms.reduce((sum, term) => sum + term.rows.length, 0),
		skippedLines: diagnostics.skippedLines.length,
		ignoredTransfers: diagnostics.ignoredTransfers.length,
		warningCount:
			diagnostics.issues.filter((issue) => issue.severity === "warning").length +
			validation.summary.warningCount,
		errorCount:
			diagnostics.issues.filter((issue) => issue.severity === "error").length +
			validation.summary.errorCount,
	};

	if (terms.length === 0) {
		diagnostics.issues.push(
			buildIssue({
				code: "no-terms",
				severity: "error",
				title: "No terms found",
				detail: "The pasted text did not contain any recognized term headers.",
			})
		);
		diagnostics.summary.errorCount += 1;
	}

	return {
		terms,
		nextRowId: rowCounter,
		diagnostics,
		validation,
	};
};
