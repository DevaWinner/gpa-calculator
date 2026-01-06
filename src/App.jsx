import { useState, useEffect } from "react";
import Header from "./components/Header";
import TermCard from "./components/TermCard";
import TranscriptStats from "./components/TranscriptStats";
import TransferCredits from "./components/TransferCredits";
import {
	SCALE,
	fmt,
	computeCumMetrics,
	computeRetakeExclusionsMap,
} from "./utils/calculations";
import { debugError } from "./utils/debug";

const STORAGE_KEY = "gpa_state_v3";

function App() {
	const [transferEarned, setTransferEarned] = useState(0);
	const [transfers, setTransfers] = useState([]);
	const [terms, setTerms] = useState([]);
	const [nextRowId, setNextRowId] = useState(1);
	const [isAnyModalOpen, setIsAnyModalOpen] = useState(false); // New state for modal control

	// Effect to prevent body scrolling when modal is open
	useEffect(() => {
		if (isAnyModalOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = 'unset'; // Or 'auto' or 'initial'
		}
		// Cleanup effect
		return () => {
			document.body.style.overflow = 'unset';
		};
	}, [isAnyModalOpen]);

	// Load from localStorage on mount
	useEffect(() => {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			try {
				const state = JSON.parse(saved);
				setNextRowId(state.nextRowId || 1);
				setTransferEarned(state.transferEarned || 0);
				setTransfers(state.transfers || []);
				setTerms(state.terms || []);
			} catch (e) {
				debugError("Failed to restore state", e);
				seedDefaultTerms();
			}
		} else {
			seedDefaultTerms();
		}
	}, []);

	// Save to localStorage whenever state changes
	useEffect(() => {
		if (terms.length > 0) {
			const state = {
				nextRowId,
				transferEarned,
				transfers,
				terms,
			};
			localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
		}
	}, [nextRowId, transferEarned, transfers, terms]);

	const seedDefaultTerms = () => {
		const defaultTerms = [];
		for (let i = 1; i <= 3; i++) {
			defaultTerms.push({
				termIndex: i,
				name: `Term ${i}`,
				rows: [
					{
						id: String(nextRowId + i - 1),
						name: "",
						units: 0,
						grade: "W",
						retakeOf: null,
					},
				],
			});
		}
		setTerms(defaultTerms);
		setNextRowId(nextRowId + 3);
	};

	const addTerm = () => {
		const newTerm = {
			termIndex: terms.length + 1,
			name: `Term ${terms.length + 1}`,
			rows: [
				{
					id: String(nextRowId),
					name: "",
					units: 0,
					grade: "W",
					retakeOf: null,
				},
			],
		};
		setTerms([...terms, newTerm]);
		setNextRowId(nextRowId + 1);
	};

	const removeTerm = (termIndex) => {
		const newTerms = terms
			.filter((t) => t.termIndex !== termIndex)
			.map((t, i) => ({
				...t,
				termIndex: i + 1,
				name: t.name || `Term ${i + 1}`,
			}));
		setTerms(newTerms);
		localStorage.removeItem(STORAGE_KEY);
	};

	const updateTermName = (termIndex, name) => {
		const newTerms = terms.map((t) =>
			t.termIndex === termIndex ? { ...t, name } : t
		);
		setTerms(newTerms);
	};

	const addCourse = (termIndex) => {
		const newTerms = terms.map((t) => {
			if (t.termIndex === termIndex) {
				return {
					...t,
					rows: [
						...t.rows,
						{
							id: String(nextRowId),
							name: "",
							units: 0,
							grade: "W",
							retakeOf: null,
						},
					],
				};
			}
			return t;
		});
		setTerms(newTerms);
		setNextRowId(nextRowId + 1);
	};

	const removeCourse = (termIndex, rowId) => {
		const newTerms = terms
			.map((t) => {
				if (t.termIndex === termIndex) {
					const newRows = t.rows.filter((r) => r.id !== rowId);
					if (newRows.length === 0) {
						return {
							...t,
							rows: [
								{
									id: String(nextRowId),
									name: "",
									units: 0,
									grade: "W",
									retakeOf: null,
								},
							],
						};
					}
					return { ...t, rows: newRows };
				}
				return t;
			})
			.map((t) => {
				// Clear retake links that reference the removed course
				return {
					...t,
					rows: t.rows.map((r) => {
						if (r.retakeOf === rowId) {
							return { ...r, retakeOf: null };
						}
						return r;
					}),
				};
			});

		setTerms(newTerms);
		if (terms.find((t) => t.termIndex === termIndex)?.rows.length === 0) {
			setNextRowId(nextRowId + 1);
		}
		localStorage.removeItem(STORAGE_KEY);
	};

	const updateCourse = (termIndex, rowId, field, value) => {
		const newTerms = terms.map((t) => {
			if (t.termIndex === termIndex) {
				return {
					...t,
					rows: t.rows.map((r) =>
						r.id === rowId ? { ...r, [field]: value } : r
					),
				};
			}
			return t;
		});
		setTerms(newTerms);
	};

	const setRetake = (termIndex, rowId, targetRowId) => {
		updateCourse(termIndex, rowId, "retakeOf", targetRowId);
	};

	const clearRetake = (rowId) => {
		// Find which term contains this row
		const term = terms.find((t) => t.rows.some((r) => r.id === rowId));
		if (term) {
			updateCourse(term.termIndex, rowId, "retakeOf", null);
		}
	};

	const clearAll = () => {
		localStorage.removeItem(STORAGE_KEY);
		setTransferEarned(0);
		setTransfers([]);
		setNextRowId(1);
		seedDefaultTerms();
	};

	// Calculate statistics
	const excludeMap = computeRetakeExclusionsMap(terms);
	const lastTermIndex = terms.length;
	const instStats = computeCumMetrics(terms, lastTermIndex, excludeMap);

	// Update transferEarned when transfers change
	useEffect(() => {
		const total = transfers.reduce(
			(sum, t) => sum + (parseFloat(t.credits) || 0),
			0
		);
		setTransferEarned(total);
	}, [transfers]);

	return (
		<div className="bg-gray-50 text-gray-900 min-h-screen antialiased">
			<Header clearAll={clearAll} />

			<main className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
				{/* Transfer Credits Section */}
				<TransferCredits transfers={transfers} setTransfers={setTransfers} />

				{/* Terms */}
				<section className="space-y-8">
					{terms.map((term) => (
						<TermCard
							key={term.termIndex}
							term={term}
							terms={terms}
							excludeMap={excludeMap}
							addCourse={addCourse}
							removeTerm={removeTerm}
							removeCourse={removeCourse}
							updateCourse={updateCourse}
							updateTermName={updateTermName}
							setRetake={setRetake}
							clearRetake={clearRetake}
							setIsAnyModalOpen={setIsAnyModalOpen} // Pass the setter down
						/>
					))}
				</section>

				{/* Transcript Statistics */}
				<TranscriptStats
					instStats={instStats}
					transferEarned={transferEarned}
					setTransferEarned={setTransferEarned}
				/>

				{/* Add Term Button */}
				<div className="sticky bottom-4 mt-10 flex justify-center">
					<button
						onClick={addTerm}
						className="p-3 rounded-2xl bg-green-600 hover:bg-green-700 text-white shadow-lg"
					>
						<svg
							className="w-6 h-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M12 4v16m8-8H4"
							></path>
						</svg>
					</button>
				</div>
			</main>
		</div>
	);
}

export default App;
