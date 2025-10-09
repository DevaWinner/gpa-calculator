import { useState, useRef, useEffect } from "react";

function ActionMenu({
	row,
	term,
	earlierCoursesByTerm,
	removeCourse,
	setRetake,
	clearRetake,
	onClose,
}) {
	const [showRetakeSubmenu, setShowRetakeSubmenu] = useState(false);
	const [selectedTerm, setSelectedTerm] = useState(null);
	const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
	const [termSubmenuPosition, setTermSubmenuPosition] = useState({
		top: 0,
		right: 0,
	});
	const [courseSubmenuPosition, setCourseSubmenuPosition] = useState({
		top: 0,
		right: 0,
	});
	const menuRef = useRef(null);
	const termSubmenuRef = useRef(null);
	const courseSubmenuRef = useRef(null);

	// Calculate menu position
	useEffect(() => {
		if (menuRef.current) {
			const rect = menuRef.current.parentElement.getBoundingClientRect();
			setMenuPosition({
				top: rect.bottom + 4,
				right: window.innerWidth - rect.right,
			});
		}
	}, []);

	// Calculate term submenu position when it opens
	useEffect(() => {
		if (showRetakeSubmenu && menuRef.current) {
			const rect = menuRef.current.getBoundingClientRect();
			setTermSubmenuPosition({
				top: rect.top,
				right: window.innerWidth - rect.left + 8,
			});
		}
	}, [showRetakeSubmenu]);

	// Calculate course submenu position when a term is selected
	useEffect(() => {
		if (selectedTerm && termSubmenuRef.current) {
			const rect = termSubmenuRef.current.getBoundingClientRect();
			const buttonRect = document.activeElement?.getBoundingClientRect();
			setCourseSubmenuPosition({
				top: buttonRect?.top || rect.top,
				right: window.innerWidth - rect.left + 8,
			});
		}
	}, [selectedTerm]);

	// Close menu when clicking outside
	useEffect(() => {
		const handleClickOutside = (e) => {
			if (
				menuRef.current &&
				!menuRef.current.contains(e.target) &&
				(!termSubmenuRef.current ||
					!termSubmenuRef.current.contains(e.target)) &&
				(!courseSubmenuRef.current ||
					!courseSubmenuRef.current.contains(e.target))
			) {
				onClose();
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [onClose]);

	const handleRemove = () => {
		removeCourse(term.termIndex, row.id);
		onClose();
	};

	const handleSetRetake = (earlierRowId) => {
		setRetake(term.termIndex, row.id, earlierRowId);
		setSelectedTerm(null);
		setShowRetakeSubmenu(false);
		onClose();
	};

	const handleClearRetake = () => {
		clearRetake(row.id);
		setSelectedTerm(null);
		setShowRetakeSubmenu(false);
		onClose();
	};

	const handleTermSelect = (termGroup, e) => {
		e.stopPropagation();
		// Calculate position for course submenu based on the clicked term button
		const rect = e.currentTarget.getBoundingClientRect();
		setCourseSubmenuPosition({
			top: rect.top,
			right: window.innerWidth - rect.left + 8,
		});
		setSelectedTerm(termGroup);
	};

	return (
		<>
			{/* Main Menu */}
			<div
				ref={menuRef}
				className="action-menu fixed bg-white border border-gray-300 rounded-lg shadow-lg z-50 py-1 min-w-[140px]"
				style={{
					animation: "menuSlideIn 0.15s ease-out",
					top: `${menuPosition.top}px`,
					right: `${menuPosition.right}px`,
				}}
			>
				<button
					className="retake-btn w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-between"
					onClick={(e) => {
						e.stopPropagation();
						setShowRetakeSubmenu(!showRetakeSubmenu);
						setSelectedTerm(null);
					}}
				>
					Retake
					<svg
						className="w-4 h-4 ml-2"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M9 5l7 7-7 7"
						></path>
					</svg>
				</button>
				<button
					onClick={handleRemove}
					className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
				>
					Remove
				</button>
			</div>

			{/* Term Selection Submenu */}
			{showRetakeSubmenu && (
				<div
					ref={termSubmenuRef}
					className="retake-submenu fixed bg-white border border-gray-300 rounded-lg shadow-lg z-[60] py-1 min-w-[160px] max-h-[400px] overflow-y-auto"
					style={{
						animation: "menuSlideIn 0.15s ease-out",
						top: `${termSubmenuPosition.top}px`,
						right: `${termSubmenuPosition.right}px`,
					}}
				>
					{row.retakeOf ? (
						<button
							onClick={handleClearRetake}
							className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors border-b border-gray-200"
						>
							<div className="font-medium">Clear Retake Link</div>
							<div className="text-xs text-gray-500 mt-0.5">
								Currently retaking: {row.retakeOf}
							</div>
						</button>
					) : null}

					{earlierCoursesByTerm.length === 0 ? (
						<div className="px-4 py-2 text-sm text-gray-500 italic">
							No earlier courses
						</div>
					) : (
						earlierCoursesByTerm.map((termGroup) => (
							<button
								key={termGroup.termIndex}
								onClick={(e) => handleTermSelect(termGroup, e)}
								className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 transition-colors flex items-center justify-between"
							>
								<span className="font-medium">Term {termGroup.termIndex}</span>
								<div className="flex items-center gap-1">
									<span className="text-xs text-gray-500">
										{termGroup.courses.length} course
										{termGroup.courses.length !== 1 ? "s" : ""}
									</span>
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
											d="M9 5l7 7-7 7"
										></path>
									</svg>
								</div>
							</button>
						))
					)}
				</div>
			)}

			{/* Course Selection Submenu */}
			{selectedTerm && (
				<div
					ref={courseSubmenuRef}
					className="course-submenu fixed bg-white border border-gray-300 rounded-lg shadow-lg z-[70] py-1 min-w-[220px] max-h-[400px] overflow-y-auto"
					style={{
						animation: "menuSlideIn 0.15s ease-out",
						top: `${courseSubmenuPosition.top}px`,
						right: `${courseSubmenuPosition.right}px`,
					}}
				>
					<div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200">
						Term {selectedTerm.termIndex} Courses
					</div>
					{selectedTerm.courses.map((course) => (
						<button
							key={course.rowId}
							onClick={() => handleSetRetake(course.rowId)}
							className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
						>
							<div className="font-medium">{course.label}</div>
							<div className="text-xs text-gray-500 mt-0.5">
								{course.units} units • Grade: {course.grade}
							</div>
						</button>
					))}
				</div>
			)}
		</>
	);
}

export default ActionMenu;
