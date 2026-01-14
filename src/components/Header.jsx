function Header({ clearAll, onNavigateTraining, onStartTour, onOpenEquivalences }) {
	return (
		<header className="px-4 sm:px-6 pt-8 mb-10">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h1 className="text-3xl font-black tracking-tight text-indigo-700">
						GPA Calculator
					</h1>
					<p className="text-xs text-red-600 font-semibold italic mt-1">
						Internal Tool v3.0
					</p>
				</div>
				<div className="flex items-center gap-2 flex-wrap">
					<button
						onClick={onOpenEquivalences}
						className="rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 px-3 py-2 text-sm font-medium transition-colors"
					>
						Equivalences
					</button>
					<button
						onClick={onNavigateTraining}
						className="rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 px-3 py-2 text-sm font-medium transition-colors"
					>
						Training
					</button>
					<button
						onClick={clearAll}
						className="rounded-lg border border-red-200 text-red-700 hover:bg-red-50 px-3 py-2 text-sm font-medium transition-colors"
					>
						Clear All
					</button>
				</div>
			</div>
		</header>
	);
}

export default Header;