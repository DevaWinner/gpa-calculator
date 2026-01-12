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
	const [view, setView] = useState("main"); // 'main', 'terms', or 'courses'
	const [selectedTerm, setSelectedTerm] = useState(null);
	const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
	const menuRef = useRef(null);
	const triggerButtonRef = useRef(null);

	// Find the retaken course information
	const getRetakenCourseInfo = () => {
		if (!row.retakeOf) return null;

		for (const termGroup of earlierCoursesByTerm) {
			const course = termGroup.courses.find((c) => c.rowId === row.retakeOf);
			if (course) {
				return {
					name: course.label || "(Unnamed)",
					units: course.units,
					grade: course.grade,
					term: termGroup.termIndex,
					termName: termGroup.termName,
				};
			}
		}
		return null;
	};

	const retakenCourse = getRetakenCourseInfo();

	// Calculate and update menu position to keep it on screen
	const updateMenuPosition = () => {
		if (!menuRef.current) return;

		const menu = menuRef.current;
		const menuRect = menu.getBoundingClientRect();
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;

		// Get the trigger button (action button) position
		const actionButtons = document.querySelectorAll(".course-row button");
		let triggerButton = null;

		// Find the action button in the current row
		const currentRow =
			menu.closest("tr") ||
			document.querySelector(`tr[data-row-id="${row.id}"]`);
		if (currentRow) {
			const buttons = currentRow.querySelectorAll("button");
			triggerButton = Array.from(buttons).find(
				(btn) =>
					btn.querySelector("svg") &&
					btn.closest("td")?.classList.contains("text-center")
			);
		}

		if (!triggerButton) return;

		const buttonRect = triggerButton.getBoundingClientRect();

		// Start with button position
		let top = buttonRect.top;
		let left = buttonRect.right + 8; // Default: to the right of button

		// Check if menu would go off the right edge
		if (left + menuRect.width > viewportWidth - 16) {
			// Position to the left of the button instead
			left = buttonRect.left - menuRect.width - 8;
		}

		// If still off screen to the left, center it with some padding
		if (left < 16) {
			left = Math.max(
				16,
				Math.min(
					buttonRect.left - menuRect.width / 2,
					viewportWidth - menuRect.width - 16
				)
			);
		}

		// Adjust vertical position if menu would go off screen
		if (top + menuRect.height > viewportHeight - 16) {
			// Try positioning above the button
			const topAlt = buttonRect.bottom - menuRect.height;
			if (topAlt >= 16) {
				top = topAlt;
			} else {
				// If neither above nor below works, position at the bottom with scroll
				top = Math.max(16, viewportHeight - menuRect.height - 16);
			}
		}

		// Make sure menu isn't above viewport
		if (top < 16) {
			top = 16;
		}

		setMenuPosition({ top, left });
	};

	// Update position on mount and when view changes
	useEffect(() => {
		updateMenuPosition();

		// Add resize listener
		const handleResize = () => updateMenuPosition();
		window.addEventListener("resize", handleResize);
		window.addEventListener("scroll", handleResize, true);

		return () => {
			window.removeEventListener("resize", handleResize);
			window.removeEventListener("scroll", handleResize, true);
		};
	}, [view]);

	// Close menu when clicking outside
	useEffect(() => {
		const handleClickOutside = (e) => {
			if (menuRef.current && !menuRef.current.contains(e.target)) {
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
		onClose();
	};

	const handleClearRetake = () => {
		clearRetake(row.id);
		onClose();
	};

	const handleTermSelect = (termGroup) => {
		setSelectedTerm(termGroup);
		setView("courses");
	};

	const renderContent = () => {
		if (view === "main") {
			return (
				<>
					<button
						className="retake-btn w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-between"
						onClick={(e) => {
							e.stopPropagation();
							setView("terms");
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
				</>
			);
		}

		if (view === "terms") {
			return (
				<>
					<button
						onClick={() => setView("main")}
						className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center border-b border-gray-200"
					>
						<svg
							className="w-4 h-4 mr-2"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M15 19l-7-7 7-7"
							></path>
						</svg>
						Back
					</button>

					{row.retakeOf && (
						<button
							onClick={handleClearRetake}
							className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors border-b border-gray-200"
						>
							<div className="font-medium">Clear Retake</div>
							<div className="text-xs text-gray-500 mt-0.5">
								{retakenCourse ? (
									<>
										<span className="font-medium">{retakenCourse.name}</span> (
										{retakenCourse.termName || `Term ${retakenCourse.term}`})
									</>
								) : (
									row.retakeOf
								)}
							</div>
						</button>
					)}

					{earlierCoursesByTerm.length === 0 ? (
						<div className="px-4 py-2 text-sm text-gray-500 italic">
							No earlier courses
						</div>
					) : (
						earlierCoursesByTerm.map((termGroup) => (
							<button
								key={termGroup.termIndex}
								onClick={() => handleTermSelect(termGroup)}
								className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 transition-colors flex items-center justify-between"
							>
								<span className="font-medium">
									{termGroup.termName || `Term ${termGroup.termIndex}`}
								</span>
								<div className="flex items-center gap-1">
									<span className="text-xs text-gray-500 ps-1">
										({termGroup.courses.length}{" "}
										{termGroup.courses.length === 1 ? "course" : "courses"})
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
				</>
			);
		}

		if (view === "courses" && selectedTerm) {
			return (
				<>
					<button
						onClick={() => {
							setView("terms");
							setSelectedTerm(null);
						}}
						className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center border-b border-gray-200"
					>
						<svg
							className="w-4 h-4 mr-2"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M15 19l-7-7 7-7"
							></path>
						</svg>
						Back to Terms
					</button>

					<div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200">
						{selectedTerm.termName || `Term ${selectedTerm.termIndex}`} Courses
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
				</>
			);
		}

		return null;
	};

	return (
		<div
			ref={menuRef}
			className="action-menu fixed bg-white border border-gray-300 rounded-lg shadow-lg z-[100] py-1 min-w-[200px] max-w-[280px] max-h-[400px] overflow-y-auto tour-action-menu"
			style={{
				animation: "menuSlideIn 0.15s ease-out",
				top: `${menuPosition.top}px`,
				left: `${menuPosition.left}px`,
			}}
		>
			{renderContent()}
		</div>
	);
}

export default ActionMenu;
