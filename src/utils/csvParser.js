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

const IMPORT_GRADE_ALIASES = {
	WT: "W",
};

const DATE_REGEX = /\d{1,2}\/\d{1,2}\/\d{4}/;
const TRANSFER_REGEX = /Transfer Term/i;
const TERM_HEADER_PATTERNS = [
	/^(\d{4}\s+(?:(?:First|Second|Third|Fourth)\s+)?(?:Fall|Winter|Spring|Summer)(?:\s+(?:(?:Semester|Term|Session)|(?:Block(?:\s+\d+)?)))?)$/i,
	/^(\d{4}\s+Term\s+\d+)$/i,
	/^(\d{4}\s+Block\s+\d+)$/i,
	/^(\d{4}\s+Semester\s+[A-Za-z]+)$/i,
	/^(Historical Campus Term Semester)$/i,
];

const normalizeSpaces = (value = "") => value.replace(/\s+/g, " ").trim();

export const cleanCsvField = (value = "") =>
	value ? value.replace(/^"|"$/g, "").trim() : "";

const normalizeCsvText = (csvText = "") =>
	csvText.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");

export const parseCsvRecords = (csvText = "") => {
	const text = normalizeCsvText(csvText);
	const records = [];

	let columns = [];
	let field = "";
	let rawRecord = "";
	let inQuotes = false;
	let currentLine = 1;
	let recordStartLine = 1;

	const finalizeRecord = () => {
		const nextColumns = [...columns, field];
		const hasContent = nextColumns.some((column) => normalizeSpaces(column) !== "");

		if (hasContent) {
			records.push({
				columns: nextColumns,
				rawRecord,
				lineNumber: recordStartLine,
			});
		}

		columns = [];
		field = "";
		rawRecord = "";
	};

	for (let index = 0; index < text.length; index += 1) {
		const character = text[index];

		if (character === '"') {
			if (inQuotes && text[index + 1] === '"') {
				field += '"';
				rawRecord += '""';
				index += 1;
				continue;
			}

			inQuotes = !inQuotes;
			rawRecord += character;
			continue;
		}

		if (character === "," && !inQuotes) {
			columns.push(field);
			field = "";
			rawRecord += character;
			continue;
		}

		if (character === "\n" && !inQuotes) {
			finalizeRecord();
			currentLine += 1;
			recordStartLine = currentLine;
			continue;
		}

		field += character;
		rawRecord += character;

		if (character === "\n") {
			currentLine += 1;
		}
	}

	if (field !== "" || columns.length > 0 || rawRecord !== "") {
		finalizeRecord();
	}

	return {
		records,
		totalLines: text === "" ? 0 : text.split("\n").length,
	};
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

const isNumeric = (value) => !Number.isNaN(parseFloat(value)) && Number.isFinite(parseFloat(value));

const normalizeGrade = (value = "") => {
	const normalized = normalizeSpaces(value).split(" ")[0].toUpperCase();
	return IMPORT_GRADE_ALIASES[normalized] || normalized;
};

const extractTermHeader = (columns) => {
	for (const column of columns) {
		const cleaned = normalizeSpaces(cleanCsvField(column));
		if (!cleaned) {
			continue;
		}

		if (TRANSFER_REGEX.test(cleaned)) {
			return { type: "transfer", rawText: cleaned };
		}

		if (!DATE_REGEX.test(cleaned)) {
			continue;
		}

		const dateMatch = cleaned.match(DATE_REGEX);
		const labelText = normalizeSpaces(cleaned.slice(0, dateMatch.index));

		for (const pattern of TERM_HEADER_PATTERNS) {
			const match = labelText.match(pattern);
			if (match) {
				return {
					type: "term",
					termName: normalizeSpaces(match[1]),
					rawText: cleaned,
				};
			}
		}

		if (/\d{4}/.test(cleaned) && /\b(Fall|Winter|Spring|Summer|Semester|Term|Session|Block)\b/i.test(cleaned)) {
			return { type: "unknown", rawText: cleaned };
		}
	}

	return null;
};

const extractCourseRow = (columns) => {
	for (let index = 0; index < columns.length - 3; index += 1) {
		const attempted = cleanCsvField(columns[index]);
		const earned = cleanCsvField(columns[index + 1]);
		const grade = normalizeGrade(columns[index + 3]);

		if (!VALID_GRADES.has(grade)) {
			continue;
		}

		if (!isNumeric(attempted) || !isNumeric(earned)) {
			continue;
		}

		const courseCode = normalizeCourseCode(cleanCsvField(columns[index - 2] || ""));
		const units = parseFloat(attempted);

		return {
			courseCode,
			units,
			grade,
		};
	}

	return null;
};

const classifyIgnoredLine = (rawLine) => {
	const normalized = normalizeSpaces(rawLine);

	if (!normalized) {
		return null;
	}

	if (/\b(Course|Credits|Grade|Quality Points|Attempted|Earned)\b/i.test(normalized)) {
		return "Ignored transcript header row.";
	}

	return "Line did not match a recognized term header or course row.";
};

export const parseTranscriptCSV = (csvText) => {
	const { records, totalLines } = parseCsvRecords(csvText);
	const terms = [];
	const diagnostics = {
		issues: [],
		skippedLines: [],
		detectedTerms: [],
		ignoredTransfers: [],
		summary: {
			totalLines,
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

	for (const record of records) {
		const { columns, rawRecord, lineNumber } = record;
		const termHeader = extractTermHeader(columns);

		if (termHeader) {
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
						title: "Unrecognized term header",
						detail: "This line looks like a term header but did not match any supported transcript pattern.",
						lineNumber,
						rawLine: termHeader.rawText,
					})
				);
				diagnostics.skippedLines.push(
					buildSkippedLine({
						code: "unknown-term-header",
						reason: "Unrecognized term header format.",
						lineNumber,
						rawLine: termHeader.rawText,
					})
				);
				currentTerm = null;
			} else if (!currentTerm || currentTerm.name !== termHeader.termName) {
				currentTerm = {
					termIndex: termCounter,
					name: termHeader.termName,
					rows: [],
				};
				termCounter += 1;
				terms.push(currentTerm);
				diagnostics.detectedTerms.push({
					lineNumber,
					rawLine: termHeader.rawText,
					termName: termHeader.termName,
				});
			}
		}

		const courseRow = extractCourseRow(columns);
		if (courseRow) {
			if (!currentTerm) {
				diagnostics.skippedLines.push(
					buildSkippedLine({
						code: "course-without-term",
						reason: "Course row was found before a recognized term header.",
						lineNumber,
						rawLine: rawRecord,
					})
				);
				diagnostics.issues.push(
					buildIssue({
						code: "course-without-term",
						title: "Course row skipped before any term header",
						detail: "A course row was detected before the parser recognized a term for it.",
						lineNumber,
						rawLine: rawRecord,
					})
				);
				continue;
			}

			if (!courseRow.courseCode) {
				diagnostics.skippedLines.push(
					buildSkippedLine({
						code: "missing-course-code",
						reason: "Course row was recognized, but no course code could be extracted.",
						lineNumber,
						rawLine: rawRecord,
					})
				);
				diagnostics.issues.push(
					buildIssue({
						code: "missing-course-code",
						title: "Course row skipped with no course code",
						detail: "The import keeps course codes only, and this row did not contain one in the expected position.",
						lineNumber,
						rawLine: rawRecord,
					})
				);
				continue;
			}

			currentTerm.rows.push({
				id: String(rowCounter),
				name: courseRow.courseCode,
				units: courseRow.units,
				grade: courseRow.grade,
				retakeOf: null,
			});
			rowCounter += 1;
			continue;
		}

		const ignoredReason = classifyIgnoredLine(rawRecord);
		if (ignoredReason) {
			diagnostics.skippedLines.push(
				buildSkippedLine({
					code: "ignored-line",
					reason: ignoredReason,
					lineNumber,
					rawLine: rawRecord,
				})
			);
		}
	}

	const validation = validateImportedTerms(terms);

	diagnostics.summary = {
		totalLines,
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
				detail: "The uploaded file did not contain any supported term headers.",
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
