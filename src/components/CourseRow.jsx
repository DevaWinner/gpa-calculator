import { useState } from "react";
import ActionMenu from "./ActionMenu";
import { buildEarlierCoursesByTerm, fmt, SCALE } from "../utils/calculations";

function CourseRow({
	row,
	term,
	terms,
	removeCourse,
	updateCourse,
	setRetake,
	clearRetake,
}) {
	const [showMenu, setShowMenu] = useState(false);

	const handleUpdate = (field, value) => {
		// Convert course names to uppercase
		if (field === "name") {
			value = value.toUpperCase();
		}
		updateCourse(term.termIndex, row.id, field, value);
	};

	const earlierCoursesByTerm = buildEarlierCoursesByTerm(
		terms,
		term.termIndex,
		row.id
	);

	const rowClasses = row.exclusionStart ? "excluded-row bg-gray-100" : "";

	// Check if this row is involved in a retake relationship
	const isRetaking = !!row.retakeOf; // This row is retaking another course
	const isBeingRetaken = !!row.exclusionStart; // This row is being retaken by another course
	const hasRetakeRelationship = isRetaking || isBeingRetaken;

	// Base cell classes
	const baseCellClass = "p-2";
	const inputClass =
		"w-full p-2 text-sm rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-transparent transition-all";
	const displayCellClass = "text-center text-sm text-gray-600 font-medium";

	return (
		<tr className={`course-row ${rowClasses} relative`}>
			{/* Course Name */}
			<td className={baseCellClass}>
				<div className="flex items-center gap-1">
					<input
						type="text"
						value={row.name || ""}
						onChange={(e) => handleUpdate("name", e.target.value)}
						className={inputClass}
						placeholder="Course name"
						style={{ textTransform: "uppercase" }}
					/>
					{hasRetakeRelationship && (
						<span
							className="text-red-500 font-bold text-lg flex-shrink-0"
							title={
								isRetaking
									? "Retaking an earlier course"
									: "Being retaken by a later course"
							}
						>
							**
						</span>
					)}
				</div>
			</td>

			{/* Units */}
			<td className={baseCellClass}>
				<input
					type="text"
					value={row.units || ""}
					onChange={(e) => handleUpdate("units", e.target.value)}
					className={`${inputClass} text-center`}
					placeholder="0"
				/>
			</td>

			{/* Grade */}
			<td className={baseCellClass}>
				<select
					value={row.grade || ""}
					onChange={(e) => handleUpdate("grade", e.target.value)}
					className={`${inputClass} text-center bg-white cursor-pointer`}
				>
					<option value="">Select Grade</option>
					{SCALE.letters.map((letter) => (
						<option key={letter} value={letter}>
							{letter}
						</option>
					))}
				</select>
			</td>

			{/* Grade Value */}
			<td className={`${baseCellClass} ${displayCellClass}`}>
				{row.gVal !== null && row.gVal !== undefined
					? fmt(row.gVal, "other")
					: "—"}
			</td>

			{/* Quality Points - ensure we're formatting the raw q value */}
			<td className={`${baseCellClass} ${displayCellClass}`}>
				{row.q !== null && row.q !== undefined ? fmt(row.q, "other") : "—"}
			</td>

			{/* Actions */}
			<td className={`${baseCellClass} text-center relative`}>
				<button
					onClick={() => setShowMenu(!showMenu)}
					className="p-1 text-gray-600 hover:text-gray-900 transition-colors inline-flex items-center justify-center"
				>
					<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
						<path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
					</svg>
				</button>

				{showMenu && (
					<ActionMenu
						row={row}
						term={term}
						earlierCoursesByTerm={earlierCoursesByTerm}
						removeCourse={removeCourse}
						setRetake={setRetake}
						clearRetake={clearRetake}
						onClose={() => setShowMenu(false)}
					/>
				)}
			</td>
		</tr>
	);
}

export default CourseRow;
