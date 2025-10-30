import { useState } from "react";
import CourseRow from "./CourseRow";
import { termCalc, computeCumMetrics, fmt } from "../utils/calculations";

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
}) {
	const termData = termCalc(term, excludeMap);
	const cumData = computeCumMetrics(terms, term.termIndex, excludeMap);

	return (
		<div className="term bg-white rounded-2xl shadow-sm ring-1 ring-gray-300 overflow-hidden">
			<div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
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
					<span className="text-xs text-gray-700">
						Term GPA:{" "}
						<strong className="text-gray-900">
							{fmt(termData.gpa, "gpa")}
						</strong>
					</span>
				</div>
				<div className="flex items-center gap-3">
					<button
						onClick={() => removeTerm(term.termIndex)}
						className="p-2 text-red-600 hover:text-red-800 transition-colors"
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
							/>
						))}
					</tbody>
					<tfoot>
						<tr>
							<td colSpan="6" className="px-3 py-3 text-center">
								<button
									onClick={() => addCourse(term.termIndex)}
									className="inline-flex items-center justify-center text-gray-400 hover:text-indigo-600 transition-colors group"
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
					<div className="col-span-3 font-semibold text-gray-800">
						Term GPA: <span>{fmt(termData.gpa, "gpa")}</span>
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
					<div className="col-span-3 font-semibold text-gray-800">
						Cum GPA: <span>{fmt(cumData.gpa, "gpa")}</span>
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
		</div>
	);
}

export default TermCard;
