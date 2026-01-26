import { useState, useEffect, useRef } from "react";
import Joyride, { STATUS, EVENTS } from "react-joyride";
import Header from "./components/Header";
import TermCard from "./components/TermCard";
import TranscriptStats from "./components/TranscriptStats";
import TransferCredits from "./components/TransferCredits";
import TrainingModule from "./components/TrainingModule";
import EquivalencesModal from "./components/EquivalencesModal";
import ImportModal from "./components/ImportModal";
import SessionManager from "./components/SessionManager";
import {
	getSessionIndex,
	saveSessionIndex,
	loadSessionData,
	saveSessionData,
	createNewSession,
	deleteSession,
	renameSession,
	migrateLegacyData,
} from "./utils/sessionManager";
import {
	SCALE,
	fmt,
	computeCumMetrics,
	computeRetakeExclusionsMap,
} from "./utils/calculations";
import { debugError } from "./utils/debug";
import systemEquivalences from "./data/equivalences.json";

const STORAGE_KEY = "gpa_state_v3";
const EXPERIMENTAL_KEY = "gpa_experimental_v1";

function App() {
	// Experimental Mode State (Persisted)
	const [isExperimental, setIsExperimental] = useState(() => {
		return localStorage.getItem(EXPERIMENTAL_KEY) === "true";
	});

	const toggleExperimental = () => {
		const newState = !isExperimental;
		setIsExperimental(newState);
		localStorage.setItem(EXPERIMENTAL_KEY, String(newState));
		
		// If turning off experimental, expand all terms
		if (!newState) {
			const newTerms = terms.map(t => ({ ...t, isMinimized: false }));
			setTerms(newTerms);
		}
	};

	const [transferEarned, setTransferEarned] = useState(0);
	const [transfers, setTransfers] = useState([]);
	const [terms, setTerms] = useState([]);
	const [nextRowId, setNextRowId] = useState(1);
	const [lastAddedRowId, setLastAddedRowId] = useState(null); // Track for auto-focus
		const [isAnyModalOpen, setIsAnyModalOpen] = useState(false); // New state for modal control
			const [currentView, setCurrentView] = useState("calculator"); // 'calculator' | 'training'
			const [runTour, setRunTour] = useState(false);
				const [stepIndex, setStepIndex] = useState(0);
				const [equivalences, setEquivalences] = useState([]);
				const [showEquivalences, setShowEquivalences] = useState(false);
				
				// Session Management State
				const [sessions, setSessions] = useState([]);
					const [activeSessionId, setActiveSessionId] = useState(null);
				
						const [isSessionManagerOpen, setIsSessionManagerOpen] = useState(false);
	const [isImportModalOpen, setIsImportModalOpen] = useState(false);

	// Import Handler
	const handleImportData = (parsedData) => {
		setTerms(parsedData.terms);
		setNextRowId(parsedData.nextRowId);
		// Reset other state? Maybe keep transfers if they exist or prompt user?
		// For now, let's keep transfers as they are usually separate.
		// If the CSV includes transfer terms, we might want to extract them separately?
		// The parser puts them in `terms`. The user can manually move them if needed, or we improve parser later.
		setIsSessionManagerOpen(false); // Close menu on successful import
	};
				
					
				
						// Refs to track previous counts for tour logic
				
						const prevTransfersLength = useRef(0);
				
						const prevTermsLength = useRef(0);
				
						const prevFirstTermRowsLength = useRef(0);
				
						
				
						const tourSteps = [		{
			target: "body",
			content: (
				<div>
					<h3 className="font-bold text-lg mb-2">Welcome to the Interactive Tour!</h3>
					<p>
						We'll guide you through the app. Follow the instructions to proceed.
					</p>
				</div>
			),
			placement: "center",
			disableBeacon: true,
		},
		{
			target: "#transferCredits",
			content: "Step 1: Click 'Add Transfer' to add a transfer credit record.",
			spotlightClicks: true,
			hideFooter: true,
			disableOverlayClose: true,
		},
		{
			target: ".tour-insert-term-btn",
			content: "Step 2: Great! Now, try inserting a new term. Click this '+' icon.",
			spotlightClicks: true,
			hideFooter: true,
			disableOverlayClose: true,
		},
		{
			target: ".tour-add-course-btn",
			content: "Step 3: Now, add a course to the first term. Click the '+' button at the bottom of Term 1.",
			spotlightClicks: true,
			hideFooter: true,
			disableOverlayClose: true,
		},
		{
			target: ".tour-course-row",
			content: (
				<div>
					<p>Step 4: Enter Course Details.</p>
					<ul className="list-disc pl-4 text-sm mt-2">
						<li>Name: <strong>Math 101</strong></li>
						<li>Units: <strong>3</strong></li>
						<li>Grade: <strong>C</strong></li>
					</ul>
				</div>
			),
			spotlightClicks: true,
			hideFooter: true,
			disableOverlayClose: true,
		},
		{
			target: ".btn-add-term",
			content: "Step 5: Let's add another term at the very end. Click this big green '+' button.",
			spotlightClicks: true,
			hideFooter: true,
			disableOverlayClose: true,
		},
		{
			target: ".term:last-child .tour-add-course-btn",
			content: (
				<div>
					<p>Step 6: In this new term, add the <strong>same course</strong> to see the retake logic.</p>
					<p className="text-sm mt-1">Add a course, then enter:</p>
					<ul className="list-disc pl-4 text-sm mt-1">
						<li>Name: <strong>Math 101</strong></li>
						<li>Units: <strong>3</strong></li>
						<li>Grade: <strong>A</strong></li>
					</ul>
				</div>
			),
			spotlightClicks: true,
			hideFooter: true,
			disableOverlayClose: true,
		},
		{
			target: ".tour-course-row",
			content: (
				<div>
					<p className="font-bold text-green-600">Retake Detected!</p>
					<p>Notice the orange <strong>**</strong> on the first 'Math 101'.</p>
					<p className="text-sm">Since you got an 'A' later, the earlier 'C' is excluded from your Cumulative GPA.</p>
				</div>
			),
		},
		{
			target: ".tour-cum-gpa-info-btn",
			content: "Step 7: Click this 'i' icon to view the detailed GPA calculation breakdown.",
			spotlightClicks: true,
			hideFooter: true,
			disableOverlayClose: true,
		},
		{
			target: ".tour-calc-modal",
			content: "Here you can see exactly which courses are included or excluded. You're all set!",
			placement: "center",
		},
	];

	const handleJoyrideCallback = (data) => {
		const { status, type, index, action } = data;
		if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
			setRunTour(false);
			setStepIndex(0);
		} else if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
			// Update index state to keep in sync if controlled updates happen via UI
			setStepIndex(index + (action === 'prev' ? -1 : 1));
		}
	};

	// --- Tour Automation Logic ---

	// Step 1: Advance when transfer added
	useEffect(() => {
		if (runTour && stepIndex === 1 && transfers.length > prevTransfersLength.current) {
			setStepIndex(2);
		}
		prevTransfersLength.current = transfers.length;
	}, [transfers, runTour, stepIndex]);

	// Step 2 & 5: Advance when term added (insert or append)
	useEffect(() => {
		if (runTour && terms.length > prevTermsLength.current) {
			if (stepIndex === 2) setStepIndex(3);
			if (stepIndex === 5) setStepIndex(6);
		}
		prevTermsLength.current = terms.length;
	}, [terms, runTour, stepIndex]);

	// Step 3: Advance when course added to Term 1
	useEffect(() => {
		const t1Rows = terms[0]?.rows?.length || 0;
		if (runTour && stepIndex === 3 && t1Rows > prevFirstTermRowsLength.current) {
			setStepIndex(4);
		}
		prevFirstTermRowsLength.current = t1Rows;
	}, [terms, runTour, stepIndex]);

	// Step 4: Advance when Math 101 / C is entered in Term 1
	useEffect(() => {
		if (runTour && stepIndex === 4 && terms[0]) {
			const rows = terms[0].rows;
			const validRow = rows.find(r => 
				r.name?.toUpperCase() === "MATH 101" && 
				r.grade === "C"
			);
			if (validRow) setStepIndex(5);
		}
	}, [terms, runTour, stepIndex]);

	// Step 6: Advance when Math 101 / A is entered in LAST term
	useEffect(() => {
		if (runTour && stepIndex === 6 && terms.length > 0) {
			const lastTerm = terms[terms.length - 1];
			const validRow = lastTerm.rows.find(r => 
				r.name?.toUpperCase() === "MATH 101" && 
				r.grade === "A"
			);
			if (validRow) setStepIndex(7);
		}
	}, [terms, runTour, stepIndex]);

	// Step 8: Advance when Modal Opens
	useEffect(() => {
		if (runTour && stepIndex === 8 && isAnyModalOpen) {
			setStepIndex(9);
		}
	}, [isAnyModalOpen, runTour, stepIndex]);

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

	// Initialize Sessions on mount
	useEffect(() => {
		let index = getSessionIndex();
		
		// Migration Check
		if (index.length === 0) {
			const migratedId = migrateLegacyData(STORAGE_KEY);
			if (migratedId) {
				index = getSessionIndex(); // Reload after migration
			} else {
				// No legacy data, create fresh default
				createNewSession("Untitled Transcript");
				index = getSessionIndex();
			}
		}

		setSessions(index);
		
		// Load the most recent or first session
		if (index.length > 0) {
			// Sort by lastModified desc if possible, or just pick first
			// The index array structure is simple, usually append-only, but we updated lastModified on rename/create
			// Let's just pick the first one for simplicity or the one last used if we tracked it (we don't yet)
			const sessionToLoad = index[0];
			setActiveSessionId(sessionToLoad.id);
			
			const data = loadSessionData(sessionToLoad.id);
			if (data) {
				restoreState(data);
			} else {
				seedDefaultTerms(); // Fallback
			}
		}
	}, []);

	const restoreState = (data) => {
		setNextRowId(data.nextRowId || 1);
		setTransferEarned(data.transferEarned || 0);
		setTransfers(data.transfers || []);
		// Ensure isHighlighted is preserved or defaulted
		const restoredTerms = (data.terms || []).map(t => ({
			...t,
			isHighlighted: t.isHighlighted || false
		}));
		setTerms(restoredTerms);
		setEquivalences(data.equivalences || []);
	};

	// Save to active session whenever state changes
	useEffect(() => {
		if (activeSessionId && terms.length > 0) {
			const state = {
				nextRowId,
				transferEarned,
				transfers,
				terms,
				equivalences,
			};
			saveSessionData(activeSessionId, state);
		}
	}, [activeSessionId, nextRowId, transferEarned, transfers, terms, equivalences]);

	// Session Handlers
	const loadSession = (sessionId) => {
		const data = loadSessionData(sessionId);
		if (data) {
			setActiveSessionId(sessionId);
			restoreState(data);
			return true;
		}
		return false;
	};

	const handleSwitchSession = (sessionId) => {
		if (loadSession(sessionId)) {
			// setIsSessionManagerOpen(false); // Kept open per user request
		}
	};

	const handleCreateSession = () => {
		const newSession = createNewSession(`Transcript ${sessions.length + 1}`);
		setSessions(getSessionIndex());
		setActiveSessionId(newSession.id);
		
		// Reset State for new session
		setTransferEarned(0);
		setTransfers([]);
		setEquivalences([]);
		setNextRowId(1);
		seedDefaultTerms(1); // This sets 'terms' state directly
		// setIsSessionManagerOpen(false); // Kept open per user request
	};

	const handleRenameSession = (id, newName) => {
		const updatedIndex = renameSession(id, newName);
		setSessions(updatedIndex);
	};

	const handleDeleteSession = (id) => {
		const updatedIndex = deleteSession(id);
		setSessions(updatedIndex);
		// If deleted active session, switch to another or create new
		if (id === activeSessionId) {
			if (updatedIndex.length > 0) {
				loadSession(updatedIndex[0].id);
			} else {
				handleCreateSession(); // Create fresh if all deleted
			}
		}
	};

	const seedDefaultTerms = (startId = 1) => {
		const defaultTerms = [];
		for (let i = 1; i <= 3; i++) {
			defaultTerms.push({
				termIndex: i,
				name: `Term ${i}`,
				isHighlighted: false,
				rows: [
					{
						id: String(startId + i - 1),
						name: "",
						units: 0,
						grade: "", // Changed from "W" to ""
						retakeOf: null,
					},
				],
			});
		}
		setTerms(defaultTerms);
		setNextRowId(startId + 3);
	};

	const addTerm = () => {
		const newTerm = {
			termIndex: terms.length + 1,
			name: `Term ${terms.length + 1}`,
			isHighlighted: false,
			rows: [
				{
					id: String(nextRowId),
					name: "",
					units: 0,
					grade: "", // Changed from "W" to ""
					retakeOf: null,
				},
			],
		};
		setTerms([...terms, newTerm]);
		setNextRowId(nextRowId + 1);
	};

	const insertTermAfter = (afterTermIndex) => {
		const newTerm = {
			// Initially placeholder, will be re-indexed
			termIndex: 0,
			name: `Term`, 
			isHighlighted: false,
			rows: [
				{
					id: String(nextRowId),
					name: "",
					units: 0,
					grade: "", // Changed from "W" to ""
					retakeOf: null,
				},
			],
		};
		
		const newTerms = [...terms];
		// Insert after the given index
		// termIndex is 1-based, array index is termIndex-1.
		// Splice at (index) inserts before. We want to insert after termIndex.
		// So splice at termIndex.
		newTerms.splice(afterTermIndex, 0, newTerm);
		
		// Re-index everything
		const reindexedTerms = newTerms.map((t, i) => ({
			...t,
			termIndex: i + 1,
			name: t.name === "Term" ? `Term ${i + 1}` : t.name,
		}));

		setTerms(reindexedTerms);
		setNextRowId(nextRowId + 1);
	};

	const toggleTermHighlight = (termIndex) => {
		const newTerms = terms.map((t) =>
			t.termIndex === termIndex ? { ...t, isHighlighted: !t.isHighlighted } : t
		);
		setTerms(newTerms);
	};

	const toggleTermMinimize = (termIndex) => {
		const newTerms = terms.map((t) =>
			t.termIndex === termIndex ? { ...t, isMinimized: !t.isMinimized } : t
		);
		setTerms(newTerms);
	};

	const removeTerm = (termIndex) => {
		// Identify the term to remove and its row IDs
		const termToRemove = terms.find(t => t.termIndex === termIndex);
		const removedRowIds = new Set(termToRemove ? termToRemove.rows.map(r => r.id) : []);

		const newTerms = terms
			.filter((t) => t.termIndex !== termIndex)
			.map((t, i) => ({
				...t,
				termIndex: i + 1,
				name: t.name || `Term ${i + 1}`,
				rows: t.rows.map(r => {
					// Clean up retake references to deleted rows
					if (r.retakeOf && removedRowIds.has(r.retakeOf)) {
						return { ...r, retakeOf: null };
					}
					return r;
				})
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
		const newId = String(nextRowId);
		const newTerms = terms.map((t) => {
			if (t.termIndex === termIndex) {
				return {
					...t,
					rows: [
						...t.rows,
						{
							id: newId,
							name: "",
							units: 0,
							grade: "", // Changed from "W" to ""
							retakeOf: null,
						},
					],
				};
			}
			return t;
		});
		setTerms(newTerms);
		setNextRowId(nextRowId + 1);
		setLastAddedRowId(newId);
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
									grade: "", // Changed from "W" to ""
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
		// If we are manually setting a retake, we assume the user WANTS it linked,
		// so we should clear the 'unlink' flag if it was set.
		updateCourse(termIndex, rowId, "isManuallyUnlinked", false);
	};

	const clearRetake = (rowId) => {
		// Find which term contains this row
		const term = terms.find((t) => t.rows.some((r) => r.id === rowId));
		if (term) {
			updateCourse(term.termIndex, rowId, "retakeOf", null);
			// Also explicitly unlink from auto-detection
			updateCourse(term.termIndex, rowId, "isManuallyUnlinked", true);
		}
	};

	const clearAll = () => {
		localStorage.removeItem(STORAGE_KEY);
		setTransferEarned(0);
		setTransfers([]);
		setNextRowId(1);
		setEquivalences([]);
		seedDefaultTerms(1);
	};

	// Calculate statistics
	const excludeMap = computeRetakeExclusionsMap(terms, equivalences, isExperimental ? systemEquivalences : {}, isExperimental);
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

	if (currentView === "training") {
		return <TrainingModule onBack={() => setCurrentView("calculator")} />;
	}

	return (
		<div className="bg-gray-50 text-gray-900 h-screen antialiased flex flex-col overflow-hidden relative">
			<Joyride
				steps={tourSteps}
				run={runTour}
				stepIndex={stepIndex} // Controlled step index
				continuous
				showSkipButton
				showProgress
				disableOverlayClose={true}
				spotlightClicks={true}
				callback={handleJoyrideCallback}
				styles={{
					options: {
						primaryColor: "#4f46e5", // Indigo-600
						zIndex: 1000,
					},
				}}
			/>
			{showEquivalences && (
				<EquivalencesModal
					equivalences={equivalences}
					setEquivalences={setEquivalences}
					systemEquivalences={isExperimental ? systemEquivalences : {}}
					isExperimental={isExperimental}
					onClose={() => setShowEquivalences(false)}
				/>
			)}
			{isImportModalOpen && (
				<ImportModal 
					onClose={() => setIsImportModalOpen(false)} 
					onImport={handleImportData} 
				/>
			)}

			<SessionManager
				isOpen={isSessionManagerOpen}
				onClose={() => setIsSessionManagerOpen(false)}
				sessions={sessions}
				activeSessionId={activeSessionId}
				onSwitchSession={handleSwitchSession}
				onCreateSession={handleCreateSession}
				onRenameSession={handleRenameSession}
				onDeleteSession={handleDeleteSession}
				onOpenImport={() => setIsImportModalOpen(true)}
				showImport={isExperimental}
			/>

			{/* Floating Toggle Button */}
			<button
				onClick={(e) => {
					e.stopPropagation();
					setIsSessionManagerOpen(!isSessionManagerOpen);
				}}
				className="js-library-toggle fixed left-6 bottom-6 z-40 p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-transform hover:scale-110 flex items-center gap-2 group"
				title="Open Transcript Library"
			>
				<svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
				</svg>
				<span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap text-sm font-semibold">
					{sessions.find(s => s.id === activeSessionId)?.name || "Library"}
				</span>
			</button>

			<main className="flex-1 overflow-y-auto px-4 sm:px-8 pt-6 pb-24 scroll-smooth">
				<div className="max-w-5xl mx-auto">
					{isExperimental && (
						<div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
							<svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
							</svg>
							<div className="text-sm text-amber-800">
								<strong className="font-bold block text-amber-900 mb-1">Experimental Features Active</strong>
								<p className="leading-relaxed">
									New features (like CSV Import) are currently being tested for 100% accuracy. Please <strong>carefully review each term and course</strong> after using them.
								</p>
								<p className="mt-2 text-amber-700">
									Share feedback and issues with your team leaders to help refine the system. If you are not comfortable with potential inaccuracies, please toggle <strong>Experimental Mode off</strong> in the header.
								</p>
								
								{/* System Equivalences List */}
								{Object.keys(systemEquivalences).length > 0 && (
									<div className="mt-4 pt-3 border-t border-amber-200/60">
										<p className="text-xs font-bold text-amber-900 uppercase tracking-wide mb-2">
											Preconfigured Equivalencies Active:
										</p>
										<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-amber-800 font-mono">
											{Object.entries(systemEquivalences).map(([main, equivs]) => (
												<div key={main}>
													<span className="font-semibold">{main}</span> 
													<span className="text-amber-600"> ↔ </span> 
													<span className="opacity-80">[{equivs.join(", ")}]</span>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						</div>
					)}

					<Header 
						clearAll={clearAll} 
						onNavigateTraining={() => setCurrentView("training")}
						onStartTour={() => { setRunTour(true); setStepIndex(0); }}
						onOpenEquivalences={() => setShowEquivalences(true)}
						isExperimental={isExperimental}
						onToggleExperimental={toggleExperimental}
					/>
					
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
								insertTermAfter={insertTermAfter} // Pass insert function
								toggleTermHighlight={toggleTermHighlight} // Pass highlight toggle
								toggleTermMinimize={toggleTermMinimize} // Pass minimize toggle
								lastAddedRowId={lastAddedRowId}
								isExperimental={isExperimental} // Pass experimental flag
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
					<div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-30">
						<button
							onClick={addTerm}
							className="p-3 rounded-2xl bg-green-600 hover:bg-green-700 text-white shadow-lg transition-transform hover:scale-105"
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
				</div>
			</main>
		</div>
	);
}

export default App;
