import { useMemo, useState } from "react";
import { parseTranscriptCSV } from "../utils/csvParser";
import { parsePastedTranscript } from "../utils/pasteParser";

const IMPORT_MODES = [
	{
		value: "replace",
		label: "Replace",
		description: "Replace the current transcript terms with the imported terms.",
	},
	{
		value: "append",
		label: "Append",
		description: "Append imported terms after the current transcript terms.",
	},
	{
		value: "merge",
		label: "Merge",
		description: "Merge imported rows into existing terms by normalized term name.",
	},
];

function IssueList({ title, issues, tone }) {
	if (!issues.length) {
		return null;
	}

	const toneClasses =
		tone === "error"
			? "bg-red-50 border-red-100 text-red-800"
			: "bg-amber-50 border-amber-100 text-amber-900";

	return (
		<div className={`rounded-xl border p-4 ${toneClasses}`}>
			<h4 className="text-sm font-bold uppercase tracking-wide mb-3">{title}</h4>
			<div className="space-y-3 text-sm">
				{issues.map((issue, index) => (
					<div key={`${issue.code}-${issue.lineNumber || issue.termName || index}`}>
						<div className="font-semibold">{issue.title}</div>
						<div className="mt-1 leading-relaxed">
							{issue.detail}
							{issue.lineNumber ? ` (Line ${issue.lineNumber})` : ""}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

function ImportModal({ onClose, onImport }) {
	const [file, setFile] = useState(null);
	const [pastedText, setPastedText] = useState("");
	const [inputMethod, setInputMethod] = useState("paste"); // "paste" or "file"
	const [previewData, setPreviewData] = useState(null);
	const [error, setError] = useState("");
	const [importMode, setImportMode] = useState("replace");

	const parserIssues = previewData?.diagnostics.issues || [];
	const validationIssues = previewData?.validation.issues || [];
	const blockingErrors = useMemo(
		() => [...parserIssues, ...validationIssues].filter((issue) => issue.severity === "error"),
		[parserIssues, validationIssues]
	);
	const warningIssues = useMemo(
		() => [...parserIssues, ...validationIssues].filter((issue) => issue.severity !== "error"),
		[parserIssues, validationIssues]
	);

	const handleFileChange = (event) => {
		const selected = event.target.files[0];
		setFile(selected || null);
		setError("");
		setPreviewData(null);

		if (!selected) {
			return;
		}

		const reader = new FileReader();
		reader.onload = (loadEvent) => {
			try {
				const text = loadEvent.target.result;
				const parsed = parseTranscriptCSV(text);
				setPreviewData(parsed);

				if (parsed.terms.length === 0) {
					setError("No terms found. Review the diagnostics below.");
				}
			} catch (parseError) {
				setError(`Failed to parse file: ${parseError.message}`);
			}
		};
		reader.readAsText(selected);
	};

	const handlePasteChange = (event) => {
		const text = event.target.value;
		setPastedText(text);
		setError("");
		setPreviewData(null);

		if (!text.trim()) {
			return;
		}

		try {
			const parsed = parsePastedTranscript(text);
			setPreviewData(parsed);

			if (parsed.terms.length === 0) {
				setError("No terms found. Review the diagnostics below.");
			}
		} catch (parseError) {
			setError(`Failed to parse text: ${parseError.message}`);
		}
	};

	const handleInputMethodChange = (method) => {
		setInputMethod(method);
		setError("");
		setPreviewData(null);
		setFile(null);
		setPastedText("");
	};

	const handleConfirm = () => {
		if (!previewData || previewData.terms.length === 0 || blockingErrors.length > 0) {
			return;
		}

		onImport({
			mode: importMode,
			parsedData: previewData,
		});
		onClose();
	};

	const importButtonLabel =
		importMode === "replace"
			? "Replace Transcript"
			: importMode === "append"
			? "Append Terms"
			: "Merge Terms";

	return (
		<div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
			<div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex flex-col max-h-[92vh] overflow-hidden">
				<div className="px-6 py-4 border-b border-gray-100 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
					<div>
						<h3 className="text-lg font-bold text-gray-800">Import Transcript</h3>
						<p className="text-xs text-gray-500 mt-1">
							Review parsed terms, warnings, and skipped lines before importing.
						</p>
					</div>
					<div className="flex items-center gap-2">
						<div className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 p-1">
							{IMPORT_MODES.map((modeOption) => (
								<button
									key={modeOption.value}
									type="button"
									onClick={() => setImportMode(modeOption.value)}
									className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
										importMode === modeOption.value
											? "bg-white text-blue-700 shadow-sm"
											: "text-gray-600 hover:bg-white hover:text-gray-900"
									}`}
									title={modeOption.description}
								>
									{modeOption.label}
								</button>
							))}
						</div>
						<button onClick={onClose} className="text-gray-400 hover:text-gray-600">
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
						</button>
					</div>
				</div>

				<div className="p-6 overflow-y-auto space-y-5">
					{/* Input Method Tabs */}
					<div className="hidden gap-2 border-b border-gray-200 pb-3">
						<button
							type="button"
							onClick={() => handleInputMethodChange("paste")}
							className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
								inputMethod === "paste"
									? "bg-blue-100 text-blue-700"
									: "text-gray-600 hover:bg-gray-100"
							}`}
						>
							📋 Paste Text
						</button>
						<button
							type="button"
							onClick={() => handleInputMethodChange("file")}
							className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
								inputMethod === "file"
									? "bg-blue-100 text-blue-700"
									: "text-gray-600 hover:bg-gray-100"
							}`}
						>
							📁 Upload File
						</button>
					</div>

					{/* Paste Input */}
					{inputMethod === "paste" && (
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Paste Transcript Text
							</label>
							<textarea
								value={pastedText}
								onChange={handlePasteChange}
								placeholder="Copy your transcript from the Anthology portal and paste it here..."
								className="block w-full h-48 text-sm text-gray-700 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono"
							/>
							<p className="text-xs text-gray-500 mt-2 leading-relaxed">
								<strong>Instructions:</strong> Open your transcript in Anthology, select all the text (Ctrl+A), copy it (Ctrl+C), and paste it above (Ctrl+V).
							</p>
						</div>
					)}

					{/* File Upload Input */}
					{inputMethod === "file" && (
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Upload CSV File</label>
							<input
								type="file"
								accept=".csv,.txt"
								onChange={handleFileChange}
								className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
							/>
							<p className="text-xs text-gray-500 mt-2 leading-relaxed">
								Upload a CSV file exported from Anthology portal.
								<br />
								<span className="block mt-1">
									<strong>Instructions:</strong> Click on <strong>Export</strong> at the top of your transcript, then choose the <strong>CSV (Delimited by comma)</strong> option.
								</span>
								{file && (
									<span className="block mt-2 text-gray-700">
										Selected file: <strong>{file.name}</strong>
									</span>
								)}
							</p>
						</div>
					)}

					{error && (
						<div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
							{error}
						</div>
					)}

					{previewData && (
						<>
							<div className="grid gap-2 md:grid-cols-4">
								<div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
									<div className="text-xs font-bold uppercase tracking-wide text-gray-500">Terms</div>
									<div className="mt-1 text-xl font-black text-gray-900 leading-none">{previewData.diagnostics.summary.parsedTerms}</div>
								</div>
								<div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
									<div className="text-xs font-bold uppercase tracking-wide text-gray-500">Courses</div>
									<div className="mt-1 text-xl font-black text-gray-900 leading-none">{previewData.diagnostics.summary.parsedCourses}</div>
								</div>
								<div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
									<div className="text-xs font-bold uppercase tracking-wide text-amber-700">Warnings</div>
									<div className="mt-1 text-xl font-black text-amber-900 leading-none">{previewData.diagnostics.summary.warningCount}</div>
								</div>
								<div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
									<div className="text-xs font-bold uppercase tracking-wide text-gray-500">Skipped Lines</div>
									<div className="mt-1 text-xl font-black text-gray-900 leading-none">{previewData.diagnostics.summary.skippedLines}</div>
								</div>
							</div>

							<IssueList title="Import Errors" issues={blockingErrors} tone="error" />
							<IssueList title="Import Warnings" issues={warningIssues} tone="warning" />

							<div className="space-y-4">
								<div className="grid gap-4 md:grid-cols-2">
									<details className="rounded-xl border border-gray-200 bg-gray-50 p-4">
										<summary className="cursor-pointer font-semibold text-gray-900">
											Skipped Lines ({previewData.diagnostics.skippedLines.length})
										</summary>
										<div className="mt-3 space-y-3 text-sm text-gray-700 max-h-56 overflow-y-auto pr-2">
											{previewData.diagnostics.skippedLines.length === 0 && (
												<div>No skipped lines.</div>
											)}
											{previewData.diagnostics.skippedLines.map((line) => (
												<div key={`${line.code}-${line.lineNumber}`} className="rounded-lg bg-white p-3 border border-gray-200">
													<div className="font-semibold">Line {line.lineNumber}</div>
													<div className="mt-1 text-gray-600">{line.reason}</div>
													<pre className="mt-2 text-xs whitespace-pre-wrap break-words text-gray-500">{line.rawLine}</pre>
												</div>
											))}
										</div>
									</details>

									<details className="rounded-xl border border-gray-200 bg-gray-50 p-4">
										<summary className="cursor-pointer font-semibold text-gray-900">
											Detected Terms ({previewData.diagnostics.detectedTerms.length})
										</summary>
										<div className="mt-3 space-y-2 text-sm text-gray-700 max-h-56 overflow-y-auto pr-2">
											{previewData.diagnostics.detectedTerms.map((term) => (
												<div key={`${term.termName}-${term.lineNumber}`} className="rounded-lg bg-white p-3 border border-gray-200">
													<div className="font-semibold">{term.termName}</div>
													<div className="text-xs text-gray-500 mt-1">Detected at line {term.lineNumber}</div>
												</div>
											))}
										</div>
									</details>
								</div>

								{previewData.diagnostics.ignoredTransfers.length > 0 && (
									<details className="rounded-xl border border-gray-200 bg-gray-50 p-4">
										<summary className="cursor-pointer font-semibold text-gray-900">
											Ignored Transfer Terms ({previewData.diagnostics.ignoredTransfers.length})
										</summary>
										<div className="mt-3 space-y-2 text-sm text-gray-700 max-h-44 overflow-y-auto pr-2">
											{previewData.diagnostics.ignoredTransfers.map((item) => (
												<div key={`${item.lineNumber}-${item.rawLine}`} className="rounded-lg bg-white p-3 border border-gray-200">
													<div className="font-semibold">Line {item.lineNumber}</div>
													<pre className="mt-2 text-xs whitespace-pre-wrap break-words text-gray-500">{item.rawLine}</pre>
												</div>
											))}
										</div>
									</details>
								)}

								<div className="border rounded-xl overflow-hidden">
									<div className="bg-gray-50 px-4 py-3 border-b">
										<div className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
											Preview
										</div>
										<div className="text-xs text-gray-500 mt-1">
											Review parsed terms and courses before importing.
										</div>
									</div>
									<div className="max-h-[28rem] overflow-y-auto divide-y">
										{previewData.terms.map((term, termIndex) => (
											<div key={`${term.name}-${termIndex}`} className="p-4">
												<div className="flex items-center justify-between gap-3">
													<div className="font-bold text-gray-800">{term.name}</div>
													<div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
														{term.rows.length} {term.rows.length === 1 ? "course" : "courses"}
													</div>
												</div>
												<ul className="mt-3 space-y-2 text-sm text-gray-700">
													{term.rows.map((row, rowIndex) => (
														<li
															key={`${term.name}-${row.name}-${rowIndex}`}
															className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2"
														>
															<span className="font-medium">{row.name}</span>
															<span className="font-mono text-xs bg-white border border-gray-200 px-2 py-1 rounded">
																{row.grade} ({row.units}u)
															</span>
														</li>
													))}
												</ul>
											</div>
										))}
									</div>
								</div>
							</div>
						</>
					)}
				</div>

				<div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
					<button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm shadow-sm transition-all">
						Cancel
					</button>
					<button
						onClick={handleConfirm}
						disabled={!previewData || previewData.terms.length === 0 || blockingErrors.length > 0}
						className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{importButtonLabel}
					</button>
				</div>
			</div>
		</div>
	);
}

export default ImportModal;
