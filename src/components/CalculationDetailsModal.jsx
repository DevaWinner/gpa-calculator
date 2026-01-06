import { fmt } from "../utils/calculations";

function CalculationDetailsModal({ title, data, onClose }) {
	// data should contain: { attempted, earned, qp, gpa, rows: [...] }
	// rows for term view are direct.
	// rows for cum view need to include info about exclusion.

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
			<div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
				{/* Header */}
				<div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
					<h3 className="text-lg font-bold text-gray-800">{title}</h3>
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

								<div className="flex-1 overflow-y-auto p-6">

									{/* Summary Cards */}

									<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">

										<div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">

											<div className="text-xs text-indigo-600 font-semibold uppercase tracking-wider mb-1">

												GPA

											</div>

											<div className="text-2xl font-bold text-indigo-900">

												{fmt(data.gpa, "gpa")}

											</div>

										</div>

										<div className="bg-gray-50 p-4 rounded-xl border border-gray-100">

											<div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">

												Quality Points

											</div>

											<div className="text-xl font-bold text-gray-800">

												{fmt(data.qp, "other")}

											</div>

										</div>

										<div className="bg-gray-50 p-4 rounded-xl border border-gray-100">

											<div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">

												GPA Units

											</div>

											<div className="text-xl font-bold text-gray-800">

												{fmt(data.gpaDenom, "other")}

											</div>

										</div>

										<div className="bg-gray-50 p-4 rounded-xl border border-gray-100">

											<div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">

												Attempted

											</div>

											<div className="text-xl font-bold text-gray-800">

												{fmt(data.attempted, "other")}

											</div>

										</div>

									</div>

				

									{/* Formula Explanation */}

									<div className="mb-6 bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-sm text-yellow-800">

										<strong>Formula:</strong> GPA = Total Quality Points / GPA Units

										<br />

										<span className="text-xs text-yellow-600 mt-1 block">

											* GPA Units = Attempted Credits - W Credits - Excluded Retake

											Credits

										</span>

									</div>

				

									{/* Detailed Table */}

									<h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">

										Included Courses

									</h4>

									<div className="overflow-hidden ring-1 ring-gray-200 rounded-lg">

										<div className="max-h-60 overflow-y-auto"> {/* Added for scrolling table body */}

																		<table className="min-w-full divide-y divide-gray-200">

																			<thead className="bg-gray-50 sticky top-0 z-10">

													<tr>

														<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">

															Course

														</th>

														<th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">

															Grade

														</th>

														<th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">

															Units

														</th>

														<th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">

															QP

														</th>

														<th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">

															Status

														</th>

													</tr>

												</thead>

												<tbody className="bg-white divide-y divide-gray-200 text-sm">

													{data.rows.map((row, idx) => (

														<tr

															key={idx}

															className={row.excluded ? "bg-gray-50 opacity-60" : ""}

														>

															<td className="px-4 py-3 font-medium text-gray-900">

																{row.name || "(Unnamed)"}

																{row.termLabel && (

																	<span className="ml-2 text-xs text-gray-500 font-normal">

																		({row.termLabel})

																	</span>

																)}

															</td>

															<td className="px-4 py-3 text-center text-gray-600">

																{row.grade}

															</td>

															<td className="px-4 py-3 text-center text-gray-600">

																{row.units}

															</td>

															<td className="px-4 py-3 text-center text-gray-600">

																{row.q !== undefined ? fmt(row.q, "other") : "—"}

															</td>

															<td className="px-4 py-3 text-center">

																{row.excluded ? (

																	<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">

																		Excluded ({row.reason})

																	</span>

																) : (

																	<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">

																		Included

																	</span>

																)}

															</td>

														</tr>

													))}

												</tbody>

											</table>

										</div>

									</div>

								</div>

				{/* Footer */}
				<div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
					<button
						onClick={onClose}
						className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm shadow-sm transition-all"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
}

export default CalculationDetailsModal;
