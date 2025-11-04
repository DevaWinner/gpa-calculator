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
	const retakeGroups = {}; // Map courseId -> array of all instances
	const cumulativeExclusions = {}; // rowId -> startingFromTermIndex

	// First, identify all retake relationships and group them
	for (const t of terms) {
		for (const r of t.rows) {
			if (r.retakeOf) {
				// Find the original course
				let originalCourse = null;
				let originalTermIndex = null;
				for (const term of terms) {
					const found = term.rows.find((row) => row.id === r.retakeOf);
					if (found) {
						originalCourse = found;
						originalTermIndex = term.termIndex;
						break;
					}
				}

				if (originalCourse && originalTermIndex) {
					// Use the original course ID as the group identifier
					const groupId = r.retakeOf;

					if (!retakeGroups[groupId]) {
						retakeGroups[groupId] = [];
					}

					// Only add the original course once to the group
					if (
						!retakeGroups[groupId].some(
							(instance) => instance.rowId === r.retakeOf
						)
					) {
						retakeGroups[groupId].push({
							rowId: r.retakeOf,
							termIndex: originalTermIndex,
							grade: originalCourse.grade,
							units: parseFloat(originalCourse.units) || 0,
						});
					}

					// Add the current retake instance
					retakeGroups[groupId].push({
						rowId: r.id,
						termIndex: t.termIndex,
						grade: r.grade,
						units: parseFloat(r.units) || 0,
					});
				}
			}
		}
	}

	// Debug log to see what retake groups we found
	console.log("Retake groups:", retakeGroups);

	// Now determine exclusions for each group
	for (const groupId in retakeGroups) {
		const instances = retakeGroups[groupId];
		if (instances.length > 1) {
			// Sort instances by term index to process chronologically
			instances.sort((a, b) => a.termIndex - b.termIndex);

			// Find the retake term (when the second instance occurs)
			const retakeTermIndex = instances[1].termIndex;

			// Determine which instance has the best grade
			let bestInstance = null;
			let bestGradeValue = -1;

			for (const instance of instances) {
				const gradeValue = SCALE.points[instance.grade];
				// Handle null grades (W) - they should not be considered "best"
				if (gradeValue !== null && gradeValue !== undefined) {
					if (bestInstance === null || gradeValue > bestGradeValue) {
						bestGradeValue = gradeValue;
						bestInstance = instance;
					}
				}
			}

			console.log(
				`Group ${groupId}: best instance is`,
				bestInstance,
				"from term",
				bestInstance?.termIndex
			);

			// If we found a best instance, exclude all others from cumulative starting from retake term
			if (bestInstance) {
				for (const instance of instances) {
					if (instance.rowId !== bestInstance.rowId) {
						cumulativeExclusions[instance.rowId] = retakeTermIndex;
						console.log(
							`Excluding row ${instance.rowId} from cumulative starting from term ${retakeTermIndex}`
						);
					}
				}
			}
		}
	}

	console.log("Cumulative exclusions:", cumulativeExclusions);

	return { cumulativeExclusions, retakeGroups };
};

export const termCalc = (term, excludeInfo) => {
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

		// ALL courses count for TERM calculations (no exclusions)
		attempted = cleanFloat(attempted + units);

		if (gVal === null) w_credits = cleanFloat(w_credits + units);

		// For TERM calculations, include ALL courses
		const q = gVal === null ? 0 : cleanFloat(units * gVal);
		qp = cleanFloat(qp + q);

		// Earned credits for TERM calculations:
		// - Include passing grades (> 0)
		// - Exclude F (0.0), UW (0.0), and W (null)
		if (gVal > 0) earned = cleanFloat(earned + units);

		// Mark exclusion info for cumulative calculations
		const excludedFromCumStartingTerm =
			excludeInfo.cumulativeExclusions?.[r.id];

		return {
			...r,
			gVal,
			q,
			excludedFromCumStartingTerm,
		};
	});

	// GPA calculation includes F grades (0.0 grade points)
	// GPA denominator = attempted - W credits (F grades ARE included in denominator)
	const gpaDenom = cleanFloat(attempted - w_credits);
	const gpa = gpaDenom > 0 ? cleanFloat(qp / gpaDenom) : 0;

	return {
		rows: rowsWithCache,
		attempted: cleanFloat(attempted),
		earned: cleanFloat(earned),
		qp: cleanFloat(qp),
		gpa: cleanFloat(gpa),
	};
};

export const computeCumMetrics = (terms, upToTermIdx, excludeInfo) => {
	let attempted = 0,
		earned = 0,
		qp = 0,
		w_credits = 0,
		excluded_credits = 0; // Track credits excluded from GPA calculation

	for (const t of terms) {
		if (t.termIndex > upToTermIdx) break;

		const termData = termCalc(t, excludeInfo);

		for (const r of termData.rows) {
			const units = parseFloat(r.units) || 0;

			// ALL instances count as attempted
			attempted = cleanFloat(attempted + units);
			if (r.gVal === null) w_credits = cleanFloat(w_credits + units);

			// Check if this course should be excluded from cumulative calculation
			const excludeStartTerm = r.excludedFromCumStartingTerm;
			const shouldExcludeFromCum =
				excludeStartTerm !== undefined && upToTermIdx >= excludeStartTerm;

			if (shouldExcludeFromCum) {
				// Track excluded credits (these don't count in GPA denominator)
				excluded_credits = cleanFloat(excluded_credits + units);
			} else {
				// Only include in cumulative earned credits and QP if NOT excluded
				if (r.gVal > 0) earned = cleanFloat(earned + units);
				if (r.gVal !== null) qp = cleanFloat(qp + r.q);
			}
		}
	}

	// GPA denominator = attempted - W credits - excluded retake credits
	const gpaDenom = cleanFloat(attempted - w_credits - excluded_credits);
	const gpa = gpaDenom > 0 ? cleanFloat(qp / gpaDenom) : 0;

	console.log("Cumulative calculation result:", {
		attempted,
		earned,
		qp,
		w_credits,
		excluded_credits,
		gpaDenom,
		gpa,
	});

	return {
		attempted: cleanFloat(attempted), // All courses count as attempted
		earned: cleanFloat(earned), // Only best instances count as earned
		qp: cleanFloat(qp), // Only best instances contribute QP
		gpa: cleanFloat(gpa), // GPA = QP / (attempted - W credits - excluded credits)
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
