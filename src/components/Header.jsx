function Header({ clearAll, onNavigateTraining, onStartTour }) {
	return (
		<header className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 mb-10">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h1 className="text-4xl font-black tracking-tight text-indigo-700">
						GPA Calculator
					</h1>
					<p className="text-sm text-red-600 font-semibold italic mt-1">
						This is to be used only by internal transcript team members.
					</p>
				</div>
				<div className="flex items-center gap-2 flex-wrap">
					<span className="text-xs text-gray-500 font-medium">v2.0</span>
					<button
						onClick={onStartTour}
						className="rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50 px-3 py-2 text-sm"
					>
						Tour
					</button>
					<button
						onClick={onNavigateTraining}
						className="rounded-xl border border-indigo-200 text-indigo-700 hover:bg-indigo-50 px-3 py-2 text-sm"
					>
						Training
					</button>
					<button
						onClick={clearAll}
						className="rounded-xl border border-red-200 text-red-700 hover:bg-red-50 px-3 py-2 text-sm"
					>
						Clear All
					</button>
				</div>
			</div>
		</header>
	);
}

export default Header;
