import { useState } from "react";
import { parseTranscriptCSV } from "../utils/csvParser";

function ImportModal({ onClose, onImport }) {
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [error, setError] = useState("");

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        setFile(selected);
        setError("");
        if (selected) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const text = event.target.result;
                    const parsed = parseTranscriptCSV(text);
                    if (parsed.terms.length === 0) {
                        setError("No terms found. Please check the file format.");
                        setPreviewData(null);
                    } else {
                        setPreviewData(parsed);
                    }
                } catch (err) {
                    setError("Failed to parse file: " + err.message);
                }
            };
            reader.readAsText(selected);
        }
    };

    const handleConfirm = () => {
        if (previewData) {
            onImport(previewData);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-800">Import Transcript</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Upload CSV File</label>
                        <input 
                            type="file" 
                            accept=".csv,.txt"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Upload a CSV file exported from your student portal.
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg mb-4 border border-red-100">
                            {error}
                        </div>
                    )}

                    {previewData && (
                        <div className="border rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-4 py-2 border-b font-semibold text-gray-700 text-xs uppercase">
                                Preview: {previewData.terms.length} Terms found
                            </div>
                            <div className="max-h-60 overflow-y-auto divide-y">
                                {previewData.terms.map((term, i) => (
                                    <div key={i} className="p-3 text-sm">
                                        <div className="font-bold text-gray-800">{term.name}</div>
                                        <ul className="pl-4 mt-1 space-y-1 text-gray-600">
                                            {term.rows.map((row, j) => (
                                                <li key={j} className="flex justify-between">
                                                    <span>{row.name}</span>
                                                    <span className="font-mono text-xs bg-gray-100 px-1 rounded">
                                                        {row.grade} ({row.units}u)
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium">
                        Cancel
                    </button>
                    <button 
                        onClick={handleConfirm}
                        disabled={!previewData}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Import Data
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ImportModal;
