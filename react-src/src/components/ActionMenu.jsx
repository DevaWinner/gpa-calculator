import { useState, useRef, useEffect } from "react";

function ActionMenu({
	row,
	term,
	earlierCourses,
	removeCourse,
	setRetake,
	clearRetake,
	onClose,
}) {
	const [showRetakeSubmenu, setShowRetakeSubmenu] = useState(false);
	const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
	const [submenuPosition, setSubmenuPosition] = useState({ top: 0, right: 0 });
	const menuRef = useRef(null);
	const submenuRef = useRef(null);
	const buttonRef = useRef(null);

	// Calculate menu position on mount
	useEffect(() => {
		if (menuRef.current && menuRef.current.parentElement) {
			const parentRect = menuRef.current.parentElement.getBoundingClientRect();
			setMenuPosition({
				top: parentRect.bottom + 4,
				right: window.innerWidth - parentRect.right,
			});
		}
	}, []);

	// Calculate submenu position when it opens
	useEffect(() => {
		if (showRetakeSubmenu && menuRef.current) {
			const menuRect = menuRef.current.getBoundingClientRect();
			// Position submenu to the left of main menu, aligned to the right edge of screen
			setSubmenuPosition({
				top: menuRect.top,
				right: window.innerWidth - menuRect.left + 8,
			});
		}
	}, [showRetakeSubmenu]);

	// Close menu when clicking outside
	useEffect(() => {
		const handleClickOutside = (e) => {
			if (
				menuRef.current &&
				!menuRef.current.contains(e.target) &&
				(!submenuRef.current || !submenuRef.current.contains(e.target))
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
		setShowRetakeSubmenu(false);
		onClose();
	};

	const handleClearRetake = () => {
		clearRetake(row.id);
		setShowRetakeSubmenu(false);
		onClose();
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

			{/* Retake Submenu */}
			{showRetakeSubmenu && (
				<div
					ref={submenuRef}
					className="retake-submenu fixed bg-white border border-gray-300 rounded-lg shadow-lg z-50 py-1 min-w-[200px]"
					style={{
						animation: "menuSlideIn 0.15s ease-out",
						top: `${submenuPosition.top}px`,
						right: `${submenuPosition.right}px`,
					}}
				>
					{row.retakeOf ? (
						<button
							onClick={handleClearRetake}
							className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
						>
							<div className="font-medium">Clear Retake Link</div>
							<div className="text-xs text-gray-500 mt-0.5">
								Currently retaking: {row.retakeOf}
							</div>
						</button>
					) : earlierCourses.length === 0 ? (
						<div className="px-4 py-2 text-sm text-gray-500 italic">
							No earlier courses
						</div>
					) : (
						earlierCourses.map((opt) => (
							<button
								key={opt.rowId}
								onClick={() => handleSetRetake(opt.rowId)}
								className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
							>
								<div className="font-medium">{opt.label}</div>
								<div className="text-xs text-gray-500 mt-0.5">
									{opt.units} units • Grade: {opt.grade}
								</div>
							</button>
						))
					)}
				</div>
			)}
		</>
	);
}

export default ActionMenu;
