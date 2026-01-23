import { useState, useMemo } from "react";
import { resolveEquivalenceGroups } from "../utils/calculations";

function EquivalencesModal({ equivalences, setEquivalences, systemEquivalences = {}, isExperimental = false, onClose }) {
	const [courseA, setCourseA] = useState("");
	const [courseB, setCourseB] = useState("");

	const handleAdd = () => {
		if (!courseA.trim() || !courseB.trim()) return;
		
		// Normalize inputs
		const normA = courseA.replace(/\s+/g, '').toUpperCase();
		const normB = courseB.replace(/\s+/g, '').toUpperCase();

		if (normA === normB) return; // Don't add self-equivalence

		// Check for duplicates (A-B or B-A) in user equivalences
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

	// Compute grouped equivalences for display
	const groupedEquivalences = useMemo(() => {
		// Only calculate groups if in experimental mode
		if (!isExperimental) return [];
		return resolveEquivalenceGroups(equivalences, systemEquivalences);
	}, [equivalences, systemEquivalences, isExperimental]);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
			<div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden max-h-[90vh]">
				{/* Header */}
				<div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
					<h3 className="text-lg font-bold text-gray-800">Manage Equivalences</h3>
					<button
						onClick={onClose}
						className="p-1 rounded-full hover:bg-gray-200 transition-colors text-gray-500"
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
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				{/* Content */}
				<div className="p-6 flex-1 overflow-y-auto">
					<p className="text-sm text-gray-600 mb-4">
						Define pairs of courses that are equivalent. The system will treat them as the same course for retake logic.
					</p>

					{/* Add New */}
					<div className="flex gap-2 mb-6 items-end bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
						<div className="flex-1">
							<label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1">Course A</label>
							<input
								type="text"
								value={courseA}
								onChange={(e) => setCourseA(e.target.value.replace(/\s+/g, '').toUpperCase())}
								className="w-full p-2 text-sm rounded-md border border-indigo-200 focus:ring-indigo-500 focus:border-indigo-500"
								placeholder="MATH101"
							/>
						</div>
						<div className="pb-2 text-indigo-300 font-bold">＝</div>
						<div className="flex-1">
							<label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1">Course B</label>
							<input
								type="text"
								value={courseB}
								onChange={(e) => setCourseB(e.target.value.replace(/\s+/g, '').toUpperCase())}
								className="w-full p-2 text-sm rounded-md border border-indigo-200 focus:ring-indigo-500 focus:border-indigo-500"
								placeholder="MATH100"
							/>
						</div>
						<button
							onClick={handleAdd}
							className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-md hover:bg-indigo-700 transition-all shadow-sm active:scale-95"
						>
							Add
						</button>
					</div>

					{/* Active Groups View - Only in Experimental */}
					{isExperimental && groupedEquivalences.length > 0 && (
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

					{/* Management List (Only User Defined) */}
					{equivalences.length > 0 && (
						<div>
							<h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Custom Rules</h4>
							<div className="border border-gray-200 rounded-lg overflow-hidden">
								<table className="min-w-full divide-y divide-gray-200">
									<tbody className="bg-white divide-y divide-gray-200">
										{equivalences.map((eq) => (
											<tr key={eq.id} className="hover:bg-gray-50 transition-colors">
												<td className="px-4 py-2 text-sm text-gray-900 w-1/2">{eq.courseA}</td>
												<td className="px-4 py-2 text-sm text-gray-900 w-1/2">{eq.courseB}</td>
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
					)}
					
					{equivalences.length === 0 && (!isExperimental || groupedEquivalences.length === 0) && (
						<div className="text-center py-8 text-gray-400 italic text-sm border-2 border-dashed border-gray-200 rounded-xl">
							No equivalences defined.
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
