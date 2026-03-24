const TERM_SEASON_ORDER = {
	WINTER: 0,
	SPRING: 1,
	SUMMER: 2,
	FALL: 3,
};

const TERM_ORDINAL_ORDER = {
	FIRST: 0,
	SECOND: 1,
	THIRD: 2,
	FOURTH: 3,
};

export const normalizeCourseCode = (value = "") =>
	value.replace(/\s+/g, "").toUpperCase();

export const normalizeTermName = (value = "") =>
	value.replace(/\s+/g, " ").trim().toUpperCase();

export const deriveTermSortKey = (termName = "") => {
	const normalized = termName.replace(/\s+/g, " ").trim();

	let match = normalized.match(
		/^(\d{4})\s+(?:(First|Second|Third|Fourth)\s+)?(Winter|Spring|Summer|Fall)(?:\s+(?:Semester|Term|Session|Block(?:\s+(\d+))?))?$/i
	);
	if (match) {
		const [, yearText, ordinalText, seasonText, blockNumberText] = match;
		const base = Number(yearText) * 100;
		const season = TERM_SEASON_ORDER[seasonText.toUpperCase()];
		const ordinal = ordinalText
			? TERM_ORDINAL_ORDER[ordinalText.toUpperCase()] / 100
			: 0;
		const blockNumber = blockNumberText ? Number(blockNumberText) / 1000 : 0;

		return base + season + ordinal + blockNumber;
	}

	match = normalized.match(/^(\d{4})\s+Term\s+(\d+)$/i);
	if (match) {
		const [, yearText, termNumberText] = match;
		return Number(yearText) * 100 + Number(termNumberText);
	}

	match = normalized.match(/^(\d{4})\s+Semester\s+([A-Za-z]+)$/i);
	if (match) {
		const [, yearText, seasonText] = match;
		const season = TERM_SEASON_ORDER[seasonText.toUpperCase()];
		if (season !== undefined) {
			return Number(yearText) * 100 + season;
		}
	}

	return null;
};

const cloneImportedRow = (row, id) => ({
	id: String(id),
	name: normalizeCourseCode(row.name),
	units: row.units,
	grade: row.grade,
	retakeOf: null,
	isManuallyUnlinked: false,
});

const cloneImportedTerm = (term, rows) => ({
	termIndex: term.termIndex,
	name: term.name,
	isHighlighted: false,
	isMinimized: false,
	rows,
});

const reindexTerms = (terms) =>
	terms.map((term, index) => ({
		...term,
		termIndex: index + 1,
		rows: term.rows.map((row) => ({
			...row,
			retakeOf: null,
		})),
	}));

const buildIssue = ({ code, severity = "warning", title, detail, termName }) => ({
	code,
	severity,
	title,
	detail,
	termName,
});

export const validateImportedTerms = (terms = []) => {
	const issues = [];
	const termCounts = new Map();
	const sortKeys = [];

	for (const term of terms) {
		const normalizedName = normalizeTermName(term.name);
		termCounts.set(normalizedName, (termCounts.get(normalizedName) || 0) + 1);

		if (!term.rows || term.rows.length === 0) {
			issues.push(
				buildIssue({
					code: "empty-term",
					title: "Empty imported term",
					detail: `${term.name} has no importable courses.`,
					termName: term.name,
				})
			);
		}

		const courseCounts = new Map();
		for (const row of term.rows || []) {
			const normalizedCode = normalizeCourseCode(row.name);
			courseCounts.set(normalizedCode, (courseCounts.get(normalizedCode) || 0) + 1);

			if (!normalizedCode || !row.grade || !(parseFloat(row.units) > 0)) {
				issues.push(
					buildIssue({
						code: "suspicious-row",
						title: "Suspicious imported row",
						detail: `${term.name} contains a row with missing code, grade, or units.`,
						termName: term.name,
					})
				);
			}
		}

		for (const [courseCode, count] of courseCounts.entries()) {
			if (courseCode && count > 1) {
				issues.push(
					buildIssue({
						code: "duplicate-course",
						title: "Duplicate course in imported term",
						detail: `${courseCode} appears ${count} times in ${term.name}.`,
						termName: term.name,
					})
				);
			}
		}

		const sortKey = deriveTermSortKey(term.name);
		if (sortKey !== null) {
			sortKeys.push({ termName: term.name, sortKey });
		}
	}

	for (const term of terms) {
		const normalizedName = normalizeTermName(term.name);
		if ((termCounts.get(normalizedName) || 0) > 1) {
			issues.push(
				buildIssue({
					code: "duplicate-term",
					title: "Duplicate imported term name",
					detail: `${term.name} appears multiple times in the imported file.`,
					termName: term.name,
				})
			);
		}
	}

	for (let index = 1; index < sortKeys.length; index += 1) {
		if (sortKeys[index].sortKey < sortKeys[index - 1].sortKey) {
			issues.push(
				buildIssue({
					code: "term-order",
					title: "Imported terms look out of order",
					detail: `${sortKeys[index].termName} appears after ${sortKeys[index - 1].termName}.`,
					termName: sortKeys[index].termName,
				})
			);
		}
	}

	return {
		issues,
		summary: {
			warningCount: issues.filter((issue) => issue.severity === "warning").length,
			errorCount: issues.filter((issue) => issue.severity === "error").length,
		},
	};
};

export const applyImportedTerms = ({
	existingTerms = [],
	importedTerms = [],
	startingRowId = 1,
	mode = "replace",
}) => {
	let nextRowId = startingRowId;
	const cloneRows = (rows) =>
		rows.map((row) => {
			const cloned = cloneImportedRow(row, nextRowId);
			nextRowId += 1;
			return cloned;
		});

	if (mode === "replace") {
		return {
			terms: reindexTerms(
				importedTerms.map((term) => cloneImportedTerm(term, cloneRows(term.rows || [])))
			),
			nextRowId,
		};
	}

	const baseTerms = existingTerms.map((term) => ({
		...term,
		rows: term.rows.map((row) => ({ ...row })),
	}));

	if (mode === "append") {
		return {
			terms: reindexTerms([
				...baseTerms,
				...importedTerms.map((term) =>
					cloneImportedTerm(term, cloneRows(term.rows || []))
				),
			]),
			nextRowId,
		};
	}

	if (mode === "merge") {
		const termIndexByName = new Map(
			baseTerms.map((term, index) => [normalizeTermName(term.name), index])
		);

		for (const term of importedTerms) {
			const normalizedName = normalizeTermName(term.name);
			const importedRows = cloneRows(term.rows || []);
			const existingIndex = termIndexByName.get(normalizedName);

			if (existingIndex !== undefined) {
				baseTerms[existingIndex] = {
					...baseTerms[existingIndex],
					rows: [...baseTerms[existingIndex].rows, ...importedRows],
				};
			} else {
				baseTerms.push(cloneImportedTerm(term, importedRows));
				termIndexByName.set(normalizedName, baseTerms.length - 1);
			}
		}

		return {
			terms: reindexTerms(baseTerms),
			nextRowId,
		};
	}

	throw new Error(`Unsupported import mode: ${mode}`);
};
