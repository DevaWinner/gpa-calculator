import { fmt } from "../utils/calculations";

function TranscriptStats({
	instStats,
	transferEarned,
	setTransferEarned,
	institution,
}) {
	const overallEarned =
		instStats.earned + (Number.isFinite(transferEarned) ? transferEarned : 0);

	return (
		<section id="transcriptStats" className="mt-10">
			<h2 className="text-xl font-bold text-gray-800 mb-3">
				End of Transcript Statistics
			</h2>
			<div className="w-full bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm overflow-hidden">
				<div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
					<div className="col-span-3 px-4 py-2">&nbsp;</div>
					<div className="col-span-2 px-4 p-3 text-center">GPA</div>
					<div className="col-span-2 px-4 p-3 text-center">Attempted</div>
					<div className="col-span-2 px-4 p-3 text-center">Earned</div>
					<div className="col-span-3 px-4 p-3 text-center">Quality Pts</div>
				</div>
				{/* Transfer Row */}
				<div className="grid grid-cols-12 border-b border-gray-100 items-center text-sm">
					<div className="col-span-3 px-4 py-2 font-semibold text-gray-800">
						Transfer
					</div>
					<div className="col-span-2 px-4 py-2 text-center text-gray-500">
						— — —
					</div>
					<div className="col-span-2 px-4 py-2 text-center text-gray-500">
						— — —
					</div>
					<div className="col-span-2 px-4 py-2 text-center">
						<span
							contentEditable="true"
							suppressContentEditableWarning
							onBlur={(e) => {
								const val = parseFloat(e.currentTarget.textContent.trim());
								setTransferEarned(Number.isFinite(val) ? Math.max(0, val) : 0);
							}}
							className="inline-block min-w-[3ch] text-gray-900 px-2 py-1 rounded-md border border-gray-200 focus-ring"
						>
							{transferEarned}
						</span>
					</div>
					<div className="col-span-3 px-4 py-2 text-center text-gray-500">
						{fmt(0, "other")}
					</div>
				</div>
				{/* Institution Totals Row */}
				<div className="grid grid-cols-12 border-b border-gray-100 items-center text-sm">
					<div className="col-span-3 px-4 py-2 font-semibold text-gray-800">
						Institution Totals
					</div>
					<div className="col-span-2 px-4 py-2 text-center">
						{fmt(instStats.gpa, "gpa")}
					</div>
					<div className="col-span-2 px-4 py-2 text-center">
						{fmt(instStats.attempted, "other")}
					</div>
					<div className="col-span-2 px-4 py-2 text-center">
						{fmt(instStats.earned, "other")}
					</div>
					<div className="col-span-3 px-4 py-2 text-center">
						{fmt(instStats.qp, "other")}
					</div>
				</div>
				{/* Overall Totals Row */}
				<div className="grid grid-cols-12 items-center text-sm">
					<div className="col-span-3 px-4 py-2 font-semibold text-gray-800">
						Overall Totals
					</div>
					<div className="col-span-2 px-4 py-2 text-center">
						{fmt(instStats.gpa, "gpa")}
					</div>
					<div className="col-span-2 px-4 py-2 text-center">
						{fmt(instStats.attempted, "other")}
					</div>
					<div className="col-span-2 px-4 py-2 text-center">
						{fmt(overallEarned, "other")}
					</div>
					<div className="col-span-3 px-4 py-2 text-center">
						{fmt(instStats.qp, "other")}
					</div>
				</div>
			</div>
		</section>
	);
}

export default TranscriptStats;
