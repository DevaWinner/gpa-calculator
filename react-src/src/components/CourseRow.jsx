import { useState } from "react";
import ActionMenu from "./ActionMenu";
import { buildEarlierCourseOptions, fmt, SCALE } from "../utils/calculations";

function CourseRow({
	row,
	term,
	terms,
	institution,
	removeCourse,
	updateCourse,
	setRetake,
	clearRetake,
}) {
	const [showMenu, setShowMenu] = useState(false);

	const handleUpdate = (field, value) => {
		updateCourse(term.termIndex, row.id, field, value);
	};

	const earlierCourses = buildEarlierCourseOptions(
		terms,
		term.termIndex,
		row.id
	);

	const rowClasses = row.exclusionStart ? "excluded-row bg-gray-100" : "";

	return (
		<tr className={`course-row ${rowClasses} relative`}>
			<td className="px-2 py-1">
				<input
					type="text"
					value={row.name || ""}
					onChange={(e) => handleUpdate("name", e.target.value)}
					className="w-full px-2 py-1 text-sm rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-transparent transition-all"
					placeholder="Course name"
				/>
			</td>
			<td className="px-2 py-1">
				<input
					type="text"
					value={row.units || ""}
					onChange={(e) => handleUpdate("units", e.target.value)}
					className="w-full px-2 py-1 text-sm rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-transparent text-center transition-all"
					placeholder="0"
				/>
			</td>
			<td className="px-2 py-1">
				<select
					value={row.grade || ""}
					onChange={(e) => handleUpdate("grade", e.target.value)}
					className="w-full px-2 py-1 text-sm rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-transparent text-center bg-white transition-all cursor-pointer"
				>
					<option value="">Select Grade</option>
					{SCALE.letters.map((letter) => (
						<option key={letter} value={letter}>
							{letter}
						</option>
					))}
				</select>
			</td>
			<td className="px-2 py-1 text-center text-sm text-gray-600 font-medium">
				{row.gVal !== null && row.gVal !== undefined
					? fmt(row.gVal, institution)
					: "—"}
			</td>
			<td className="px-2 py-1 text-center text-sm text-gray-600 font-medium">
				{row.q !== null && row.q !== undefined ? fmt(row.q, institution) : "—"}
			</td>
			<td className="px-2 py-1 text-center relative">
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
						earlierCourses={earlierCourses}
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
