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
		"E",
		"F",
		"UW",
		"W",
		"P",
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
		E: 0.0,
		F: 0.0,
		UW: 0.0,
		W: null,
		P: null,
		"": null,
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

export const computeRetakeExclusionsMap = (terms, equivalences = []) => {
	const retakeGroups = {}; // Map groupID (root rep) -> array of instances
	const cumulativeExclusions = {}; // rowId -> startingFromTermIndex
	const retakeChainInfo = {}; // rowId -> { inRetakeChain: true, bestRowId, excludeFromTerm }

	// Union-Find (Disjoint Set) Structure
	const parent = {};
	const find = (id) => {
		if (parent[id] === undefined) parent[id] = id;
		if (parent[id] !== id) parent[id] = find(parent[id]);
		return parent[id];
	};
	const union = (id1, id2) => {
		const root1 = find(id1);
		const root2 = find(id2);
		if (root1 !== root2) {
			parent[root1] = root2;
		}
	};

	// 1. Map names to IDs to link same-named courses
	const nameToIds = {};
	// Also keep track of all row objects for later retrieval
	const allRows = {};

	for (const t of terms) {
		for (const r of t.rows) {
			allRows[r.id] = { ...r, termIndex: t.termIndex };

			// Skip W for grouping only if it's NOT explicitly linked
			// But wait, if I retake a W course, I want them grouped.
			// If I have Math 101 (W) and Math 101 (A), they should group so I can see the history?
			// But W doesn't replace and isn't replaced in a grade-sense.
			// However, if the user explicitly links them, we should probably group them?
			// Current requirement: "Retakes of a course that was taken with W should act currently and not misbehave"
			// Previous implementation skipped W in grouping.
			// If I skip W here, they won't be in the Union-Find structure unless I handle them carefully.
			// Let's include W in the structure but handle grade logic later.

			// Link by Name
			const name = r.name ? r.name.replace(/\s+/g, '').toLowerCase() : "";
			if (name) {
				if (!nameToIds[name]) nameToIds[name] = [];
				nameToIds[name].push(r.id);
			}

			// Initialize in UF
			find(r.id);

			// Link by retakeOf (Explicit Manual Link)
			if (r.retakeOf) {
				union(r.id, r.retakeOf);
			}
		}
	}

	// Union all courses with the same name
	for (const name in nameToIds) {
		const ids = nameToIds[name];
		for (let i = 1; i < ids.length; i++) {
			union(ids[0], ids[i]);
		}
	}

	// Union courses based on global equivalences
	for (const eq of equivalences) {
		const nameA = eq.courseA.replace(/\s+/g, '').toLowerCase();
		const nameB = eq.courseB.replace(/\s+/g, '').toLowerCase();

		const idsA = nameToIds[nameA];
		const idsB = nameToIds[nameB];

		if (idsA && idsA.length > 0 && idsB && idsB.length > 0) {
			// Union the first instance of each; UF will handle the rest
			union(idsA[0], idsB[0]);
		}
	}

	// 2. Build Groups from UF Roots
	for (const rowId in allRows) {
		const root = find(rowId);
		if (!retakeGroups[root]) {
			retakeGroups[root] = [];
		}
		// We need to pass the data expected by the rest of the logic
		const r = allRows[rowId];
		// Include ALL grades (including W) in the group so they are visually linked
		retakeGroups[root].push({
			rowId: r.id,
			termIndex: r.termIndex,
			grade: r.grade,
			units: parseFloat(r.units) || 0,
		});
	}

	debugLog("Retake groups (by UF root):", retakeGroups);

	// 3. Determine exclusions for each group (Best Grade Logic)
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

			// Mark all rows as part of a retake chain, regardless of whether a "best" exists
			for (const instance of instances) {
				retakeChainInfo[instance.rowId] = {
					inRetakeChain: true,
					groupId: groupId,
					// bestRowId might be null if all are W
					bestRowId: bestInstance ? bestInstance.rowId : null, 
					bestTermIndex: bestInstance ? bestInstance.termIndex : null,
				};
			}

			// If we have a valid best grade, apply exclusions
			if (bestInstance) {
				for (const instance of instances) {
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

	// Helper to find group ID for any row (used in computeCumMetrics)
	const getGroupId = (rowId) => find(rowId);

	return { cumulativeExclusions, retakeGroups, retakeChainInfo, getGroupId };
};

export const termCalc = (term, excludeInfo) => {
	const map = SCALE.points;
	let attempted = 0,
		earned = 0,
		qp = 0,
		excluded_gpa_credits = 0;

	const rowsWithCache = term.rows.map((r) => {
		const units = parseFloat(r.units) || 0;
		const grade = r.grade;
		const gRaw = map[grade];
		const gVal = gRaw === null ? null : gRaw ?? 0;

		// Count ALL courses (including W and P) in attempted credits
		attempted = cleanFloat(attempted + units);

		if (gVal === null) {
			// Track W, P, and empty grades separately to remove from GPA denom later
			excluded_gpa_credits = cleanFloat(excluded_gpa_credits + units);
		}

		// Calculate quality points with proper rounding
		let q = 0;
		if (gVal !== null) {
			q = Math.round(units * gVal * 100) / 100;
		}
		qp = cleanFloat(qp + q);

		// Earned credits:
		// - Include passing grades (> 0)
		// - Include P grade
		if (gVal > 0 || grade === 'P') earned = cleanFloat(earned + units);

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

	// GPA denominator = attempted - excluded_gpa_credits
	const gpaDenom = cleanFloat(attempted - excluded_gpa_credits);
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
		excluded_gpa_credits = 0, // W, P, empty
		excluded_retake_credits = 0; // Track credits excluded from GPA calculation due to retakes

	// For each retake group, determine which instance to use at this point in time
	const bestAtThisPoint = {}; // groupID -> best rowId up to upToTermIdx

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
			}
		}
	}

	for (const t of terms) {
		if (t.termIndex > upToTermIdx) break;

		const termData = termCalc(t, excludeInfo);

		for (const r of termData.rows) {
			const units = parseFloat(r.units) || 0;

			// Always add to attempted (including W, P)
			attempted = cleanFloat(attempted + units);

			// Handle W, P, empty grades - ignore for GPA/QP, but we already added to attempted
			if (r.gVal === null) {
				excluded_gpa_credits = cleanFloat(excluded_gpa_credits + units);
				
				// Handle P grade earned credits specifically for cumulative
				if (r.grade === 'P') {
                    // Check if this P grade is excluded due to retake policy
                    // If it is, we shouldn't count it as earned? 
                    // Usually Pass/Fail courses follow retake logic too.
                    // If I retake a P with an A, the A replaces the P?
                    // P is null points. A is 4.0. A is better.
                    // So yes, P can be replaced.
                    // However, we need to check exclusion status.
                    
                    let isExcludedRetake = false;
                    const chainInfo = excludeInfo.retakeChainInfo?.[r.id];
                    if (chainInfo && chainInfo.groupId) {
                        const groupId = chainInfo.groupId;
                        const bestRowId = bestAtThisPoint[groupId];
                        if (bestRowId && r.id !== bestRowId) {
                            isExcludedRetake = true;
                        }
                    }

                    if (!isExcludedRetake) {
                        earned = cleanFloat(earned + units);
                    } else {
                        // If P is excluded by retake, we don't count it as earned? 
                        // Typically yes, only one instance counts for credit.
                        // Also need to track excluded_retake_credits?
                        // Wait, excluded_retake_credits is used to subtract from gpaDenom.
                        // P is ALREADY excluded from gpaDenom via excluded_gpa_credits.
                        // So we don't need to add to excluded_retake_credits if it's P.
                        // We just don't add to earned.
                    }
				}
				continue;
			}

			// Check if this row is part of a retake group that needs exclusion
			let shouldExcludeFromCum = false;
			
			const chainInfo = excludeInfo.retakeChainInfo?.[r.id];
			if (chainInfo && chainInfo.groupId) {
				const groupId = chainInfo.groupId;
				const instances = excludeInfo.retakeGroups[groupId];
				if (instances && instances.length > 1) {
					const bestRowId = bestAtThisPoint[groupId];
					// Exclude if this is NOT the best grade available at this point
					if (bestRowId && r.id !== bestRowId) {
						shouldExcludeFromCum = true;
					}
				}
			}

			if (shouldExcludeFromCum) {
				// If excluded due to retake policy, remove from attempted/QP
				// We need to subtract this from GPA denominator.
				excluded_retake_credits = cleanFloat(excluded_retake_credits + units);
			} else {
				// If NOT excluded:
				// Earned credits: only if passed
				if (r.gVal > 0) earned = cleanFloat(earned + units);
				// QP: always add for valid attempts
				qp = cleanFloat(qp + r.q);
			}
		}
	}

	// GPA denominator = attempted - excluded_gpa_credits (W/P/empty) - excluded_retake_credits (replaced grades)
	const gpaDenom = cleanFloat(attempted - excluded_gpa_credits - excluded_retake_credits);
	const gpa = gpaDenom > 0 ? cleanFloat(qp / gpaDenom) : 0;

	return {
		attempted: cleanFloat(attempted), // Total attempted (INCLUDING W, P)
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