import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Select from "react-select";
import data from "../data/religionSections.json";
import {
	convertSectionToLocal,
	getZonesForCountry,
	getAreasForCountry,
	getSupportedCountries,
	TERM_REFERENCE_DATES,
} from "../utils/religionTime.js";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Eligibility flags, in the order they read best.
const ELIGIBILITY = [
	{ key: "allowDomestic", label: "Domestic", studentType: "domestic" },
	{ key: "allowFilipino", label: "Filipino", studentType: "filipino" },
	{ key: "allowInternational", label: "International", studentType: "international" },
];

// Infer the student type from the chosen country (drives the eligibility filter).
function studentTypeForCountry(code) {
	if (code === "US") return "domestic";
	if (code === "PH") return "filipino";
	return "international";
}

/**
 * The one thing a timezone conversion can tell you that the source data can't:
 * whether the gathering lands at an hour the student can realistically attend.
 * Anything inside 6am–10pm is unremarkable and gets no decoration.
 */
function unsociable(hour) {
	if (hour < 6) return "Overnight";
	if (hour >= 22) return "Late";
	return null;
}

// "Thursday 05:00 PM UTC+0 (89)" -> "5:00 PM". The weekday is already the group
// header and the trailing number is an internal hour-of-week index.
function bareTime(raw) {
	const m = raw?.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
	return m ? `${parseInt(m[1], 10)}:${m[2]} ${m[3].toUpperCase()}` : raw || "—";
}

const MoonIcon = (props) => (
	<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
		<path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" />
	</svg>
);

function Toggle({ checked, onChange, label }) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			onClick={() => onChange(!checked)}
			className="group flex items-center gap-2 rounded-md py-1 text-sm text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
		>
			<span
				className={`relative inline-flex h-[18px] w-8 shrink-0 items-center rounded-full transition-colors ${
					checked ? "bg-blue-700" : "bg-slate-300 group-hover:bg-slate-400"
				}`}
			>
				<span
					className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
						checked ? "translate-x-[16px]" : "translate-x-0.5"
					}`}
				/>
			</span>
			<span className={checked ? "font-medium text-slate-900" : ""}>{label}</span>
		</button>
	);
}

function Field({ label, children, hint }) {
	return (
		<label className="flex flex-col gap-1.5">
			<span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</span>
			{children}
			{hint && <span className="text-[11px] leading-snug text-slate-400">{hint}</span>}
		</label>
	);
}

const selectStyles = {
	control: (base, state) => ({
		...base,
		minHeight: "40px",
		borderRadius: "0.5rem",
		backgroundColor: "white",
		borderColor: state.isFocused ? "#1d4ed8" : "#cbd5e1",
		boxShadow: state.isFocused ? "0 0 0 3px rgb(29 78 216 / 0.15)" : "none",
		"&:hover": { borderColor: state.isFocused ? "#1d4ed8" : "#94a3b8" },
		fontSize: "0.875rem",
	}),
	placeholder: (base) => ({ ...base, color: "#94a3b8" }),
	menu: (base) => ({ ...base, zIndex: 40, fontSize: "0.875rem", borderRadius: "0.5rem", overflow: "hidden" }),
	option: (base, state) => ({
		...base,
		backgroundColor: state.isSelected ? "#1d4ed8" : state.isFocused ? "#eff6ff" : "white",
		color: state.isSelected ? "white" : "#0f172a",
		cursor: "pointer",
	}),
};

/** Searchable single-select wrapper. Takes/returns plain string values. */
function SearchSelect({ options, value, onChange, placeholder, inputId }) {
	const selected = options.find((o) => o.value === value) || null;
	return (
		<Select
			inputId={inputId}
			classNamePrefix="rsel"
			options={options}
			value={selected}
			onChange={(opt) => onChange(opt ? opt.value : "")}
			placeholder={placeholder}
			isClearable
			styles={selectStyles}
			menuPlacement="auto"
		/>
	);
}

/** One section, as a chip under its time slot. Seats are the deciding number. */
function SectionChip({ section, ineligible }) {
	const full = section.available <= 0;
	const openTo = ELIGIBILITY.filter((e) => section[e.key]).map((e) => e.label);
	const title =
		`Section ${section.section} · ${section.area} · ` +
		`${section.registered}/${section.sectionSize} enrolled · ` +
		`open to ${openTo.join(", ") || "no one"}`;

	return (
		<span
			title={title}
			className={`inline-flex items-baseline gap-1.5 rounded-md border px-2 py-1 text-xs tabular-nums ${
				ineligible
					? "border-amber-300 bg-amber-50 text-amber-800"
					: full
						? "border-slate-200 bg-slate-50 text-slate-400"
						: "border-slate-300 bg-white text-slate-900"
			}`}
		>
			<span className="font-mono font-semibold">{section.section}</span>
			<span className={full ? "text-slate-400" : "font-medium text-emerald-700"}>
				{full ? "full" : section.available}
			</span>
		</span>
	);
}

/**
 * A local time at which this course gathers. Sections meeting at the same time
 * are interchangeable to the student, so the time leads and the sections become
 * inventory underneath it — which collapses a repetitive list into a decision.
 */
function TimeSlot({ slot, index, onCopy, copied }) {
	const late = unsociable(slot.hour);
	const openCount = slot.rows.filter((r) => r.section.available > 0).length;

	return (
		<li
			className="rf-row group flex flex-col gap-2 border-l-2 py-3 pl-3 pr-2 sm:flex-row sm:gap-5 sm:pl-4"
			style={{
				animationDelay: `${Math.min(index, 10) * 25}ms`,
				borderLeftColor: late ? "#a5b4fc" : "transparent",
			}}
		>
			{/* Left rail: the answer to "when?" */}
			<div className="sm:w-36 sm:shrink-0">
				<div className="flex items-baseline gap-1.5">
					<span
						className={`text-xl font-bold tabular-nums tracking-tight ${
							late ? "text-indigo-700" : "text-slate-900"
						}`}
					>
						{slot.time}
					</span>
					{late && <MoonIcon className="h-3 w-3 shrink-0 text-indigo-500" />}
					{late && (
						<span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-indigo-600">
							{late}
						</span>
					)}
				</div>
				<dl className="mt-1 font-mono text-[11px] leading-tight text-slate-400">
					<div className="flex gap-1.5">
						<dt className="w-6">MT</dt>
						<dd className="tabular-nums">{slot.mountain}</dd>
					</div>
					<div className="flex gap-1.5">
						<dt className="w-6">UTC</dt>
						<dd className="tabular-nums">{slot.utc}</dd>
					</div>
				</dl>
			</div>

			{/* Right: the inventory at that time */}
			<div className="min-w-0 flex-1">
				<div className="mb-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs text-slate-500">
					{slot.area && <span className="font-medium text-slate-700">{slot.area}</span>}
					{slot.area && <span className="text-slate-300">·</span>}
					<span>
						<strong className="font-semibold tabular-nums text-slate-700">{slot.rows.length}</strong> section
						{slot.rows.length === 1 ? "" : "s"}
					</span>
					<span className="text-slate-300">·</span>
					<span className={openCount ? "" : "text-red-700"}>
						{openCount ? `${openCount} with open seats` : "all full"}
					</span>
					{slot.crossesDay && (
						<span className="text-slate-400" title="Falls on a different day than the published UTC time">
							· day shifts
						</span>
					)}
				</div>
				<div className="flex flex-wrap items-center gap-1.5">
					{slot.rows.map(({ section, ineligible }) => (
						<SectionChip key={section.section + section.area} section={section} ineligible={ineligible} />
					))}
					<button
						type="button"
						onClick={onCopy}
						title="Copy this time and its open sections as a line you can paste to a student"
						className="ml-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-400 transition hover:bg-blue-50 hover:text-blue-700 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:opacity-0 sm:group-hover:opacity-100"
					>
						{copied ? "Copied" : "Copy"}
					</button>
				</div>
			</div>
		</li>
	);
}

function ReligionLookup() {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const countries = useMemo(() => getSupportedCountries(), []);

	useEffect(() => {
		const previous = document.title;
		document.title = "Religion Course Finder";
		return () => {
			document.title = previous;
		};
	}, []);

	// One term in the data is the common case — don't make it a required click
	// when there's only one possible answer. It reappears as a select if the
	// next export carries more than one.
	const singleTerm = data.terms.length === 1 ? data.terms[0] : "";

	const [course, setCourse] = useState(() => searchParams.get("course") || "");
	const [term, setTerm] = useState(() => searchParams.get("term") || singleTerm);
	const [country, setCountry] = useState(() => searchParams.get("country") || "");
	const [region, setRegion] = useState(() => searchParams.get("region") || ""); // CMIS sub-area
	const [zone, setZone] = useState(() => searchParams.get("zone") || "");
	const [eligibleOnly, setEligibleOnly] = useState(true);
	const [openOnly, setOpenOnly] = useState(false);
	const [allAreas, setAllAreas] = useState(() => searchParams.get("all") === "1");
	const [copiedKey, setCopiedKey] = useState("");

	const areaInfo = useMemo(() => (country ? getAreasForCountry(country) : { areas: [], multi: false }), [country]);
	const zones = useMemo(() => (country ? getZonesForCountry(country) : []), [country]);

	// A country restored from the URL still needs its default zone/region filled in.
	useEffect(() => {
		if (!country) return;
		if (!zone && zones.length) setZone(zones[0].name);
		if (!region && !areaInfo.multi && areaInfo.areas.length) setRegion(areaInfo.areas[0]);
	}, [country, zone, region, zones, areaInfo]);

	// Keep the query in the URL so a lookup can be pasted into chat or refreshed.
	useEffect(() => {
		const next = {};
		if (course) next.course = course;
		if (term && term !== singleTerm) next.term = term;
		if (country) next.country = country;
		if (region) next.region = region;
		if (zone) next.zone = zone;
		if (allAreas) next.all = "1";
		setSearchParams(next, { replace: true });
	}, [course, term, country, region, zone, allAreas, singleTerm, setSearchParams]);

	const courseOptions = useMemo(
		() => data.courses.map((c) => ({ value: c.course, label: `${c.course} — ${c.name}` })),
		[]
	);
	const termOptions = useMemo(() => data.terms.map((t) => ({ value: t, label: t })), []);
	const countryOptions = useMemo(() => countries.map((c) => ({ value: c.code, label: c.name })), [countries]);
	const regionOptions = useMemo(() => areaInfo.areas.map((a) => ({ value: a, label: a })), [areaInfo]);
	const zoneOptions = useMemo(() => zones.map((z) => ({ value: z.name, label: z.label })), [zones]);

	// When country changes, reset/auto-pick region and zone.
	function handleCountry(code) {
		setCountry(code);
		const info = getAreasForCountry(code);
		setRegion(info.multi ? "" : info.areas[0] || "");
		const z = getZonesForCountry(code);
		setZone(z.length ? z[0].name : "");
	}

	const selectedAreas = areaInfo.multi ? (region ? [region] : []) : areaInfo.areas;
	const studentType = country ? studentTypeForCountry(country) : null;
	const eligibleKey = ELIGIBILITY.find((e) => e.studentType === studentType)?.key;

	// In all-areas mode the region/area is irrelevant, so it isn't required.
	const ready = course && term && country && zone && (allAreas || selectedAreas.length > 0);

	// What's still missing, so the empty state can say so instead of stalling.
	const missing = [];
	if (!course) missing.push("a course");
	if (!term) missing.push("a term");
	if (!country) missing.push("a destination country");
	else if (!allAreas && !selectedAreas.length) missing.push("a region");

	// Sections matching course/term (+ area unless all-areas), before the
	// eligibility and seat toggles are applied.
	const baseMatches = useMemo(() => {
		if (!ready) return [];
		return data.sections.filter(
			(s) => s.active && s.course === course && s.term === term && (allAreas || selectedAreas.includes(s.area))
		);
	}, [ready, course, term, selectedAreas, allAreas]);

	// Each toggle only does something if it would actually remove a row —
	// otherwise it's a no-op control, so hide it.
	const hasIneligible = useMemo(
		() => !!eligibleKey && baseMatches.some((s) => !s[eligibleKey]),
		[baseMatches, eligibleKey]
	);
	const hasFull = useMemo(() => baseMatches.some((s) => s.available <= 0), [baseMatches]);

	const results = useMemo(() => {
		let filtered = baseMatches;
		if (eligibleOnly && eligibleKey) filtered = filtered.filter((s) => s[eligibleKey]);
		if (openOnly) filtered = filtered.filter((s) => s.available > 0);
		return filtered
			.map((s) => ({
				section: s,
				local: convertSectionToLocal(s, zone, term),
				ineligible: eligibleKey ? !s[eligibleKey] : false,
			}))
			.filter((r) => r.local);
	}, [baseMatches, eligibleOnly, eligibleKey, openOnly, zone, term]);

	/**
	 * Collapse to one entry per local gathering time — sections meeting at the
	 * same moment are the same choice for the student. Grouped by the *local*
	 * weekday, which the UTC weekday can't stand in for.
	 */
	const days = useMemo(() => {
		const slots = new Map();
		for (const r of results) {
			const key = `${r.local.weekdayIndex}|${r.local.minuteOfWeek}` + (allAreas ? `|${r.section.area}` : "");
			if (!slots.has(key)) {
				slots.set(key, {
					key,
					weekdayIndex: r.local.weekdayIndex,
					minuteOfWeek: r.local.minuteOfWeek,
					time: r.local.time,
					hour: r.local.hour,
					zoneAbbr: r.local.zoneAbbr,
					dayName: r.local.dayName,
					crossesDay: r.local.crossesDay,
					mountain: bareTime(r.section.mountainTime),
					utc: bareTime(r.section.utcTime),
					area: allAreas ? r.section.area : "",
					rows: [],
				});
			}
			slots.get(key).rows.push(r);
		}

		for (const slot of slots.values()) {
			// Sections with the most room first — that's what gets recommended.
			slot.rows.sort((a, b) => b.section.available - a.section.available);
		}

		const byDay = new Map();
		for (const slot of [...slots.values()].sort(
			(a, b) => a.minuteOfWeek - b.minuteOfWeek || a.area.localeCompare(b.area)
		)) {
			if (!byDay.has(slot.weekdayIndex)) byDay.set(slot.weekdayIndex, []);
			byDay.get(slot.weekdayIndex).push(slot);
		}
		return [...byDay.entries()]
			.sort((a, b) => a[0] - b[0])
			.map(([index, list]) => ({
				name: WEEKDAYS[index] || "Unknown",
				slots: list,
				count: list.reduce((n, s) => n + s.rows.length, 0),
			}));
	}, [results, allAreas]);

	const courseName = data.courses.find((c) => c.course === course)?.name;
	const countryName = countries.find((c) => c.code === country)?.name;
	const refDate = term ? TERM_REFERENCE_DATES[term] : null;
	const zoneAbbr = results[0]?.local?.zoneAbbr || "";
	const slotCount = days.reduce((n, d) => n + d.slots.length, 0);
	const lateSlots = days.reduce((n, d) => n + d.slots.filter((s) => unsociable(s.hour)).length, 0);

	// The end of the workflow is telling the student — hand over a pasteable line.
	const copySlot = useCallback(
		(slot) => {
			const open = slot.rows.filter((r) => r.section.available > 0);
			const list = open.length
				? open.map((r) => `${r.section.section} (${r.section.available} seats)`).join(", ")
				: "no sections with open seats";
			const line =
				`${course} ${courseName} — ${slot.dayName} ${slot.time} ${slot.zoneAbbr} ` +
				`(Mountain ${slot.mountain}) · ${list}`;
			navigator.clipboard?.writeText(line).then(
				() => {
					setCopiedKey(slot.key);
					setTimeout(() => setCopiedKey(""), 1600);
				},
				() => {}
			);
		},
		[course, courseName]
	);

	return (
		<div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
			<header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
				<div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
					<div className="flex items-baseline gap-3">
						<h1 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-900">
							Religion Section Finder
						</h1>
						{singleTerm && (
							<span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
								{singleTerm}
							</span>
						)}
					</div>
					<button
						onClick={() => navigate("/")}
						className="rounded-md px-2 py-1 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
					>
						← Calculator
					</button>
				</div>
			</header>

			<main className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6">
				<p className="mb-5 max-w-2xl text-sm leading-relaxed text-slate-500">
					Find a religion gathering for a student, with every time converted to their local clock. Times
					outside 6am–10pm are flagged.
				</p>

				{/* Query panel */}
				<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						<Field label="Course">
							<SearchSelect
								inputId="rf-course"
								options={courseOptions}
								value={course}
								onChange={setCourse}
								placeholder="Search a course…"
							/>
						</Field>

						{!singleTerm && (
							<Field label="Term">
								<SearchSelect
									inputId="rf-term"
									options={termOptions}
									value={term}
									onChange={setTerm}
									placeholder="Select a term…"
								/>
							</Field>
						)}

						<Field label="Student's country">
							<SearchSelect
								inputId="rf-country"
								options={countryOptions}
								value={country}
								onChange={handleCountry}
								placeholder="Search a country…"
							/>
						</Field>

						{areaInfo.multi && !allAreas && (
							<Field label="Region" hint="This country spans several CMIS areas.">
								<SearchSelect
									inputId="rf-region"
									options={regionOptions}
									value={region}
									onChange={setRegion}
									placeholder="Select a region…"
								/>
							</Field>
						)}

						{zones.length > 1 && (
							<Field label="Time zone" hint="This country has more than one.">
								<SearchSelect
									inputId="rf-zone"
									options={zoneOptions}
									value={zone}
									onChange={setZone}
									placeholder="Select a time zone…"
								/>
							</Field>
						)}
					</div>

					<div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-100 pt-3">
						<Toggle checked={allAreas} onChange={setAllAreas} label="Search every area" />
						{ready && hasFull && (
							<Toggle checked={openOnly} onChange={setOpenOnly} label="Hide full sections" />
						)}
						{ready && hasIneligible && (
							<Toggle
								checked={eligibleOnly}
								onChange={setEligibleOnly}
								label={`Only sections open to ${studentType} students`}
							/>
						)}
					</div>
				</div>

				{/* Results */}
				<div className="mt-8">
					{!ready ? (
						<div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
							<p className="text-sm text-slate-500">
								Choose {missing.join(", ").replace(/, ([^,]*)$/, " and $1")} to see gathering times.
							</p>
						</div>
					) : results.length === 0 ? (
						<div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
							<p className="text-sm font-medium text-slate-700">No sections match this search.</p>
							<p className="mt-1 text-sm text-slate-500">
								{allAreas
									? `${course} has no active sections in ${term}.`
									: "Try turning on “Search every area”, or clear the filters above."}
							</p>
						</div>
					) : (
						<>
							<div className="mb-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
								<h2 className="font-mono text-xl font-bold tracking-tight text-slate-900">{course}</h2>
								<span className="text-base text-slate-600">{courseName}</span>
							</div>
							<p className="text-sm text-slate-500" aria-live="polite">
								<strong className="font-semibold tabular-nums text-slate-900">{results.length}</strong>{" "}
								section{results.length === 1 ? "" : "s"} at{" "}
								<strong className="font-semibold tabular-nums text-slate-900">{slotCount}</strong>{" "}
								gathering time{slotCount === 1 ? "" : "s"} in{" "}
								{allAreas ? "every area" : selectedAreas.join(", ")}
								{lateSlots > 0 && (
									<>
										{" · "}
										<span className="text-indigo-700">
											{lateSlots} outside 6am–10pm for this student
										</span>
									</>
								)}
							</p>
							<p className="mt-1 text-[11px] text-slate-400">
								Times shown for {countryName} —{" "}
								<span className="font-mono">
									{zone}
									{zoneAbbr ? ` (${zoneAbbr})` : ""}
								</span>
								{refDate ? `, reference week of ${refDate} with DST applied` : ""}
							</p>

							<div className="mt-6 space-y-7">
								{days.map((day) => (
									<section key={day.name}>
										<div className="flex items-baseline gap-3">
											<h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-900">
												{day.name}
											</h3>
											<span className="h-px flex-1 bg-slate-200" />
											<span className="text-[11px] tabular-nums text-slate-400">
												{day.count} section{day.count === 1 ? "" : "s"}
											</span>
										</div>
										<ul className="mt-1 divide-y divide-slate-100">
											{day.slots.map((slot, i) => (
												<TimeSlot
													key={slot.key}
													slot={slot}
													index={i}
													copied={copiedKey === slot.key}
													onCopy={() => copySlot(slot)}
												/>
											))}
										</ul>
									</section>
								))}
							</div>
						</>
					)}
				</div>
			</main>
		</div>
	);
}

export default ReligionLookup;
