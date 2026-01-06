import { useState } from "react";

function TrainingModule({ onBack }) {
	const [activeTab, setActiveTab] = useState("overview");

	const modules = [
		{
			id: "overview",
			title: "Overview & Objectives",
			content: (
				<div className="space-y-4">
					<h3 className="text-xl font-bold text-indigo-900">
						Course Objective
					</h3>
					<p className="text-gray-700">
						By the end of this training, you will be able to:
					</p>
					<ul className="list-disc pl-5 space-y-2 text-gray-700">
						<li>Accurately input terms, courses, and transfer credits.</li>
						<li>
							Understand the grading scale, including specific handling of 'W' and
							'E' grades.
						</li>
						<li>
							Master the <strong>Retake Policy</strong> logic: how automatic and
							manual linking works.
						</li>
						<li>
							Interpret Cumulative vs. Term GPA calculations using the "Details"
							view.
						</li>
					</ul>
				</div>
			),
		},
		{
			id: "basics",
			title: "1. The Basics",
			content: (
				<div className="space-y-4">
					<h3 className="text-xl font-bold text-gray-800">
						Getting Started
					</h3>
					<p className="text-gray-700">
						The interface consists of <strong>Terms</strong> cards. Each term contains rows of <strong>Courses</strong>.
					</p>
					<div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
						<h4 className="font-semibold text-blue-800 mb-2">Key Actions:</h4>
						<ul className="list-disc pl-5 space-y-1 text-sm text-blue-700">
							<li><strong>Add Term:</strong> Click the floating green "+" button at the bottom.</li>
							<li><strong>Insert Term:</strong> Click the small "+" icon in a term header to insert a new term immediately after it.</li>
							<li><strong>Remove Term:</strong> Click the red trash icon in the term header to delete the entire term.</li>
							<li><strong>Add Course:</strong> Click the "+" button at the bottom of any term card.</li>
						</ul>
					</div>
					
					<div className="bg-green-50 p-4 rounded-lg border border-green-100 mt-4">
						<h4 className="font-semibold text-green-800 mb-2">Data Saving & Clearing</h4>
						<p className="text-sm text-green-700 mb-2">
							<strong>Auto-Save:</strong> All your input is automatically saved to your browser's local storage. You can close the tab and come back later; your data will still be there.
						</p>
						<p className="text-sm text-green-700">
							<strong>Clear All:</strong> The "Clear All" button at the top header completely resets the calculator. It wipes all terms, courses, and transfer credits, restoring the default empty state. Use this only when starting a completely new student record.
						</p>
					</div>

					<div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 mt-4">
						<h4 className="font-semibold text-yellow-800 mb-2">Default Grade</h4>
						<p className="text-sm text-yellow-700">
							Newly created courses default to <strong>"Select Grade"</strong> (empty). 
							You must select a valid letter grade for calculations to run.
						</p>
					</div>
				</div>
			),
		},
		{
			id: "grades",
			title: "2. Grading Scale",
			content: (
				<div className="space-y-4">
					<h3 className="text-xl font-bold text-gray-800">
						Special Grades
					</h3>
					<table className="min-w-full text-sm border border-gray-200">
						<thead className="bg-gray-100">
							<tr>
								<th className="p-2 text-left border-r">Grade</th>
								<th className="p-2 text-left border-r">Points</th>
								<th className="p-2 text-left">Impact</th>
							</tr>
						</thead>
						<tbody>
							<tr className="border-b">
								<td className="p-2 border-r font-bold">A - E</td>
								<td className="p-2 border-r">4.0 - 0.0</td>
								<td className="p-2">
									Standard calculation. <strong>E</strong> is a failing grade (0.0 points), equivalent to F.
								</td>
							</tr>
							<tr className="border-b">
								<td className="p-2 border-r font-bold">F</td>
								<td className="p-2 border-r">0.0</td>
								<td className="p-2">
									Failing grade. Counts in Attempted and GPA.
								</td>
							</tr>
							<tr className="border-b">
								<td className="p-2 border-r font-bold">UW</td>
								<td className="p-2 border-r">0.0</td>
								<td className="p-2">
									<strong>Unofficial Withdrawal.</strong> Treated exactly like an F (0.0 points). Counts in Attempted and GPA.
								</td>
							</tr>
							<tr className="border-b">
								<td className="p-2 border-r font-bold">W</td>
								<td className="p-2 border-r">N/A</td>
								<td className="p-2">
									Excluded from GPA and Earned Credits. Counts towards <strong>Attempted</strong> credits.
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			),
		},
		{
			id: "retakes",
			title: "3. Retake Logic",
			content: (
				<div className="space-y-4">
					<h3 className="text-xl font-bold text-gray-800">
						How Retakes Work
					</h3>
					<p className="text-gray-700">
						The system prioritizes the <strong>Best Grade</strong> for GPA calculations. Lower grades for the same course are excluded from the Cumulative GPA (marked with orange <code>**</code>).
					</p>
					
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="border p-4 rounded-lg">
							<h4 className="font-bold text-indigo-600 mb-2">Automatic Linking</h4>
							<p className="text-sm text-gray-600">
								Courses with the <strong>exact same name</strong> (case-insensitive) are automatically linked.
							</p>
							<p className="text-xs text-gray-500 mt-2">Example: "Math 101" and "MATH 101" are treated as the same course.</p>
						</div>
						<div className="border p-4 rounded-lg">
							<h4 className="font-bold text-indigo-600 mb-2">Manual Linking</h4>
							<p className="text-sm text-gray-600 mb-2">
								Use this when course names differ (e.g., "Math 101" vs "Math 200").
							</p>
							<ol className="list-decimal pl-5 space-y-1 text-sm text-gray-600">
								<li>Click the <strong>menu icon (three dots)</strong> on the retake course row.</li>
								<li>Select <strong>"Retake Of..."</strong> from the menu.</li>
								<li>A second menu appears: Select the <strong>Term</strong> where the original course exists.</li>
								<li>Select the <strong>Original Course</strong> from that term's list.</li>
							</ol>
						</div>
					</div>

					<div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-2">
						<h4 className="font-semibold text-gray-800 mb-1">Clearing a Retake Link</h4>
						<p className="text-sm text-gray-700">
							To remove a manual link: Click the menu icon on the course again and select <strong>"Clear Retake Link"</strong>. The course will revert to being treated independently (unless it matches another course by name).
						</p>
					</div>

					<div className="bg-orange-50 p-3 rounded text-sm text-orange-800 border border-orange-200">
						<strong>Note on W:</strong> Retake logic also visually links courses with 'W' grades, showing the <code>**</code> indicator, but 'W' never replaces a valid grade.
					</div>
				</div>
			),
		},
		{
			id: "assessment",
			title: "Knowledge Check",
			content: (
				<div className="space-y-6">
					<h3 className="text-xl font-bold text-gray-800">
						Test Your Knowledge
					</h3>
					<Quiz />
				</div>
			),
		},
	];

	return (
		<div className="max-w-4xl mx-auto px-4 py-8">
			{/* Header Navigation */}
			<div className="mb-6">
				<button
					onClick={onBack}
					className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
				>
					<svg
						className="w-5 h-5 mr-1"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M10 19l-7-7m0 0l7-7m-7 7h18"
						/>
					</svg>
					Back to Calculator
				</button>
			</div>

			<div className="bg-white rounded-2xl shadow-xl overflow-hidden ring-1 ring-gray-200">
				{/* Header */}
				<div className="bg-indigo-700 px-8 py-8 text-white">
					<h2 className="text-3xl font-black mb-2">System Training Module</h2>
					<p className="text-indigo-100">
						Comprehensive guide to the GPA Calculator System v2.0
					</p>
				</div>

				<div className="flex flex-col md:flex-row h-[600px]">
					{/* Sidebar Navigation */}
					<nav className="w-full md:w-64 bg-gray-50 border-r border-gray-200 p-4 shrink-0">
						<ul className="space-y-1">
							{modules.map((m) => (
								<li key={m.id}>
									<button
										onClick={() => setActiveTab(m.id)}
										className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
											activeTab === m.id
												? "bg-white text-indigo-700 shadow-sm ring-1 ring-gray-200"
												: "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
										}`}
									>
										{m.title}
									</button>
								</li>
							))}
						</ul>
					</nav>

					{/* Content Area - Scrollable */}
					<div className="flex-1 p-8 overflow-y-auto">
						{modules.find((m) => m.id === activeTab)?.content}
					</div>
				</div>
			</div>
		</div>
	);
}

function Quiz() {
	const [answers, setAnswers] = useState({});
	const [showResults, setShowResults] = useState(false);

	const questions = [
		{
			id: 1,
			q: "How does an 'E' grade affect the GPA?",
			options: [
				"It is ignored (like W)",
				"It counts as 0.0 (like F)",
				"It counts as 1.0 (like D)",
			],
			correct: 1,
		},
		{
			id: 2,
			q: "A course with a 'W' grade counts towards:",
			options: [
				"Earned Credits",
				"GPA Calculation",
				"Attempted Credits",
				"None of the above",
			],
			correct: 2,
		},
		{
			id: 3,
			q: "If you have 'Math 101' (D) and 'Math 101' (B), which one counts in Cumulative GPA?",
			options: [
				"Both are averaged",
				"Only the D (first attempt)",
				"Only the B (best attempt)",
			],
			correct: 2,
		},
		{
			id: 4,
			q: "What happens to your data if you close the browser tab?",
			options: [
				"It is lost immediately.",
				"It is saved automatically in your browser.",
				"You must click 'Save' first.",
			],
			correct: 1,
		},
		{
			id: 5,
			q: "What does 'UW' stand for and how is it calculated?",
			options: [
				"Unofficial Withdrawal; calculated as 0.0 (F).",
				"University Waiver; excluded from GPA.",
				"Under Review; excluded until grade posted.",
			],
			correct: 0,
		},
	];

	const handleOptionChange = (qId, optionIdx) => {
		setAnswers({ ...answers, [qId]: optionIdx });
		setShowResults(false);
	};

	const checkAnswers = () => {
		setShowResults(true);
	};

	const getScore = () => {
		let score = 0;
		questions.forEach((q) => {
			if (answers[q.id] === q.correct) score++;
		});
		return score;
	};

	return (
		<div className="space-y-6">
			{questions.map((q, idx) => (
				<div key={q.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
					<p className="font-semibold text-gray-800 mb-3">
						{idx + 1}. {q.q}
					</p>
					<div className="space-y-2">
						{q.options.map((opt, optIdx) => (
							<label
								key={optIdx}
								className={`flex items-center space-x-3 p-2 rounded cursor-pointer transition-colors ${
									showResults && optIdx === q.correct
										? "bg-green-100 ring-1 ring-green-300"
										: showResults &&
										  answers[q.id] === optIdx &&
										  optIdx !== q.correct
										? "bg-red-50 ring-1 ring-red-200"
										: "hover:bg-gray-100"
								}`}
							>
								<input
									type="radio"
									name={`question-${q.id}`}
									checked={answers[q.id] === optIdx}
									onChange={() => handleOptionChange(q.id, optIdx)}
									className="text-indigo-600 focus:ring-indigo-500"
								/>
								<span className="text-gray-700 text-sm">{opt}</span>
							</label>
						))}
					</div>
				</div>
			))}

			<div className="flex items-center justify-between pt-4 border-t border-gray-100">
				<button
					onClick={checkAnswers}
					disabled={Object.keys(answers).length < questions.length}
					className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					Submit Assessment
				</button>
				{showResults && (
					<div className="text-lg font-bold">
						Score: <span className={getScore() === questions.length ? "text-green-600" : "text-indigo-600"}>
							{getScore()} / {questions.length}
						</span>
					</div>
				)}
			</div>
		</div>
	);
}

export default TrainingModule;
