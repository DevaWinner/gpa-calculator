function Header({ clearAll, onNavigateTraining, onStartTour, onOpenEquivalences, activeSessionName, onOpenSessions }) {
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
					<button
						onClick={onOpenSessions}
						className="flex items-center gap-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 text-sm font-semibold transition-colors mr-2"
					>
						<svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
						</svg>
						{activeSessionName || "Transcripts"}
					</button>
					<span className="text-xs text-gray-500 font-medium">v2.0</span>
					<button
						onClick={onOpenEquivalences}
						className="rounded-xl border border-indigo-200 text-indigo-700 hover:bg-indigo-50 px-3 py-2 text-sm"
					>
						Configure Equivalences
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
