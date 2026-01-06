// Fixed 4.0 scale with +/- ; W excluded from GPA math; UW = 0
import { debugLog } from "./debug";

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

	const factor = Math.pow(10, decimals);

	// For GPA: truncate (floor)
	// For other values (quality points, credits): round
	const processed =
		valueType === "gpa"
			? Math.floor(n * factor) / factor
			: Math.round(n * factor) / factor;

	return processed.toFixed(decimals);
};

export const computeRetakeExclusionsMap = (terms) => {
	const retakeGroups = {}; // Map normalizedName -> array of instances
	const cumulativeExclusions = {}; // rowId -> startingFromTermIndex
	const retakeChainInfo = {}; // rowId -> { inRetakeChain: true, bestRowId, excludeFromTerm }

	// First pass: Group all instances by their normalized course name
	for (const t of terms) {
		for (const r of t.rows) {
			const name = r.name ? r.name.trim().toLowerCase() : "";
			if (!name) continue; // Skip unnamed courses

			// If grade is W, skip it for retake grouping purposes (it doesn't replace and isn't replaced)
			// But we still process it in termCalc for simple exclusion.
			// Actually, if we have W, it shouldn't participate in "Best Grade" logic.
			if (r.grade === "W") continue;

			if (!retakeGroups[name]) {
				retakeGroups[name] = [];
			}

			retakeGroups[name].push({
				rowId: r.id,
				termIndex: t.termIndex,
				grade: r.grade,
				units: parseFloat(r.units) || 0,
			});
		}
	}

	// Debug log to see what retake groups we found
	debugLog("Retake groups (by name):", retakeGroups);

	// Now determine exclusions for each group
	for (const name in retakeGroups) {
		const instances = retakeGroups[name];
		if (instances.length > 1) {
			// Sort instances by term index to process chronologically
			instances.sort((a, b) => a.termIndex - b.termIndex);

			// Determine which instance has the best grade
			let bestInstance = null;
			let bestGradeValue = -1;

			for (const instance of instances) {
				const gradeValue = SCALE.points[instance.grade];
				// Handle null grades (shouldn't happen here due to W check, but safety first)
				if (gradeValue !== null && gradeValue !== undefined) {
					if (bestInstance === null || gradeValue > bestGradeValue) {
						bestGradeValue = gradeValue;
						bestInstance = instance;
					} else if (gradeValue === bestGradeValue) {
						// If grades are equal, use the later attempt
						if (instance.termIndex > bestInstance.termIndex) {
							bestInstance = instance;
						}
					}
				}
			}

			if (bestInstance) {
				const bestTermIndex = bestInstance.termIndex;

				for (const instance of instances) {
					// Mark all rows as part of a retake chain
					retakeChainInfo[instance.rowId] = {
						inRetakeChain: true,
						bestRowId: bestInstance.rowId,
						bestTermIndex: bestTermIndex,
					};

					// Only add to cumulativeExclusions if it's NOT the best grade
					if (instance.rowId !== bestInstance.rowId) {
						// Each inferior attempt should be excluded starting from the NEXT term after it was taken
						const excludeFromTerm = instance.termIndex + 1;
						cumulativeExclusions[instance.rowId] = excludeFromTerm;
					}
				}
			}
		}
	}

	return { cumulativeExclusions, retakeGroups, retakeChainInfo };
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

		// Per requirements: Remove 'W' courses from total credit calculation.
		// So we only add to 'attempted' if grade is NOT W.
		if (gVal !== null) {
			attempted = cleanFloat(attempted + units);
		} else {
			// It is W
			w_credits = cleanFloat(w_credits + units);
		}

		// Calculate quality points with proper rounding
		let q = 0;
		if (gVal !== null) {
			q = Math.round(units * gVal * 100) / 100;
		}
		qp = cleanFloat(qp + q);

		// Earned credits:
		// - Include passing grades (> 0)
		if (gVal > 0) earned = cleanFloat(earned + units);

		// Mark exclusion info for cumulative calculations
		const excludedFromCumStartingTerm =
			excludeInfo.cumulativeExclusions?.[r.id];

		// Check if this row is part of a retake chain
		const chainInfo = excludeInfo.retakeChainInfo?.[r.id];

		return {
			...r,
			gVal,
			q,
			excludedFromCumStartingTerm,
			inRetakeChain: chainInfo?.inRetakeChain || false,
		};
	});

	// GPA denominator = attempted
	// (Since 'attempted' now excludes W, we don't need to subtract w_credits)
	const gpaDenom = cleanFloat(attempted);
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
		excluded_credits = 0; // Track credits excluded from GPA calculation due to retakes

	// For each retake group, determine which instance to use at this point in time
	const bestAtThisPoint = {}; // normalizedName -> best rowId up to upToTermIdx

	for (const name in excludeInfo.retakeGroups) {
		const instances = excludeInfo.retakeGroups[name];
		if (instances.length > 1) {
			// Filter to only instances that have occurred by upToTermIdx
			const availableInstances = instances.filter(
				(inst) => inst.termIndex <= upToTermIdx
			);

			if (availableInstances.length > 0) {
				// Find the best grade among available instances
				let best = availableInstances[0];
				let bestGradeValue = SCALE.points[best.grade];

				for (const instance of availableInstances) {
					const gradeValue = SCALE.points[instance.grade];
					if (gradeValue !== null && gradeValue !== undefined) {
						if (
							bestGradeValue === null ||
							bestGradeValue === undefined ||
							gradeValue > bestGradeValue ||
							(gradeValue === bestGradeValue &&
								instance.termIndex > best.termIndex)
						) {
							best = instance;
							bestGradeValue = gradeValue;
						}
					}
				}
				bestAtThisPoint[name] = best.rowId;
			}
		}
	}

	for (const t of terms) {
		if (t.termIndex > upToTermIdx) break;

		const termData = termCalc(t, excludeInfo);

		for (const r of termData.rows) {
			const units = parseFloat(r.units) || 0;

			// Handle W grades - completely ignore them for cumulative sums
			if (r.gVal === null) {
				w_credits = cleanFloat(w_credits + units);
				continue;
			}

			// It's a non-W grade, so initially count it
			attempted = cleanFloat(attempted + units);

			// Check if this row is part of a retake group that needs exclusion
			let shouldExcludeFromCum = false;
			const name = r.name ? r.name.trim().toLowerCase() : "";

			if (name && excludeInfo.retakeGroups[name]) {
				const instances = excludeInfo.retakeGroups[name];
				if (instances.length > 1) {
					const bestRowId = bestAtThisPoint[name];
					// Exclude if this is NOT the best grade available at this point
					if (bestRowId && r.id !== bestRowId) {
						shouldExcludeFromCum = true;
					}
				}
			}

			if (shouldExcludeFromCum) {
				// If excluded due to retake policy, remove from attempted/QP
				// We already added it to 'attempted' above, so we don't subtract from there?
				// Wait, if it's excluded from GPA, it shouldn't be in the denominator.
				// So we treat it as if it wasn't attempted for GPA purposes?
				// Or do we track 'excluded_credits' and subtract later?
				// Let's track excluded credits.
				excluded_credits = cleanFloat(excluded_credits + units);
			} else {
				// If NOT excluded:
				// Earned credits: only if passed
				if (r.gVal > 0) earned = cleanFloat(earned + units);
				// QP: always add for valid attempts
				qp = cleanFloat(qp + r.q);
			}
		}
	}

	// GPA denominator = attempted - excluded_credits
	// (attempted already excludes W)
	const gpaDenom = cleanFloat(attempted - excluded_credits);
	const gpa = gpaDenom > 0 ? cleanFloat(qp / gpaDenom) : 0;

	return {
		attempted: cleanFloat(attempted), // Total attempted (excluding W)
		earned: cleanFloat(earned), // Earned (excluding W and replaced courses)
		qp: cleanFloat(qp),
		gpa: cleanFloat(gpa),
	};
};

// Keep these helpers for now, even if UI might not fully use them or they're legacy
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