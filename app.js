// Fixed 4.0 scale with +/- ; W excluded from GPA math; UW = 0
const SCALE = {
	letters: [
		"A",
		"A-",
		"B+",
		"B",
		"B-",
		"C+",
		"C",
		"C-",
		"D+",
		"D",
		"D-",
		"F",
		"UW",
		"W",
	],
	points: {
		A: 4.0,
		"A-": 3.7,
		"B+": 3.4,
		B: 3.0,
		"B-": 2.7,
		"C+": 2.4,
		C: 2.0,
		"C-": 1.7,
		"D+": 1.4,
		D: 1.0,
		"D-": 0.7,
		F: 0.0,
		UW: 0.0,
		W: null,
	},
};

const STORAGE_KEY = "gpa_state_v3";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const termsEl = $("#terms");
const addTermBtn = $("#addTerm");
const instSel = $("#institution");

const decimalsFor = () => (instSel.value === "Ensign" ? 3 : 2);
const fmt = (n, d = decimalsFor()) => {
	if (!Number.isFinite(n)) return (0).toFixed(d);
	const factor = Math.pow(10, d);
	const truncated = Math.floor(n * factor) / factor;
	return truncated.toFixed(d);
};

// Local state
let nextRowId = 1;
let transferEarned = 0; // editable only in transcript stats

const genRowId = () => String(nextRowId++);

// Build grade options into a select
function makeGradeSelectOptions(selectEl) {
	const letters = SCALE.letters;
	const current = selectEl.value;
	selectEl.innerHTML = "";
	for (const L of letters) {
		const opt = document.createElement("option");
		opt.value = L;
		opt.textContent = L;
		selectEl.appendChild(opt);
	}
	if (letters.includes(current)) selectEl.value = current;
	else selectEl.value = letters.at(-1);
}

// --- Retake modal helpers ---
const modalEl = $("#retakeModal");
const modalList = $("#retakeList");

function openRetakeModal(currentRow, termIdx) {
	modalList.innerHTML = "";
	const items = buildEarlierCourseOptions(termIdx, currentRow.dataset.rowId);
	if (items.length === 0) {
		const empty = document.createElement("div");
		empty.className = "px-4 py-6 text-sm text-gray-500";
		empty.textContent = "No earlier courses available to replace.";
		modalList.appendChild(empty);
	} else {
		for (const { value, label } of items) {
			const btn = document.createElement("button");
			btn.className = "w-full text-left px-4 py-3 hover:bg-gray-50 border-b";
			btn.textContent = label;
			btn.addEventListener("click", () => {
				setRetake(currentRow, value);
				closeRetakeModal();
			});
			modalList.appendChild(btn);
		}
	}
	modalEl.classList.remove("hidden");
	document.body.classList.add("modal-open");
}

function closeRetakeModal() {
	modalEl.classList.add("hidden");
	document.body.classList.remove("modal-open");
}

modalEl.addEventListener("click", (e) => {
	if (e.target.dataset.close) closeRetakeModal();
});

// --- Term & rows ---
function createTermCard(index) {
	const wrapper = document.createElement("div");
	wrapper.className =
		"term bg-white rounded-2xl shadow-sm ring-1 ring-gray-300 overflow-hidden";
	wrapper.dataset.termIndex = String(index);

	wrapper.innerHTML = `
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div class="flex items-baseline gap-3">
            <h2 class="text-lg font-bold text-gray-800">Term <span class="term-number">${index}</span></h2>
            <span class="text-xs text-gray-700">Term GPA: <strong class="termGpa text-gray-900">${fmt(
							0
						)}</strong></span>
          </div>
          <div class="flex items-center gap-3">
            <button class="addCourse rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-sm">+ Add Course</button>
            <button class="removeTerm text-red-600 hover:text-red-800 text-sm">Remove Term</button>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-100 text-gray-700">
              <tr>
                <th class="px-3 py-2 text-left">Course</th>
                <th class="px-3 py-2 text-left">Units</th>
                <th class="px-3 py-2 text-left">Grade</th>
                <th class="px-3 py-2 text-center">Grade Value</th>
                <th class="px-3 py-2 text-center">Quality Points</th>
                <th class="px-3 py-2 text-left">Retake</th>
                <th class="px-3 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200" id="tbody-${index}"></tbody>
          </table>
        </div>
        <!-- Term Summary (two rows only) -->
        <div class="px-4 py-4 bg-gray-50 border-t border-gray-200">
          <div class="grid grid-cols-12 gap-2 text-sm font-medium text-gray-600">
            <div class="col-span-3"></div>
            <div class="col-span-3 text-center">Attempted</div>
            <div class="col-span-3 text-center">Earned</div>
            <div class="col-span-3 text-center">Quality Points</div>
          </div>
          <!-- Term GPA Row -->
          <div class="grid grid-cols-12 items-center mt-1">
            <div class="col-span-3 font-semibold text-gray-800">Term GPA: <span class="termGpa">${fmt(
							0
						)}</span></div>
            <div class="col-span-3 text-center termAttempted">0</div>
            <div class="col-span-3 text-center termEarned">0</div>
            <div class="col-span-3 text-center termQP">0</div>
          </div>
          <!-- Cum GPA Row -->
          <div class="grid grid-cols-12 items-center mt-3">
            <div class="col-span-3 font-semibold text-gray-800">Cum GPA: <span class="cumGpa">${fmt(
							0
						)}</span></div>
            <div class="col-span-3 text-center cumAttempted">0</div>
            <div class="col-span-3 text-center cumEarned">0</div>
            <div class="col-span-3 text-center cumQP">0</div>
          </div>
        </div>
      `;

	// seed with one row
	addCourseRow(wrapper);
	return wrapper;
}

function addCourseRow(termCard) {
	const tb = termCard.querySelector("tbody");
	const tpl = $("#rowTemplate");
	const tr = tpl.content.firstElementChild.cloneNode(true);
	tr.dataset.rowId = genRowId();
	const gradeSel = tr.querySelector("select.grade");
	makeGradeSelectOptions(gradeSel);
	tb.appendChild(tr);
	refreshRetakeMarks();
	saveState();
	return tr;
}

// Earlier courses for modal list
function buildEarlierCourseOptions(currentTermIdx, currentRowId) {
	const opts = [];
	for (const t of $$(".term")) {
		const tIdx = Number(t.dataset.termIndex);
		if (tIdx >= currentTermIdx) break;
		for (const r of $$(".course-row", t)) {
			const rid = r.dataset.rowId;
			if (!rid || rid === currentRowId) continue;
			const name = $(".courseName", r)?.value?.trim() || "(Unnamed)";
			const units = parseFloat($(".units", r)?.value) || 0;
			const grade = $(".grade", r)?.value || "";
			const label = `Term ${tIdx} — ${name} [${units || 0}u, ${grade}]`;
			opts.push({ value: rid, label });
		}
	}
	return opts;
}

// Retake logic helpers
function computeRetakeExclusionsMap() {
	const excludeFromTerm = {}; // rowId -> startTermIdx
	for (const t of $$(".term")) {
		const termIdx = Number(t.dataset.termIndex);
		for (const r of $$(".course-row", t)) {
			const target = r.dataset.retakeOf;
			if (!target) continue;
			const targetRow = document.querySelector(
				`.course-row[data-row-id="${target}"]`
			);
			if (!targetRow) continue;
			const targetTermIdx = Number(
				targetRow.closest(".term").dataset.termIndex
			);
			if (targetTermIdx < termIdx) {
				excludeFromTerm[target] = Math.min(
					excludeFromTerm[target] ?? termIdx,
					termIdx
				);
			}
		}
	}
	return excludeFromTerm;
}

function setRetake(currentRow, targetRowId) {
	currentRow.dataset.retakeOf = targetRowId;
	$(".retakeToggle", currentRow).checked = true;
	refreshRetakeMarks();
	recalcAll();
	saveState();
}

function clearRetake(currentRow) {
	delete currentRow.dataset.retakeOf;
	$(".retakeToggle", currentRow).checked = false;
	refreshRetakeMarks();
	recalcAll();
	saveState();
}

function refreshRetakeMarks() {
	$$(".course-row").forEach((r) =>
		$(".retakeStar", r)?.classList.add("hidden")
	);
	for (const r of $$(".course-row")) {
		const target = r.dataset.retakeOf;
		if (!target) continue;
		const earlier = document.querySelector(
			`.course-row[data-row-id="${target}"]`
		);
		if (!earlier) continue;
		$(".retakeStar", r)?.classList.remove("hidden");
		$(".retakeStar", earlier)?.classList.remove("hidden");
	}
}

// Math per term (W counts as Attempted; GPA denominator = Attempted - W credits)
function termCalc(termCard, excludeFromTermMap) {
	const rows = $$(".course-row", termCard);
	const termIdx = Number(termCard.dataset.termIndex);
	const map = SCALE.points;

	let attempted = 0,
		earned = 0,
		qp = 0,
		w_credits = 0;

	for (const r of rows) {
		const rid = r.dataset.rowId;
		const units = parseFloat($(".units", r).value) || 0;
		const grade = $(".grade", r).value;
		const gRaw = map[grade];
		const gVal = gRaw === null ? null : gRaw ?? 0;

		// Always count attempted (even W)
		attempted += units;

		if (gVal === null) w_credits += units; // W credits

		// UI cells
		const q = gVal === null ? 0 : units * gVal;
		$(".gradeVal", r).textContent = gVal === null ? "*" : fmt(gVal);
		$(".quality", r).textContent = fmt(q);

		// Earned excludes W and any non-passing (gVal <= 0)
		if (gVal > 0) earned += units;
		qp += q;

		// Cache for cumulative
		r.__gpaRowCache = {
			units,
			gVal,
			q,
			rid,
			termIdx,
			exclusionStart: excludeFromTermMap[rid],
		};
	}

	const denom = attempted - w_credits; // GPA denominator excludes W credits
	const gpa = denom > 0 ? qp / denom : 0;

	termCard
		.querySelectorAll(".termGpa")
		.forEach((el) => (el.textContent = fmt(gpa)));
	$(".termAttempted", termCard).textContent = fmt(attempted);
	$(".termEarned", termCard).textContent = fmt(earned);
	$(".termQP", termCard).textContent = fmt(qp);

	return { attempted, earned, qp };
}

// Cumulative up to term index (apply retake exclusions)
function computeCumMetrics(upToTermIdx) {
	let attempted = 0,
		earned = 0,
		qp = 0,
		w_credits = 0;
	for (const t of $$(".term")) {
		const tIdx = Number(t.dataset.termIndex);
		if (tIdx > upToTermIdx) break;
		for (const r of $$(".course-row", t)) {
			const c = r.__gpaRowCache;
			if (!c) continue;
			const excludedNow =
				c.exclusionStart !== undefined && upToTermIdx >= c.exclusionStart;
			if (excludedNow) continue;
			// Attempted always includes, even if gVal is null (W)
			attempted += c.units;
			if (c.gVal === null) w_credits += c.units; // W credits
			if (c.gVal > 0) earned += c.units;
			if (c.gVal !== null) qp += c.q; // W contributes 0 QP already
		}
	}
	const denom = attempted - w_credits; // GPA denominator excludes W credits
	const gpa = denom > 0 ? qp / denom : 0;
	return { attempted, earned, qp, gpa };
}

function recalcAll() {
	const excludeFromTermMap = computeRetakeExclusionsMap();

	// Pass 1: per-term
	const terms = $$(".term");
	terms.forEach((t) => termCalc(t, excludeFromTermMap));

	// Pass 2: cumulative rows per term
	terms.forEach((t) => {
		const tIdx = Number(t.dataset.termIndex);
		const { attempted, earned, qp, gpa } = computeCumMetrics(tIdx);
		$(".cumAttempted", t).textContent = fmt(attempted);
		$(".cumEarned", t).textContent = fmt(earned);
		$(".cumQP", t).textContent = fmt(qp);
		$(".cumGpa", t).textContent = fmt(gpa);
	});

	// Transcript stats: institution row uses last term cumulative
	const lastIdx = terms.length
		? Number(terms[terms.length - 1].dataset.termIndex)
		: 0;
	const inst = computeCumMetrics(lastIdx);
	$("#instGpa").textContent = fmt(inst.gpa);
	$("#instAttempted").textContent = fmt(inst.attempted);
	$("#instEarned").textContent = fmt(inst.earned);
	$("#instQP").textContent = fmt(inst.qp);

	// Overall = institution + transfer (only Earned is provided for transfer; GPA, Attempted, QP are dashes/zero per spec)
	const overallAttempted = inst.attempted; // transfer attempted is ---
	const overallEarned =
		inst.earned + (Number.isFinite(transferEarned) ? transferEarned : 0);
	const overallQP = inst.qp; // transfer QP = 0.00
	const overallGpa = inst.gpa; // same logic since attempted unchanged

	$("#overallAttempted").textContent = fmt(overallAttempted);
	$("#overallEarned").textContent = fmt(overallEarned);
	$("#overallQP").textContent = fmt(overallQP);
	$("#overallGpa").textContent = fmt(overallGpa);

	// Persist
	saveState();
}

function renumberTerms() {
	$$(".term").forEach((t, i) => {
		t.dataset.termIndex = String(i + 1);
		$(".term-number", t).textContent = String(i + 1);
	});
	refreshRetakeMarks();
}

// ----- Persistence -----
function serializeState() {
	return {
		institution: instSel.value,
		nextRowId,
		transferEarned,
		terms: $$(".term").map((t) => ({
			termIndex: Number(t.dataset.termIndex),
			rows: $$(".course-row", t).map((r) => ({
				id: r.dataset.rowId,
				name: $(".courseName", r).value,
				units: parseFloat($(".units", r).value) || 0,
				grade: $(".grade", r).value,
				retakeOf: r.dataset.retakeOf || null,
			})),
		})),
	};
}

function saveState() {
	const state = serializeState();
	localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function restoreState() {
	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) return false;
	try {
		const state = JSON.parse(raw);
		instSel.value = state.institution || "BYUI";
		nextRowId = state.nextRowId || 1;
		transferEarned = Number(state.transferEarned) || 0;
		$("#transferEarned").textContent = String(transferEarned);

		termsEl.innerHTML = "";
		for (const t of state.terms || []) {
			const termCard = createTermCard(t.termIndex);
			termCard.querySelector("tbody").innerHTML = "";
			for (const r of t.rows) {
				const tr = addCourseRow(termCard);
				tr.dataset.rowId = r.id;
				$(".courseName", tr).value = r.name || "";
				$(".units", tr).value = r.units ?? "";
				$(".grade", tr).value = r.grade || "W";
				if (r.retakeOf) tr.dataset.retakeOf = r.retakeOf;
			}
			termsEl.appendChild(termCard);
		}
		renumberTerms();
		refreshRetakeMarks();
		recalcAll();
		return true;
	} catch (e) {
		console.error("Failed to restore state", e);
		return false;
	}
}

// ----- Events -----
addTermBtn.addEventListener("click", () => {
	const next = $$(".term").length + 1;
	const t = createTermCard(next);
	termsEl.appendChild(t);
	recalcAll();
});

termsEl.addEventListener("click", (e) => {
	const target = e.target;
	if (!(target instanceof HTMLElement)) return;

	if (target.classList.contains("addCourse")) {
		const card = target.closest(".term");
		addCourseRow(card);
		recalcAll();
	}

	if (target.classList.contains("removeRow")) {
		const row = target.closest("tr");
		const tb = row?.parentElement;
		if (tb && tb.children.length > 1) {
			row.remove();
		} else {
			// keep at least one row; clear inputs
			row.querySelector(".courseName").value = "";
			row.querySelector(".units").value = "";
			const g = row.querySelector(".grade");
			g.value = "W";
			clearRetake(row);
		}
		// Deleting a row clears saved state entirely (per earlier requirement)
		localStorage.removeItem(STORAGE_KEY);
		renumberTerms();
		recalcAll();
	}

	if (target.classList.contains("removeTerm")) {
		const card = target.closest(".term");
		card.remove();
		// Deleting a term clears saved state entirely
		localStorage.removeItem(STORAGE_KEY);
		renumberTerms();
		recalcAll();
	}

	if (target.classList.contains("chooseRetake")) {
		const row = target.closest(".course-row");
		const term = target.closest(".term");
		openRetakeModal(row, Number(term.dataset.termIndex));
	}
});

// Inputs + select changes
termsEl.addEventListener("input", (e) => {
	const el = e.target;
	if (!(el instanceof HTMLElement)) return;
	if (el.matches("input, select")) {
		if (el.classList.contains("retakeToggle")) {
			const row = el.closest(".course-row");
			const btn = row.querySelector(".chooseRetake");
			if (el.checked) {
				btn.classList.remove("hidden");
				const term = el.closest(".term");
				openRetakeModal(row, Number(term.dataset.termIndex));
			} else {
				btn.classList.add("hidden");
				clearRetake(row);
			}
		}
		recalcAll();
	}
});

// Handle select changes explicitly (grades)
termsEl.addEventListener("change", (e) => {
	const el = e.target;
	if (!(el instanceof HTMLElement)) return;
	if (el.matches("select")) recalcAll();
});

// Institution rounding change
instSel.addEventListener("change", () => {
	recalcAll();
});

// Transfer earned editable
$("#transferEarned").addEventListener("input", (e) => {
	const val = parseFloat(e.currentTarget.textContent.trim());
	transferEarned = Number.isFinite(val) ? Math.max(0, val) : 0;
	recalcAll();
});

// Clear All
$("#clearAll").addEventListener("click", () => {
	localStorage.removeItem(STORAGE_KEY);
	termsEl.innerHTML = "";
	seedDefaultTerms(3);
	instSel.value = "BYUI";
	transferEarned = 0;
	$("#transferEarned").textContent = "0";
	recalcAll();
});

function seedDefaultTerms(n = 3) {
	for (let i = 1; i <= n; i++) termsEl.appendChild(createTermCard(i));
}

// Boot
function boot() {
	if (!restoreState()) {
		seedDefaultTerms(3);
		$$(".grade").forEach(makeGradeSelectOptions);
		recalcAll();
	} else {
		$$(".grade").forEach(makeGradeSelectOptions);
		recalcAll();
	}
}

boot();
