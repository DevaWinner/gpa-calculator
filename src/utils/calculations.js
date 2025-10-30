// Fixed 4.0 scale with +/- ; W excluded from GPA math; UW = 0
export const SCALE = {
	letters: [
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
		"F",
		"UW",
		"W",
	],
	points: {
		A: 4.0,
		"A-": 3.7,
		"B+": 3.4,
		B: 3.0,
		"B-": 2.7,
		"C+": 2.4,
		C: 2.0,
		"C-": 1.7,
		"D+": 1.4,
		D: 1.0,
		"D-": 0.7,
		F: 0.0,
		UW: 0.0,
		W: null,
	},
};

// Helper to eliminate floating point errors - round to 6 decimal places
const cleanFloat = (n) => {
	return Math.round(n * 1000000) / 1000000;
};

// Format values with appropriate decimal places
export const fmt = (n, valueType = "other") => {
	const decimals = valueType === "gpa" ? 3 : 2;
	if (!Number.isFinite(n)) return (0).toFixed(decimals);

	// Clean the float first to eliminate JavaScript floating point errors
	const cleaned = cleanFloat(n);

	// Truncate by multiplying, flooring, then dividing
	const factor = Math.pow(10, decimals);
	const truncated = Math.floor(cleaned * factor) / factor;

	return truncated.toFixed(decimals);
};

export const computeRetakeExclusionsMap = (terms) => {
	const excludeFromTerm = {}; // rowId -> startTermIdx

	for (const t of terms) {
		const termIdx = t.termIndex;
		for (const r of t.rows) {
			const target = r.retakeOf;
			if (!target) continue;

			// Find the target row
			let targetTermIdx = null;
			for (const term of terms) {
				if (term.rows.find((row) => row.id === target)) {
					targetTermIdx = term.termIndex;
					break;
				}
			}

			if (targetTermIdx && targetTermIdx < termIdx) {
				excludeFromTerm[target] = Math.min(
					excludeFromTerm[target] ?? termIdx,
					termIdx
				);
			}
		}
	}

	return excludeFromTerm;
};

export const termCalc = (term, excludeMap) => {
	const map = SCALE.points;
	let attempted = 0,
		earned = 0,
		qp = 0,
		w_credits = 0;

	const rowsWithCache = term.rows.map((r) => {
		const units = parseFloat(r.units) || 0;
		const grade = r.grade;
		const gRaw = map[grade];
		const gVal = gRaw === null ? null : gRaw ?? 0;

		// Always count attempted (even W)
		attempted = cleanFloat(attempted + units);

		if (gVal === null) w_credits = cleanFloat(w_credits + units);

		// CRITICAL FIX: Clean immediately after multiplication
		const q = gVal === null ? 0 : cleanFloat(units * gVal);

		// Earned excludes W and any non-passing (gVal <= 0)
		if (gVal > 0) earned = cleanFloat(earned + units);
		qp = cleanFloat(qp + q);

		return {
			...r,
			gVal,
			q,
			exclusionStart: excludeMap[r.id],
		};
	});

	const denom = cleanFloat(attempted - w_credits);
	const gpa = denom > 0 ? cleanFloat(qp / denom) : 0;

	return {
		rows: rowsWithCache,
		attempted: cleanFloat(attempted),
		earned: cleanFloat(earned),
		qp: cleanFloat(qp),
		gpa: cleanFloat(gpa),
	};
};

export const computeCumMetrics = (terms, upToTermIdx, excludeMap) => {
	let attempted = 0,
		earned = 0,
		qp = 0,
		w_credits = 0;

	for (const t of terms) {
		if (t.termIndex > upToTermIdx) break;

		const termData = termCalc(t, excludeMap);

		for (const r of termData.rows) {
			const excludedNow =
				r.exclusionStart !== undefined && upToTermIdx >= r.exclusionStart;
			if (excludedNow) continue;

			const units = parseFloat(r.units) || 0;
			// Attempted always includes, even if gVal is null (W)
			attempted = cleanFloat(attempted + units);
			if (r.gVal === null) w_credits = cleanFloat(w_credits + units); // W credits
			if (r.gVal > 0) earned = cleanFloat(earned + units);
			if (r.gVal !== null) qp = cleanFloat(qp + r.q); // W contributes 0 QP already
		}
	}

	const denom = cleanFloat(attempted - w_credits); // GPA denominator excludes W credits
	const gpa = denom > 0 ? cleanFloat(qp / denom) : 0;

	return {
		attempted: cleanFloat(attempted),
		earned: cleanFloat(earned),
		qp: cleanFloat(qp),
		gpa: cleanFloat(gpa),
	};
};

export const buildEarlierCourseOptions = (
	terms,
	currentTermIdx,
	currentRowId
) => {
	const opts = [];

	for (const t of terms) {
		const tIdx = t.termIndex;
		if (tIdx >= currentTermIdx) break;

		for (const r of t.rows) {
			const rid = r.id;
			if (!rid || rid === currentRowId) continue;
			const name = r.name?.trim() || "(Unnamed)";
			const units = parseFloat(r.units) || 0;
			const grade = r.grade || "";
			const label = `Term ${tIdx} — ${name} [${units || 0}u, ${grade}]`;
			opts.push({ value: rid, label });
		}
	}

	return opts;
};

export const buildEarlierCoursesByTerm = (
	terms,
	currentTermIdx,
	currentRowId
) => {
	const termGroups = [];

	for (const t of terms) {
		const tIdx = t.termIndex;
		if (tIdx >= currentTermIdx) break;

		const courses = [];
		for (const r of t.rows) {
			const rid = r.id;
			if (!rid || rid === currentRowId) continue;
			const name = r.name?.trim() || "(Unnamed)";
			const units = parseFloat(r.units) || 0;
			const grade = r.grade || "";
			courses.push({
				rowId: rid,
				label: name,
				units,
				grade,
			});
		}

		if (courses.length > 0) {
			termGroups.push({
				termIndex: tIdx,
				termName: t.name || `Term ${tIdx}`,
				courses,
			});
		}
	}

	return termGroups;
};
