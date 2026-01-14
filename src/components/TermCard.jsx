import { useState, useEffect } from "react";
import CourseRow from "./CourseRow";
import CalculationDetailsModal from "./CalculationDetailsModal";
import {
	termCalc,
	computeCumMetrics,
	fmt,
	SCALE,
} from "../utils/calculations";

function TermCard({
	term,
	terms,
	excludeMap,
	addCourse,
	removeTerm,
	removeCourse,
	updateCourse,
	updateTermName,
	setRetake,
	clearRetake,
	setIsAnyModalOpen, // New prop
	insertTermAfter, // New prop
	toggleTermHighlight, // New prop
}) {
	const [activeModal, setActiveModal] = useState(null); // 'term' | 'cum' | null

	// Effect to inform parent when modal state changes
	useEffect(() => {
		setIsAnyModalOpen(!!activeModal);
	}, [activeModal, setIsAnyModalOpen]);


	const termData = termCalc(term, excludeMap);
	const cumData = computeCumMetrics(terms, term.termIndex, excludeMap);

	// Detect duplicates within this term
	const nameCounts = {};
	termData.rows.forEach((r) => {
		const name = r.name ? r.name.toUpperCase() : "";
		if (name) {
			nameCounts[name] = (nameCounts[name] || 0) + 1;
		}
	});

	// Prepare data for the modal based on active type
	const getModalData = () => {
		if (activeModal === "term") {
			// Filter out empty/invalid rows for cleaner display if desired, or keep all
			// Term calc logic for exclusion: W is excluded from GPA denom.
			// Retakes: In term calc, retakes are NOT excluded from the term GPA usually?
			// Wait, logic says: "ALL courses count for TERM calculations (no exclusions)"
			// EXCEPT W.
			const rows = termData.rows
				.filter(r => r.name && r.name.trim() !== "" && (parseFloat(r.units) || 0) > 0)
				.map((r) => {
					const isW = r.grade === "W" || r.grade === "";
					const qp = r.q;
					return {
						name: r.name,
						grade: r.grade,
						units: r.units,
						q: qp,
						excluded: isW,
						reason: isW ? (r.grade === "W" ? "W Grade" : "No Grade") : "",
					};
				});
			// GPA Denom for term = Attempted - W
			// termData.attempted includes W now.
			// We need w_credits to display GPA Denom accurately.
			// Let's re-sum W from rows for display purposes
			const wCreds = termData.rows.reduce(
				(sum, r) => (r.grade === "W" || r.grade === "" ? sum + (parseFloat(r.units) || 0) : sum),
				0
			);

			return {
				title: `${term.name || `Term ${term.termIndex}`} — Term GPA Details`,
				gpa: termData.gpa,
				qp: termData.qp,
				attempted: termData.attempted,
				gpaDenom: termData.attempted - wCreds,
				rows,
			};
		} else if (activeModal === "cum") {
			// Reconstruct cumulative list
			const rows = [];
			let cumAttempted = 0;
			let cumW = 0;
			let cumExcludedRetake = 0;
			let cumQP = 0;

			// Need to replicate the "best at this point" logic for accurate reasons
			const bestAtThisPoint = {};
			for (const groupId in excludeMap.retakeGroups) {
				const instances = excludeMap.retakeGroups[groupId];
				if (instances.length > 1) {
					const availableInstances = instances.filter(
						(inst) => inst.termIndex <= term.termIndex
					);
					if (availableInstances.length > 0) {
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

			// Iterate terms
							for (const t of terms) {
								if (t.termIndex > term.termIndex) break;
								for (const r of t.rows) {
									// Filter out rows without a name or units for display purposes in the modal
									if (!r.name || r.name.trim() === "" || (parseFloat(r.units) || 0) <= 0) {
										continue;
									}
			
									const units = parseFloat(r.units) || 0;
									const isW = r.grade === "W" || r.grade === "";
									const map = SCALE.points;
									const gRaw = map[r.grade];
									const gVal = gRaw === null ? null : gRaw ?? 0;
									let q = 0;					if (gVal !== null) {
						q = Math.round(units * gVal * 100) / 100;
					}

					let excluded = false;
					let reason = "";

					cumAttempted += units;

					if (isW) {
						excluded = true;
						reason = r.grade === "W" ? "W Grade" : "No Grade";
						cumW += units;
					} else {
						// Check retake exclusion
						const chainInfo = excludeMap.retakeChainInfo?.[r.id];
						if (chainInfo && chainInfo.groupId) {
							const groupId = chainInfo.groupId;
							const bestRowId = bestAtThisPoint[groupId];
							if (bestRowId && r.id !== bestRowId) {
								excluded = true;
								reason = "Retake Policy";
								cumExcludedRetake += units;
							}
						}
					}
					
					if (!excluded) {
						cumQP += q;
					}

					rows.push({
						name: r.name,
						termLabel: t.name || `Term ${t.termIndex}`,
						grade: r.grade,
						units: r.units,
						q: q,
						excluded,
						reason,
					});
				}
			}
			
			const gpaDenom = cumAttempted - cumW - cumExcludedRetake;

			return {
				title: `Cumulative GPA Details (thru ${
					term.name || `Term ${term.termIndex}`
				})`,
				gpa: cumData.gpa,
				qp: cumData.qp, // Should match cumQP roughly
				attempted: cumData.attempted,
				gpaDenom,
				rows,
			};
		}
		return null;
	};

	const modalData = activeModal ? getModalData() : null;

	return (
		<div
			className={`term bg-white rounded-2xl shadow-sm ring-1 ring-gray-300 overflow-hidden transition-all duration-300 ${
				term.isHighlighted ? "ring-2 ring-yellow-400 bg-yellow-50" : ""
			}`}
		>
			<div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 tour-term-header">
				<div className="flex items-baseline gap-3">
					<h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
						<input
							type="text"
							value={term.name || `Term ${term.termIndex}`}
							onChange={(e) => updateTermName(term.termIndex, e.target.value)}
							className="bg-transparent border-none outline-none focus:bg-white focus:border focus:border-gray-300 focus:rounded px-2 py-1 min-w-[100px]"
							placeholder={`Term ${term.termIndex}`}
						/>
					</h2>
				</div>
				<div className="flex items-center gap-1">
					<button
						onClick={() => toggleTermHighlight(term.termIndex)}
						className={`p-2 transition-colors ${
							term.isHighlighted
								? "text-yellow-500 hover:text-yellow-600"
								: "text-gray-400 hover:text-yellow-500"
						}`}
						title={term.isHighlighted ? "Remove Highlight" : "Highlight Term"}
					>
						<svg
							className="w-5 h-5"
							fill={term.isHighlighted ? "currentColor" : "none"}
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
							></path>
						</svg>
					</button>
					<button
						onClick={() => insertTermAfter(term.termIndex)}
						className="p-2 text-green-600 hover:text-green-800 transition-colors tour-insert-term-btn"
						title="Insert Term After"
					>
						<svg
							className="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M12 6v6m0 0v6m0-6h6m-6 0H6"
							></path>
						</svg>
					</button>
					<button
						onClick={() => removeTerm(term.termIndex)}
						className="p-2 text-red-600 hover:text-red-800 transition-colors"
						title="Remove Term"
					>
						<svg
							className="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M6 18L18 6M6 6l12 12"
							></path>
						</svg>
					</button>
				</div>
			</div>

			<div className="overflow-x-auto overflow-y-visible">
				<table className="w-full text-sm">
					<thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
						<tr>
							<th className="p-3 text-left text-xs font-semibold uppercase tracking-wide">
								Course
							</th>
							<th className="p-3 text-left text-xs font-semibold uppercase tracking-wide">
								Units
							</th>
							<th className="p-3 text-left text-xs font-semibold uppercase tracking-wide">
								Grade
							</th>
							<th className="p-3 text-center text-xs font-semibold uppercase tracking-wide">
								Grade Value
							</th>
							<th className="p-3 text-center text-xs font-semibold uppercase tracking-wide">
								Quality Points
							</th>
							<th className="p-3 text-center text-xs font-semibold uppercase tracking-wide">
								Actions
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-100">
						{termData.rows.map((row) => (
							<CourseRow
								key={row.id}
								row={row}
								term={term}
								terms={terms}
								removeCourse={removeCourse}
								updateCourse={updateCourse}
								setRetake={setRetake}
								clearRetake={clearRetake}
								isDuplicate={
									row.name && nameCounts[row.name.toUpperCase()] > 1
								}
							/>
						))}
					</tbody>
					<tfoot>
						<tr>
							<td colSpan="6" className="px-3 py-3 text-center">
								<button
									onClick={() => addCourse(term.termIndex)}
									className="inline-flex items-center justify-center text-gray-400 hover:text-indigo-600 transition-colors group tour-add-course-btn"
								>
									<svg
										className="w-5 h-5"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M12 4v16m8-8H4"
										></path>
									</svg>
								</button>
							</td>
						</tr>
					</tfoot>
				</table>
			</div>

			{/* Term Summary */}
			<div className="px-4 py-4 bg-gray-50 border-t border-gray-200">
				<div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-600">
					<div className="col-span-3"></div>
					<div className="col-span-3 text-center">Attempted</div>
					<div className="col-span-3 text-center">Earned</div>
					<div className="col-span-3 text-center">Quality Points</div>
				</div>
				{/* Term GPA Row */}
				<div className="grid grid-cols-12 items-center mt-1">
					<div className="col-span-3 font-semibold text-gray-800 flex items-center gap-1">
						Term GPA: <span>{fmt(termData.gpa, "gpa")}</span>
						<button
							onClick={() => setActiveModal("term")}
							className="text-gray-400 hover:text-indigo-600 transition-colors tour-term-gpa-info-btn"
						>
							<svg
								className="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</button>
					</div>
					<div className="col-span-3 text-center">
						{fmt(termData.attempted, "other")}
					</div>
					<div className="col-span-3 text-center">
						{fmt(termData.earned, "other")}
					</div>
					<div className="col-span-3 text-center">
						{fmt(termData.qp, "other")}
					</div>
				</div>
				{/* Cum GPA Row */}
				<div className="grid grid-cols-12 items-center mt-3">
					<div className="col-span-3 font-semibold text-gray-800 flex items-center gap-1">
						Cum GPA: <span>{fmt(cumData.gpa, "gpa")}</span>
						<button
							onClick={() => setActiveModal("cum")}
							className="text-gray-400 hover:text-indigo-600 transition-colors tour-cum-gpa-info-btn"
						>
							<svg
								className="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</button>
					</div>
					<div className="col-span-3 text-center">
						{fmt(cumData.attempted, "other")}
					</div>
					<div className="col-span-3 text-center">
						{fmt(cumData.earned, "other")}
					</div>
					<div className="col-span-3 text-center">
						{fmt(cumData.qp, "other")}
					</div>
				</div>
			</div>

			{activeModal && (
				<CalculationDetailsModal
					title={modalData.title}
					data={modalData}
					onClose={() => setActiveModal(null)}
				/>
			)}
		</div>
	);
}

export default TermCard;
