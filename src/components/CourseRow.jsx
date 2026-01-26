import { useState, useRef, useEffect } from "react";
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
	isDuplicate,
	retakeChainInfo,
	retakeGroups,
	shouldFocus, // New prop
	onAddNext,   // New prop
}) {
	const [showMenu, setShowMenu] = useState(false);
	const nameInputRef = useRef(null);

	// Auto-focus logic
	useEffect(() => {
		if (shouldFocus && nameInputRef.current) {
			nameInputRef.current.focus();
		}
	}, [shouldFocus]);

	const handleKeyDown = (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			onAddNext();
		}
	};

	const handleUpdate = (field, value) => {
		// Convert course names to uppercase and remove all whitespace
		if (field === "name") {
			value = value.replace(/\s+/g, '').toUpperCase();
		}
		updateCourse(term.termIndex, row.id, field, value);
	};

	const earlierCoursesByTerm = buildEarlierCoursesByTerm(
		terms,
		term.termIndex,
		row.id
	);

	// Determine visual styling based on exclusion status
	const isExcludedFromCurrentCum =
		row.excludedFromCumStartingTerm !== undefined &&
		term.termIndex >= row.excludedFromCumStartingTerm;

	const rowClasses = isExcludedFromCurrentCum
		? "excluded-row bg-yellow-50"
		: "";

	// Check if this row is involved in a retake relationship
	const isRetaking = !!row.retakeOf;
	const isBeingRetaken = !!row.excludedFromCumStartingTerm;
	const hasRetakeRelationship =
		isRetaking || isBeingRetaken || row.inRetakeChain;

	// Base cell classes
	const baseCellClass = "p-2";
	const inputClass =
		"w-full p-2 text-sm rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-transparent transition-all";
	const displayCellClass = "text-center text-sm text-gray-600 font-medium";

	return (
		<tr className={`course-row ${rowClasses} relative tour-course-row`}>
			{/* Course Name */}
			<td className={baseCellClass}>
				<div className="flex items-center gap-1">
					<input
						ref={nameInputRef}
						type="text"
						value={row.name || ""}
						onChange={(e) => handleUpdate("name", e.target.value)}
						className={`${inputClass} ${
							isDuplicate ? "border-red-500 focus:ring-red-500" : ""
						}`}
						placeholder="Course name"
						style={{ textTransform: "uppercase" }}
					/>
					{isDuplicate && (
						<span
							className="text-red-500 flex-shrink-0"
							title="Duplicate course in this term"
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
									d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</span>
					)}
					{hasRetakeRelationship && !isDuplicate && (
						<span
							className="text-orange-500 font-bold text-lg flex-shrink-0"
							title={
								isRetaking
									? "Retaking an earlier course"
									: isExcludedFromCurrentCum
									? "Excluded from cumulative GPA from this term forward"
									: "Part of a retake relationship"
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
					onKeyDown={handleKeyDown}
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

			{/* Quality Points */}
			<td
				className={`${baseCellClass} ${displayCellClass} ${
					isExcludedFromCurrentCum ? "text-orange-500" : ""
				}`}
			>
				{row.q !== null && row.q !== undefined ? fmt(row.q, "other") : "—"}
				{isExcludedFromCurrentCum && (
					<span className="text-xs text-orange-600 block">(Term only)</span>
				)}
			</td>

			{/* Actions */}
			<td className={`${baseCellClass} text-center relative`}>
				<button
					onClick={() => setShowMenu(!showMenu)}
					className="p-1 text-gray-600 hover:text-gray-900 transition-colors inline-flex items-center justify-center tour-row-menu-btn"
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
						retakeChainInfo={retakeChainInfo}
						retakeGroups={retakeGroups}
						onClose={() => setShowMenu(false)}
					/>
				)}
			</td>
		</tr>
	);
}

export default CourseRow;
