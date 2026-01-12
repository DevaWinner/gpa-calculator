import { useState } from "react";

function EquivalencesModal({ equivalences, setEquivalences, onClose }) {
	const [courseA, setCourseA] = useState("");
	const [courseB, setCourseB] = useState("");

	const handleAdd = () => {
		if (!courseA.trim() || !courseB.trim()) return;
		
		// Normalize inputs
		const normA = courseA.replace(/\s+/g, '').toUpperCase();
		const normB = courseB.replace(/\s+/g, '').toUpperCase();

		if (normA === normB) return; // Don't add self-equivalence

		// Check for duplicates (A-B or B-A)
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
					<div className="flex gap-2 mb-6 items-end">
						<div className="flex-1">
							<label className="block text-xs font-medium text-gray-700 mb-1">Course A</label>
							<input
								type="text"
								value={courseA}
								onChange={(e) => setCourseA(e.target.value.replace(/\s+/g, '').toUpperCase())}
								className="w-full p-2 text-sm rounded-md border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
								placeholder="MATH101"
							/>
						</div>
						<div className="pb-2 text-gray-400">=</div>
						<div className="flex-1">
							<label className="block text-xs font-medium text-gray-700 mb-1">Course B</label>
							<input
								type="text"
								value={courseB}
								onChange={(e) => setCourseB(e.target.value.replace(/\s+/g, '').toUpperCase())}
								className="w-full p-2 text-sm rounded-md border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
								placeholder="MATH100"
							/>
						</div>
						<button
							onClick={handleAdd}
							className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
						>
							Add
						</button>
					</div>

					{/* List */}
					<div className="border border-gray-200 rounded-lg overflow-hidden">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Course 1</th>
									<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Course 2</th>
									<th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase w-16">Action</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{equivalences.length === 0 ? (
									<tr>
										<td colSpan="3" className="px-4 py-4 text-center text-sm text-gray-500 italic">
											No equivalences defined.
										</td>
									</tr>
								) : (
									equivalences.map((eq) => (
										<tr key={eq.id}>
											<td className="px-4 py-2 text-sm text-gray-900">{eq.courseA}</td>
											<td className="px-4 py-2 text-sm text-gray-900">{eq.courseB}</td>
											<td className="px-4 py-2 text-center">
												<button
													onClick={() => handleRemove(eq.id)}
													className="text-red-600 hover:text-red-800 transition-colors"
												>
													<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
													</svg>
												</button>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
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
