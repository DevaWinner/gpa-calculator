function Header({ clearAll, onNavigateTraining, onStartTour, onOpenEquivalences, isExperimental, onToggleExperimental }) {
	return (
		<header className="px-4 sm:px-6 pt-8 mb-10">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h1 className="text-3xl font-black tracking-tight text-indigo-700">
						Transcript calculator
					</h1>
					<p className="text-xs text-red-600 font-semibold italic mt-1">
						Internal Tool v4.0
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
					
					{/* Experimental Toggle */}
					<div className="flex items-center ml-2 border-l pl-4 border-gray-200">
						<label className="inline-flex items-center cursor-pointer">
							<input 
								type="checkbox" 
								checked={isExperimental} 
								onChange={onToggleExperimental} 
								className="sr-only peer" 
							/>
							<div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
							<span className="ms-2 text-xs font-medium text-gray-500">Exp.</span>
						</label>
					</div>
				</div>
			</div>
		</header>
	);
}

export default Header;