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
	const retakeGroups = {}; // Map rootCourseId -> array of all instances
	const cumulativeExclusions = {}; // rowId -> startingFromTermIndex
	const rowToGroupMap = {}; // Map rowId -> rootCourseId (to find group for any row)
	const retakeChainInfo = {}; // Map rowId -> { inRetakeChain: true, bestRowId, excludeFromTerm }

	// First pass: Build retake chains by following retakeOf links
	// We need to find the root (original) course for each chain
	const findRootCourse = (rowId) => {
		// If we've already mapped this row, return its root
		if (rowToGroupMap[rowId]) {
			return rowToGroupMap[rowId];
		}

		// Find this row and check if it has a retakeOf
		for (const term of terms) {
			const row = term.rows.find((r) => r.id === rowId);
			if (row) {
				if (row.retakeOf) {
					// This row is a retake of another, so find the root of that one
					const root = findRootCourse(row.retakeOf);
					rowToGroupMap[rowId] = root;
					return root;
				} else {
					// This row has no retakeOf, so it's the root
					rowToGroupMap[rowId] = rowId;
					return rowId;
				}
			}
		}
		// If not found, return the rowId itself as root
		rowToGroupMap[rowId] = rowId;
		return rowId;
	};

	// Second pass: Group all instances by their root course
	for (const t of terms) {
		for (const r of t.rows) {
			// Find the root for this row (whether it has retakeOf or not)
			const rootId = findRootCourse(r.id);

			// Initialize group if needed
			if (!retakeGroups[rootId]) {
				retakeGroups[rootId] = [];
			}

			// Add this instance to the group (avoid duplicates)
			if (!retakeGroups[rootId].some((instance) => instance.rowId === r.id)) {
				retakeGroups[rootId].push({
					rowId: r.id,
					termIndex: t.termIndex,
					grade: r.grade,
					units: parseFloat(r.units) || 0,
				});
			}
		}
	}

	// Debug log to see what retake groups we found
	debugLog("Retake groups:", retakeGroups);

	// Now determine exclusions for each group
	for (const groupId in retakeGroups) {
		const instances = retakeGroups[groupId];
		if (instances.length > 1) {
			// Sort instances by term index to process chronologically
			instances.sort((a, b) => a.termIndex - b.termIndex);

			// Determine which instance has the best grade
			let bestInstance = null;
			let bestGradeValue = -1;

			for (const instance of instances) {
				const gradeValue = SCALE.points[instance.grade];
				// Handle null grades (W) - they should not be considered "best"
				if (gradeValue !== null && gradeValue !== undefined) {
					// If same grade value, prefer the later attempt (more recent)
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

			debugLog(
				`Group ${groupId}: best instance is`,
				bestInstance,
				"from term",
				bestInstance?.termIndex,
				"with grade",
				bestInstance?.grade
			); // If we found a best instance, mark ALL rows in this chain
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
						// This ensures:
						// 1. The term where the course was taken includes it in term GPA and cum GPA
						// 2. All subsequent terms exclude it from cumulative calculations
						// 3. Previous terms are NEVER affected by future retakes

						const excludeFromTerm = instance.termIndex + 1;

						cumulativeExclusions[instance.rowId] = excludeFromTerm;
						debugLog(
							`Excluding row ${instance.rowId} (term ${instance.termIndex}, grade ${instance.grade}) from cumulative starting from term ${excludeFromTerm} (best grade ${bestInstance.grade} is in term ${bestTermIndex})`
						);
					} else {
						debugLog(
							`Row ${instance.rowId} (term ${instance.termIndex}, grade ${instance.grade}) is the BEST grade - will be used in cumulative`
						);
					}
				}
			}
		}
	}

	debugLog("Cumulative exclusions:", cumulativeExclusions);
	debugLog("Retake chain info:", retakeChainInfo);

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

		// ALL courses count for TERM calculations (no exclusions)
		attempted = cleanFloat(attempted + units);

		if (gVal === null) w_credits = cleanFloat(w_credits + units);

		// For TERM calculations, include ALL courses
		// Calculate quality points with proper rounding to avoid floating point errors
		let q = 0;
		if (gVal !== null) {
			// Multiply and round to 2 decimal places immediately to avoid accumulation errors
			q = Math.round(units * gVal * 100) / 100;
			debugLog(
				`QP calculation for ${r.name || "course"}: ${units} * ${gVal} = ${q}`
			);
		}
		qp = cleanFloat(qp + q);

		// Earned credits for TERM calculations:
		// - Include passing grades (> 0)
		// - Exclude F (0.0), UW (0.0), and W (null)
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

	// For each retake group, determine which instance to use at this point in time (upToTermIdx)
	const bestAtThisPoint = {}; // groupId -> best rowId up to upToTermIdx

	for (const groupId in excludeInfo.retakeGroups) {
		const instances = excludeInfo.retakeGroups[groupId];
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

				bestAtThisPoint[groupId] = best.rowId;
				debugLog(
					`At term ${upToTermIdx}, group ${groupId}: best available is row ${best.rowId} (term ${best.termIndex}, grade ${best.grade})`
				);
			}
		}
	}

	for (const t of terms) {
		if (t.termIndex > upToTermIdx) break;

		const termData = termCalc(t, excludeInfo);

		for (const r of termData.rows) {
			const units = parseFloat(r.units) || 0;

			// ALL instances count as attempted
			attempted = cleanFloat(attempted + units);
			if (r.gVal === null) w_credits = cleanFloat(w_credits + units);

			// Check if this row is part of a retake group
			let shouldExcludeFromCum = false;

			// Find which group this row belongs to (if any)
			for (const groupId in excludeInfo.retakeGroups) {
				const instances = excludeInfo.retakeGroups[groupId];
				const isInGroup = instances.some((inst) => inst.rowId === r.id);

				if (isInGroup && instances.length > 1) {
					// This row is part of a retake group
					const bestRowId = bestAtThisPoint[groupId];

					// Exclude if this is NOT the best grade available at this point
					if (bestRowId && r.id !== bestRowId) {
						shouldExcludeFromCum = true;
						debugLog(
							`Row ${r.id} (${r.name}) in term ${t.termIndex}: excluded because row ${bestRowId} is better at term ${upToTermIdx}`
						);
					}
					break;
				}
			}

			if (shouldExcludeFromCum) {
				// Track excluded credits (these don't count in GPA denominator or QP)
				excluded_credits = cleanFloat(excluded_credits + units);
				debugLog(
					`  -> Excluding ${units} units from cumulative (excluded_credits now ${excluded_credits})`
				);
			} else {
				// Only include in cumulative earned credits and QP if NOT excluded
				if (r.gVal > 0) earned = cleanFloat(earned + units);
				if (r.gVal !== null) {
					qp = cleanFloat(qp + r.q);
					debugLog(`  -> Adding ${r.q} QP to cumulative (qp now ${qp})`);
				}
			}
		}
	}

	// GPA denominator = attempted - W credits - excluded retake credits
	const gpaDenom = cleanFloat(attempted - w_credits - excluded_credits);
	const gpa = gpaDenom > 0 ? cleanFloat(qp / gpaDenom) : 0;

	debugLog("Cumulative calculation result:", {
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
