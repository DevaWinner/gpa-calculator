import { useState } from "react";

function TrainingModule({ onBack }) {
	const [activeTab, setActiveTab] = useState("overview");

	const modules = [
		{
			id: "overview",
			title: "Overview & Objectives",
			content: (
				<div className="space-y-6">
					<div>
						<h3 className="text-2xl font-bold text-indigo-900 mb-2">
							Course Objective
						</h3>
						<p className="text-gray-700 leading-relaxed">
							Welcome to the GPA Calculator Training Module. This tool is designed to help students and advisors simulate and understand complex GPA scenarios, including retakes, transfer credits, and term-by-term performance analysis.
						</p>
					</div>

					<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
						<h4 className="font-semibold text-gray-800 mb-4 text-lg">Key Learning Outcomes</h4>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="flex items-start">
								<div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold mr-3">1</div>
								<p className="text-gray-600 text-sm">Master accurate data entry for terms, courses, and external transfer credits.</p>
							</div>
							<div className="flex items-start">
								<div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold mr-3">2</div>
								<p className="text-gray-600 text-sm">Understand the specific grading scale and the impact of special grades like 'W', 'UW', and 'E'.</p>
							</div>
							<div className="flex items-start">
								<div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold mr-3">3</div>
								<p className="text-gray-600 text-sm">Navigate the complex "Retake Policy" logic, including automatic name matching and manual overrides.</p>
							</div>
							<div className="flex items-start">
								<div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold mr-3">4</div>
								<p className="text-gray-600 text-sm">Analyze "what-if" scenarios to see how future grades could repair a cumulative GPA.</p>
							</div>
						</div>
					</div>
				</div>
			),
		},
		{
			id: "basics",
			title: "1. The Basics",
			content: (
				<div className="space-y-8">
					<div>
						<h3 className="text-2xl font-bold text-gray-800 mb-3">
							Getting Started
						</h3>
						<p className="text-gray-700 leading-relaxed">
							The interface is built around the concept of <strong>Terms</strong>. A transcript is a chronological sequence of terms, each containing multiple <strong>Courses</strong>.
						</p>
					</div>

					<div className="grid grid-cols-1 gap-6">
						<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
							<h4 className="font-bold text-indigo-700 mb-4 flex items-center">
								<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
								Managing Terms
							</h4>
							<ul className="space-y-3 text-sm text-gray-600">
								<li className="flex items-start">
									<span className="font-bold text-gray-800 w-24 flex-shrink-0">Add Term:</span>
									<span>Use the large floating <span className="text-green-600 font-bold text-lg leading-none align-middle">+</span> button at the bottom of the page to append a new term to the end of your transcript.</span>
								</li>
								<li className="flex items-start">
									<span className="font-bold text-gray-800 w-24 flex-shrink-0">Insert Term:</span>
									<span>Hover over a term header and click the small <span className="text-green-600 font-bold">+</span> icon to insert a term <em>immediately after</em> the current one. This is useful for adding missed semesters.</span>
								</li>
								<li className="flex items-start">
									<span className="font-bold text-gray-800 w-24 flex-shrink-0">Delete Term:</span>
									<span>Click the red trash icon <svg className="w-4 h-4 inline text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> to remove a term and all its courses.</span>
								</li>
								<li className="flex items-start">
									<span className="font-bold text-gray-800 w-24 flex-shrink-0">Highlight:</span>
									<span>Click the star/highlight icon <svg className="w-4 h-4 inline text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg> to flag a term with a yellow background. Use this to mark terms with concerns or those that need to be revisited.</span>
								</li>
							</ul>
						</div>

						<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
							<h4 className="font-bold text-indigo-700 mb-4 flex items-center">
								<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
								Course Management
							</h4>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<h5 className="font-semibold text-gray-800 mb-2 text-sm">Adding Courses</h5>
									<p className="text-sm text-gray-600 mb-2">Click the "+" button inside any term card to add a row.</p>
									<div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
										<p className="text-xs text-yellow-800">
											<strong>Important:</strong> New courses default to an empty grade. An empty grade acts like a 'W'—it is <strong>excluded</strong> from GPA calculations until you select a letter grade.
										</p>
									</div>
								</div>
								<div>
									<h5 className="font-semibold text-gray-800 mb-2 text-sm">Duplicate Detection</h5>
									<p className="text-sm text-gray-600 mb-2">The system monitors for errors in real-time.</p>
									<div className="bg-red-50 p-3 rounded-lg border border-red-100">
										<p className="text-xs text-red-800">
											<strong>Warning:</strong> Entering the same course name twice in one term triggers a red alert. Duplicates do <strong>not</strong> trigger retake logic; you must fix the duplication first.
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className="bg-indigo-900 text-indigo-100 p-4 rounded-lg flex items-center justify-between">
						<div>
							<span className="font-bold text-white block">Auto-Save Enabled</span>
							<span className="text-sm opacity-80">Your work is saved locally to your browser instantly.</span>
						</div>
						<div className="text-2xl opacity-50">
							<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
						</div>
					</div>
				</div>
			),
		},
		{
			id: "transcript-library",
			title: "2. Transcript Library",
			content: (
				<div className="space-y-8">
					<div>
						<h3 className="text-2xl font-bold text-gray-800 mb-3">
							Managing Multiple Transcripts
						</h3>
						<p className="text-gray-700 leading-relaxed">
							The <strong>Transcript Library</strong> is your hub for creating and managing multiple student records. It is accessible via the floating button at the bottom-left of your screen.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
							<h4 className="font-bold text-indigo-700 mb-4 flex items-center">
								<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
								Library Features
							</h4>
							<ul className="space-y-4 text-sm text-gray-600">
								<li className="flex items-start gap-2">
									<div className="p-1 bg-indigo-100 rounded text-indigo-700 shrink-0 mt-0.5">
										<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
									</div>
									<div>
										<strong className="block text-gray-800">Access:</strong>
										<span>Click the <strong>Library</strong> button (with the current transcript name) in the bottom-left corner to open the floating menu.</span>
									</div>
								</li>
								<li className="flex items-start gap-2">
									<div className="p-1 bg-green-100 rounded text-green-700 shrink-0 mt-0.5">
										<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
									</div>
									<div>
										<strong className="block text-gray-800">Create New:</strong>
										<span>Click the "New Transcript" button inside the library to start a fresh record. The menu stays open so you can rename it immediately.</span>
									</div>
								</li>
								<li className="flex items-start gap-2">
									<div className="p-1 bg-indigo-100 rounded text-indigo-700 shrink-0 mt-0.5">
										<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
									</div>
									<div>
										<strong className="block text-gray-800">Switching:</strong>
										<span>Click any transcript in the list to load it. The menu remains open to allow quick switching between records.</span>
									</div>
								</li>
							</ul>
						</div>

						<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
							<h4 className="font-bold text-indigo-700 mb-4 flex items-center">
								<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
								Editing & Deleting
							</h4>
							<div className="space-y-4">
								<p className="text-sm text-gray-600">The library allows for quick management without leaving your workflow:</p>
								<div className="flex gap-4">
									<div className="flex-1 bg-gray-50 p-3 rounded border border-gray-200">
										<div className="flex items-center gap-2 mb-1">
											<svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
											<strong className="text-xs font-bold text-gray-700 uppercase">Rename</strong>
										</div>
										<p className="text-xs text-gray-500">Click the pencil icon on any item. Type the new name and press Enter.</p>
									</div>
									<div className="flex-1 bg-red-50 p-3 rounded border border-red-100">
										<div className="flex items-center gap-2 mb-1">
											<svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
											<strong className="text-xs font-bold text-red-700 uppercase">Delete</strong>
										</div>
										<p className="text-xs text-red-600">Click the trash icon to instantly remove a transcript. No confirmation is required.</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			),
		},
		{
			id: "transfers",
			title: "3. Transfer Credits",
			content: (
				<div className="space-y-6">
					<div>
						<h3 className="text-2xl font-bold text-gray-800 mb-3">
							Transfer Credits
						</h3>
						<p className="text-gray-700 leading-relaxed">
							Coursework completed at other institutions is handled separately from your institutional GPA. These credits contribute to your degree progress ("Earned Credits") but usually do not affect your GPA calculation.
						</p>
					</div>
					
					<div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Impact</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Explanation</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								<tr>
									<td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">Total Earned Credits</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold">YES</td>
									<td className="px-6 py-4 text-sm text-gray-600">Added directly to your total credit count for graduation.</td>
								</tr>
								<tr>
									<td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">Institutional GPA</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-red-500 font-bold">NO</td>
									<td className="px-6 py-4 text-sm text-gray-600">Grades from other schools do not change your local GPA.</td>
								</tr>
								<tr>
									<td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">Attempted Credits</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-red-500 font-bold">NO</td>
									<td className="px-6 py-4 text-sm text-gray-600">They are not counted as local attempts.</td>
								</tr>
							</tbody>
						</table>
					</div>

					<div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
						<h4 className="font-bold text-gray-800 mb-2">Workflow</h4>
						<ol className="list-decimal pl-5 space-y-2 text-sm text-gray-600">
							<li>Locate the <strong>Transfer Credits</strong> section at the very top of the calculator.</li>
							<li>Click <strong>"Add Transfer"</strong> to create a record (e.g., "State College", 12.0 credits).</li>
							<li>These totals will appear in the "Transcript Statistics" summary at the bottom of the page.</li>
						</ol>
					</div>
				</div>
			),
		},
		{
			id: "grades",
			title: "4. Grading Scale",
			content: (
				<div className="space-y-6">
					<div>
						<h3 className="text-2xl font-bold text-gray-800 mb-3">
							Institutional Grading Scale
						</h3>
						<p className="text-gray-700 leading-relaxed">
							The system uses a standard 4.0 scale. Understanding the point value of each letter grade is crucial for manual verification.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
						<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
							<div className="bg-indigo-50 px-6 py-3 border-b border-indigo-100">
								<h4 className="font-bold text-indigo-900 text-sm uppercase tracking-wide">Standard Grades</h4>
							</div>
							<table className="min-w-full text-sm">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-6 py-3 text-left font-medium text-gray-500">One Credit of</th>
										<th className="px-6 py-3 text-right font-medium text-gray-500">Equals Grade Points</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-100">
									{[
										{ g: "A", p: "4.0" }, { g: "A-", p: "3.7" },
										{ g: "B+", p: "3.4" }, { g: "B", p: "3.0" }, { g: "B-", p: "2.7" },
										{ g: "C+", p: "2.4" }, { g: "C", p: "2.0" }, { g: "C-", p: "1.7" },
										{ g: "D+", p: "1.4" }, { g: "D", p: "1.0" }, { g: "D-", p: "0.7" },
										{ g: "E", p: "0.0" }, { g: "F", p: "0.0" }, { g: "UW", p: "0.0" }
									].map((row, i) => (
										<tr key={i} className="hover:bg-gray-50 transition-colors">
											<td className="px-6 py-2 font-bold text-gray-800">{row.g}</td>
											<td className="px-6 py-2 text-right text-gray-600 font-mono">{row.p}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						<div className="space-y-6">
							<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
								<h4 className="font-bold text-red-600 mb-2">Failing Grades</h4>
								<ul className="space-y-3 text-sm text-gray-600">
									<li>
										<strong className="text-gray-900">E / F:</strong> 
										<span className="block mt-1">Both count as 0.0 grade points. They are included in "Attempted Credits" and negatively impact GPA.</span>
									</li>
									<li>
										<strong className="text-gray-900">UW (Unofficial Withdrawal):</strong>
										<span className="block mt-1">Treated exactly like an F (0.0). It signifies the student stopped attending but did not officially withdraw.</span>
									</li>
								</ul>
							</div>

							<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
								<h4 className="font-bold text-gray-600 mb-2">Non-Punitive Grades</h4>
								<ul className="space-y-3 text-sm text-gray-600">
									<li>
										<strong className="text-gray-900">W (Official Withdrawal):</strong>
										<span className="block mt-1">Has <strong>no impact</strong> on GPA. It does not earn credits, but it is recorded on the transcript as an attempt.</span>
									</li>
									<li>
										<strong className="text-gray-900">Empty Grade:</strong>
										<span className="block mt-1">Treated identically to a 'W' until a grade is assigned.</span>
									</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			),
		},
		{
			id: "retakes",
			title: "5. Retake Logic",
			content: (
				<div className="space-y-8">
					<div>
						<h3 className="text-2xl font-bold text-gray-800 mb-3">
							Retake Policy Engine
						</h3>
						<p className="text-gray-700 leading-relaxed">
							The most powerful feature of this calculator is its ability to automatically handle course retakes according to the "Best Grade" policy. When a course is repeated, only the highest grade is calculated into the Cumulative GPA.
						</p>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						{/* Card 1: Visual Indicators */}
						<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm lg:col-span-1">
							<h4 className="font-bold text-indigo-700 mb-4">Visual Indicators</h4>
							<div className="flex items-center gap-3 mb-4">
								<span className="text-2xl font-black text-orange-500">**</span>
								<p className="text-sm text-gray-600">The <strong>exclusion marker</strong>.</p>
							</div>
							<p className="text-sm text-gray-600 leading-relaxed">
								Any course marked with <span className="font-bold text-orange-500">**</span> is currently <strong>excluded</strong> from the Cumulative GPA calculation because a better (or equal but later) grade exists for the same course.
							</p>
						</div>

						{/* Card 2: Logic Breakdown */}
						<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm lg:col-span-2">
							<h4 className="font-bold text-indigo-700 mb-4">How it Works</h4>
							<div className="space-y-4 text-sm text-gray-600">
								<div className="flex gap-3">
									<div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs shrink-0">1</div>
									<p>The system groups all courses that share the same <strong>Name</strong> (e.g., "MATH 101").</p>
								</div>
								<div className="flex gap-3">
									<div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs shrink-0">2</div>
									<p>It compares the grade points (0.0 - 4.0) of all attempts.</p>
								</div>
								<div className="flex gap-3">
									<div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs shrink-0">3</div>
									<p>The <strong>Highest Grade</strong> is kept. All other attempts are excluded from GPA but remain as "Attempted Credits".</p>
								</div>
								<div className="flex gap-3">
									<div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs shrink-0">4</div>
									<p>If grades are equal, the <strong>Latest Attempt</strong> is usually favored for the active record.</p>
								</div>
							</div>
						</div>
					</div>

					<div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
						<h4 className="font-bold text-indigo-900 mb-4">Linking Methods</h4>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
							<div>
								<h5 className="font-bold text-gray-800 mb-2">Method A: Automatic</h5>
								<p className="text-sm text-gray-600 mb-2">Happens when course names match exactly (case-insensitive).</p>
								<div className="bg-white p-3 rounded border border-gray-200 text-xs font-mono text-gray-500">
									Term 1: MATH 101 (D)<br/>
									Term 2: MATH 101 (B) <span className="text-green-600">← Linked!</span>
								</div>
							</div>
							<div>
								<h5 className="font-bold text-gray-800 mb-2">Method B: Manual</h5>
								<p className="text-sm text-gray-600 mb-2">Used when names differ (e.g., renumbering).</p>
								<div className="bg-white p-3 rounded border border-gray-200 text-xs font-mono text-gray-500">
									Term 1: MATH 101 (F)<br/>
									Term 2: MATH 200 (A) <span className="text-indigo-600">← Manually Linked</span>
								</div>
								<p className="text-xs text-gray-500 mt-2 italic">Use the 3-dot menu on a course row to manually link it to a previous attempt.</p>
							</div>
						</div>
					</div>
				</div>
			),
		},
		{
			id: "equivalences",
			title: "6. Equivalences",
			content: (
				<div className="space-y-6">
					<div>
						<h3 className="text-2xl font-bold text-gray-800 mb-3">
							Global Course Equivalences
						</h3>
						<p className="text-gray-700 leading-relaxed">
							While Manual Linking is good for one-off corrections, <strong>Equivalences</strong> allow you to set global rules. This is essential for handling curriculum changes where a course code has changed permanently (e.g., "CS 101" becomes "COMP 101").
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
							<h4 className="font-bold text-gray-800 mb-3">The Problem</h4>
							<p className="text-sm text-gray-600 mb-4">
								A student took <strong>CS 101</strong> in 2020 and failed. In 2022, the department renamed the course to <strong>COMP 101</strong>. The student retakes it and gets an 'A'.
							</p>
							<p className="text-sm text-gray-600">
								By default, the system sees these as two different courses. Both grades would count, hurting the student's GPA.
							</p>
						</div>

						<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
							<h4 className="font-bold text-green-700 mb-3">The Solution</h4>
							<p className="text-sm text-gray-600 mb-4">
								Define an Equivalence: <span className="font-mono bg-gray-100 px-1 rounded">CS 101 = COMP 101</span>.
							</p>
							<p className="text-sm text-gray-600">
								Now, the system treats every instance of "CS 101" and "COMP 101" as the same entity. The 'F' from 2020 will be automatically excluded by the 'A' from 2022.
							</p>
						</div>
					</div>

					<div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
						<h4 className="font-bold text-purple-900 mb-2">How to Configure</h4>
						<ol className="list-decimal pl-5 space-y-2 text-sm text-purple-800">
							<li>Click the <strong>"Equivalences"</strong> button in the main header (top right).</li>
							<li>In the modal, type the two course codes you want to link.</li>
							<li>Click <strong>Add</strong>. The rule is now active for the entire transcript.</li>
						</ol>
					</div>
				</div>
			),
		},
		{
			id: "assessment",
			title: "Knowledge Check",
			content: (
				<div className="space-y-6">
					<div>
						<h3 className="text-2xl font-bold text-gray-800 mb-2">
							Final Assessment
						</h3>
						<p className="text-gray-600">
							Verify your understanding of the GPA Calculator system.
						</p>
					</div>
					<div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
						<Quiz />
					</div>
				</div>
			),
		},
	];

	return (
		<div className="fixed inset-0 z-50 flex flex-col h-screen bg-gray-50">
			{/* Header */}
			<div className="bg-indigo-700 px-6 py-4 text-white shrink-0 shadow-md flex justify-between items-center">
				<div>
					<h2 className="text-2xl font-black">System Training Module</h2>
					<p className="text-indigo-200 text-sm">
						Comprehensive guide to the GPA Calculator System v3.0
					</p>
				</div>
				<button
					onClick={onBack}
					className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-medium transition-colors border border-indigo-500 shadow-sm"
				>
					<svg
						className="w-5 h-5 mr-2"
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

			<div className="flex flex-1 overflow-hidden">
				{/* Sidebar Navigation */}
				<nav className="w-64 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto">
					<ul className="p-4 space-y-1">
						{modules.map((m) => (
							<li key={m.id}>
								<button
									onClick={() => setActiveTab(m.id)}
									className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
										activeTab === m.id
											? "bg-indigo-50 text-indigo-700 border border-indigo-200"
											: "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
									}`}
								>
									{m.title}
								</button>
							</li>
						))}
					</ul>
				</nav>

				{/* Content Area - Scrollable */}
				<div className="flex-1 overflow-y-auto p-6 bg-gray-50">
					<div className="min-h-full">
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