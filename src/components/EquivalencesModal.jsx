import { useState, useMemo } from "react";
import { resolveEquivalenceGroups } from "../utils/calculations";

function EquivalencesModal({
	equivalences,
	setEquivalences,
	systemEquivalences = {},
	isExperimental = false,
	showAutoEquivalenceList = true,
	onClose,
}) {
	const [activeTab, setActiveTab] = useState("custom"); // "custom" | "system"
	const [courseA, setCourseA] = useState("");
	const [courseB, setCourseB] = useState("");
	const [systemSearch, setSystemSearch] = useState("");

	const handleAdd = () => {
		if (!courseA.trim() || !courseB.trim()) return;

		const normA = courseA.replace(/\s+/g, '').toUpperCase();
		const normB = courseB.replace(/\s+/g, '').toUpperCase();

		if (normA === normB) return;

		const exists = equivalences.some(
			(eq) =>
				(eq.courseA === normA && eq.courseB === normB) ||
				(eq.courseA === normB && eq.courseB === normA)
		);

		if (!exists) {
			setEquivalences([
				...equivalences,
				{ id: Date.now(), courseA: normA, courseB: normB },
			]);
			setCourseA("");
			setCourseB("");
		}
	};

	const handleRemove = (id) => {
		setEquivalences(equivalences.filter((eq) => eq.id !== id));
	};

	// Compute grouped equivalences for display (experimental only)
	const groupedEquivalences = useMemo(() => {
		if (!isExperimental || !showAutoEquivalenceList) return [];
		return resolveEquivalenceGroups(equivalences, systemEquivalences);
	}, [equivalences, systemEquivalences, isExperimental, showAutoEquivalenceList]);

	// Filter system equivalencies by search query
	const filteredSystemEntries = useMemo(() => {
		const entries = Object.entries(systemEquivalences);
		if (!systemSearch.trim()) return entries;
		const q = systemSearch.trim().toUpperCase();
		return entries.filter(
			([course, equivs]) =>
				course.includes(q) || equivs.some((e) => e.includes(q))
		);
	}, [systemEquivalences, systemSearch]);

	const systemCount = Object.keys(systemEquivalences).length;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
			<div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden max-h-[90vh]">
				{/* Header */}
				<div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
					<h3 className="text-lg font-bold text-gray-800">Equivalences</h3>
					<button
						onClick={onClose}
						className="p-1 rounded-full hover:bg-gray-200 transition-colors text-gray-500"
					>
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{/* Tabs */}
				<div className="flex border-b border-gray-200 bg-gray-50 px-6">
					<button
						onClick={() => setActiveTab("custom")}
						className={`py-3 px-1 mr-6 text-sm font-semibold border-b-2 transition-colors ${
							activeTab === "custom"
								? "border-blue-600 text-blue-700"
								: "border-transparent text-gray-500 hover:text-gray-700"
						}`}
					>
						Custom Rules
						{equivalences.length > 0 && (
							<span className="ml-2 text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">
								{equivalences.length}
							</span>
						)}
					</button>
					<button
						onClick={() => setActiveTab("system")}
						className={`py-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
							activeTab === "system"
								? "border-blue-600 text-blue-700"
								: "border-transparent text-gray-500 hover:text-gray-700"
						}`}
					>
						System
						<span className="ml-2 text-xs bg-gray-200 text-gray-600 rounded-full px-2 py-0.5">
							{systemCount}
						</span>
					</button>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto">
					{/* ── Custom Rules Tab ── */}
					{activeTab === "custom" && (
						<div className="p-6">
							<p className="text-sm text-gray-600 mb-4">
								Define pairs of courses that are equivalent. The system will treat them as the same course for retake logic.
							</p>

							{/* Add New */}
							<div className="flex gap-2 mb-6 items-end bg-blue-50/50 p-4 rounded-xl border border-blue-100">
								<div className="flex-1">
									<label className="block text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">Course A</label>
									<input
										type="text"
										value={courseA}
										onChange={(e) => setCourseA(e.target.value.replace(/\s+/g, '').toUpperCase())}
										className="w-full p-2 text-sm rounded-md border border-blue-200 focus:ring-blue-500 focus:border-blue-500"
										placeholder="MATH101"
									/>
								</div>
								<div className="pb-2 text-blue-300 font-bold">＝</div>
								<div className="flex-1">
									<label className="block text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">Course B</label>
									<input
										type="text"
										value={courseB}
										onChange={(e) => setCourseB(e.target.value.replace(/\s+/g, '').toUpperCase())}
										className="w-full p-2 text-sm rounded-md border border-blue-200 focus:ring-blue-500 focus:border-blue-500"
										placeholder="MATH100"
									/>
								</div>
								<button
									onClick={handleAdd}
									className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-md hover:bg-blue-700 transition-all shadow-sm active:scale-95"
								>
									Add
								</button>
							</div>

							{/* Active Groups View - Only in Experimental */}
							{isExperimental && showAutoEquivalenceList && groupedEquivalences.length > 0 && (
								<div className="mb-6">
									<h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Active Equivalence Groups</h4>
									<div className="space-y-2">
										{groupedEquivalences.map((group, idx) => (
											<div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex flex-wrap gap-2">
												{group.map((course) => (
													<span key={course} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-gray-700 border border-gray-300 shadow-sm">
														{course}
													</span>
												))}
											</div>
										))}
									</div>
								</div>
							)}

							{/* User-defined list */}
							{equivalences.length > 0 ? (
								<div>
									<h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Active Rules</h4>
									<div className="border border-gray-200 rounded-lg overflow-hidden">
										<table className="min-w-full divide-y divide-gray-200">
											<tbody className="bg-white divide-y divide-gray-200">
												{equivalences.map((eq) => (
													<tr key={eq.id} className="hover:bg-gray-50 transition-colors">
														<td className="px-4 py-2 text-sm font-mono text-gray-900 w-1/2">{eq.courseA}</td>
														<td className="px-4 py-2 text-sm font-mono text-gray-900 w-1/2">{eq.courseB}</td>
														<td className="px-4 py-2 text-center">
															<button
																onClick={() => handleRemove(eq.id)}
																className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50"
																title="Remove Rule"
															>
																<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																	<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
																</svg>
															</button>
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>
							) : (
								<div className="text-center py-8 text-gray-400 italic text-sm border-2 border-dashed border-gray-200 rounded-xl">
									No custom rules defined.
								</div>
							)}
						</div>
					)}

					{/* ── System Tab ── */}
					{activeTab === "system" && (
						<div className="p-6">
							<p className="text-sm text-gray-600 mb-4">
								These equivalencies are built into the system and apply automatically to all transcripts.
							</p>

							{/* Search */}
							<div className="relative mb-4">
								<svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
								</svg>
								<input
									type="text"
									value={systemSearch}
									onChange={(e) => setSystemSearch(e.target.value.toUpperCase())}
									placeholder="Search by course code…"
									className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
								/>
								{systemSearch && (
									<button
										onClick={() => setSystemSearch("")}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
									>
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								)}
							</div>

							{/* Results count */}
							<p className="text-xs text-gray-400 mb-3">
								{systemSearch
									? `${filteredSystemEntries.length} of ${systemCount} matching`
									: `${systemCount} entries`}
							</p>

							{filteredSystemEntries.length > 0 ? (
								<div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
									{filteredSystemEntries.map(([course, equivs]) => (
										<div key={course} className="flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
											<span className="font-mono text-sm font-semibold text-gray-800 w-28 shrink-0 pt-0.5">
												{course}
											</span>
											<span className="text-gray-400 text-sm shrink-0 pt-0.5">→</span>
											<div className="flex flex-wrap gap-1.5">
												{equivs.map((e) => (
													<span key={e} className="inline-block font-mono text-xs bg-gray-100 text-gray-700 rounded px-2 py-0.5">
														{e}
													</span>
												))}
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="text-center py-8 text-gray-400 italic text-sm border-2 border-dashed border-gray-200 rounded-xl">
									No entries match "{systemSearch}".
								</div>
							)}
						</div>
					)}
				</div>

				<div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
					<button
						onClick={onClose}
						className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
}

export default EquivalencesModal;
