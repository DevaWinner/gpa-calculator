import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseTranscriptCSV } from "../../src/utils/csvParser.js";
import { applyImportedTerms, deriveTermSortKey } from "../../src/utils/importUtils.js";
import { parsePastedTranscript } from "../../src/utils/pasteParser.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const readFixture = (name) =>
	fs.readFileSync(path.join(__dirname, "../fixtures/import", name), "utf8");

test("parses a basic transcript and reports skipped header lines", () => {
	const parsed = parseTranscriptCSV(readFixture("basic-transcript.csv"));

	assert.equal(parsed.terms.length, 2);
	assert.deepEqual(
		parsed.terms.map((term) => term.name),
		["2023 Fall Semester", "2024 Spring Semester"]
	);
	assert.equal(parsed.diagnostics.summary.parsedCourses, 3);
	assert.equal(parsed.validation.summary.warningCount, 0);
	assert.ok(parsed.diagnostics.skippedLines.length >= 1);
});

test("parses second summer block term headers", () => {
	const parsed = parseTranscriptCSV(readFixture("second-summer-block.csv"));

	assert.equal(parsed.terms.length, 2);
	assert.equal(parsed.terms[0].name, "2002 Second Summer Block");
	assert.equal(parsed.terms[0].rows[0].name, "MATH101");
	assert.equal(parsed.terms[1].name, "2002 Fall Semester");
});

test("parses season block headers with block numbers", () => {
	const parsed = parseTranscriptCSV(
		[
			'"2022 Fall Block 1 09/01/2022","MATH 101","","3","3","","A"',
			'"2022 Fall Block 2 10/20/2022","ENG 201","","3","3","","B+"',
		].join("\n")
	);

	assert.equal(parsed.terms.length, 2);
	assert.deepEqual(
		parsed.terms.map((term) => term.name),
		["2022 Fall Block 1", "2022 Fall Block 2"]
	);
	assert.equal(parsed.terms[0].rows[0].name, "MATH101");
	assert.equal(parsed.terms[1].rows[0].name, "ENG201");
	assert.notEqual(deriveTermSortKey("2022 Fall Block 2"), null);
	assert.ok(
		deriveTermSortKey("2022 Fall Block 2") > deriveTermSortKey("2022 Fall Block 1")
	);
});

test("normalizes imported WT grades to W", () => {
	const parsed = parseTranscriptCSV(
		'"2024 Spring Semester 01/08/2024","ENG 101","","3","3","","WT"'
	);

	assert.equal(parsed.terms.length, 1);
	assert.equal(parsed.terms[0].rows.length, 1);
	assert.equal(parsed.terms[0].rows[0].grade, "W");
	assert.equal(parsed.diagnostics.summary.parsedCourses, 1);
});

test("parses pasted hyphenated and single-letter course codes", () => {
	const parsed = parsePastedTranscript(
		[
			"2024 Winter Semester",
			"PE-C160",
			"Physical Fitness",
			"3",
			"3",
			"3",
			"A",
			"B211",
			"Business Ethics",
			"4",
			"4",
			"4",
			"UW **",
		].join("\n")
	);

	assert.equal(parsed.terms.length, 1);
	assert.equal(parsed.terms[0].rows.length, 2);
	assert.deepEqual(
		parsed.terms[0].rows.map((row) => row.name),
		["PE-C160", "B211"]
	);
	assert.deepEqual(
		parsed.terms[0].rows.map((row) => row.grade),
		["A", "UW"]
	);
});

test("parses pasted slash-separated course codes", () => {
	const parsed = parsePastedTranscript(
		[
			"2024 Fall Semester",
			"ED/P205",
			"Educational Psychology",
			"3",
			"3",
			"3",
			"B+",
		].join("\n")
	);

	assert.equal(parsed.terms.length, 1);
	assert.equal(parsed.terms[0].rows.length, 1);
	assert.equal(parsed.terms[0].rows[0].name, "ED/P205");
	assert.equal(parsed.terms[0].rows[0].grade, "B+");
});

test("parses pasted dotted course codes", () => {
	const parsed = parsePastedTranscript(
		[
			"2024 Spring Semester",
			"PH.S100",
			"Health Science",
			"3",
			"3",
			"3",
			"A-",
		].join("\n")
	);

	assert.equal(parsed.terms.length, 1);
	assert.equal(parsed.terms[0].rows.length, 1);
	assert.equal(parsed.terms[0].rows[0].name, "PH.S100");
	assert.equal(parsed.terms[0].rows[0].grade, "A-");
});

test("reports unknown headers, course rows without terms, and ignored transfers", () => {
	const parsed = parseTranscriptCSV(readFixture("mixed-noise.csv"));
	const issueCodes = parsed.diagnostics.issues.map((issue) => issue.code);
	const skippedCodes = parsed.diagnostics.skippedLines.map((line) => line.code);

	assert.ok(issueCodes.includes("unknown-term-header"));
	assert.ok(issueCodes.includes("course-without-term"));
	assert.ok(skippedCodes.includes("ignored-line"));
	assert.equal(parsed.diagnostics.ignoredTransfers.length, 1);
	assert.equal(parsed.terms.length, 1);
	assert.equal(parsed.terms[0].name, "2002 Fall Semester");
});

test("applyImportedTerms supports replace, append, and merge strategies", () => {
	const existingTerms = [
		{
			termIndex: 1,
			name: "2023 Fall Semester",
			isHighlighted: false,
			rows: [{ id: "1", name: "MATH101", units: 3, grade: "B", retakeOf: null }],
		},
	];
	const importedTerms = [
		{
			termIndex: 1,
			name: "2023 Fall Semester",
			rows: [{ id: "1", name: "ENG101", units: 3, grade: "A", retakeOf: null }],
		},
		{
			termIndex: 2,
			name: "2024 Spring Semester",
			rows: [{ id: "2", name: "CS101", units: 4, grade: "A", retakeOf: null }],
		},
	];

	const replaced = applyImportedTerms({
		existingTerms,
		importedTerms,
		startingRowId: 10,
		mode: "replace",
	});
	assert.equal(replaced.terms.length, 2);
	assert.equal(replaced.terms[0].rows[0].id, "10");
	assert.equal(replaced.nextRowId, 12);

	const appended = applyImportedTerms({
		existingTerms,
		importedTerms,
		startingRowId: 10,
		mode: "append",
	});
	assert.equal(appended.terms.length, 3);
	assert.equal(appended.terms[1].name, "2023 Fall Semester");
	assert.equal(appended.terms[2].name, "2024 Spring Semester");

	const merged = applyImportedTerms({
		existingTerms,
		importedTerms,
		startingRowId: 10,
		mode: "merge",
	});
	assert.equal(merged.terms.length, 2);
	assert.equal(merged.terms[0].rows.length, 2);
	assert.equal(merged.terms[1].name, "2024 Spring Semester");
});
