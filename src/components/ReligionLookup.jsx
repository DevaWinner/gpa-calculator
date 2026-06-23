import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import data from "../data/religionSections.json";
import {
	convertSectionToLocal,
	getZonesForCountry,
	getAreasForCountry,
	getSupportedCountries,
	TERM_REFERENCE_DATES,
} from "../utils/religionTime.js";

const TERM_LABELS = {
	"26B3": "26B3",
	"26B4": "26B4",
	"26B5": "26B5",
};

// Friendly label for a section's eligibility flags.
const ELIGIBILITY = [
	{ key: "allowDomestic", label: "Domestic", studentType: "domestic", color: "bg-emerald-100 text-emerald-800" },
	{ key: "allowFilipino", label: "Filipino", studentType: "filipino", color: "bg-violet-100 text-violet-800" },
	{ key: "allowInternational", label: "International", studentType: "international", color: "bg-sky-100 text-sky-800" },
];

// Infer the student type from the chosen country (drives the eligibility filter).
function studentTypeForCountry(code) {
	if (code === "US") return "domestic";
	if (code === "PH") return "filipino";
	return "international";
}

// Strips the trailing internal hour-of-week index, e.g. "Thursday 05:00 PM UTC+0 (89)" -> "Thursday 05:00 PM UTC+0".
const cleanTime = (s) => (s ? s.replace(/\s*\(\d+\)\s*$/, "") : s);

function Toggle({ checked, onChange, label }) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			onClick={() => onChange(!checked)}
			className="flex items-center gap-2.5 text-sm font-medium text-gray-700"
		>
			<span
				className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
					checked ? "bg-blue-600" : "bg-gray-300"
				}`}
			>
				<span
					className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
						checked ? "translate-x-5" : "translate-x-0.5"
					}`}
				/>
			</span>
			{label}
		</button>
	);
}

function Field({ label, children, hint }) {
	return (
		<label className="flex flex-col gap-1.5">
			<span className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</span>
			{children}
			{hint && <span className="text-[11px] text-gray-400">{hint}</span>}
		</label>
	);
}

// react-select styling tuned to match the app's blue/tailwind look.
const selectStyles = {
	control: (base, state) => ({
		...base,
		minHeight: "38px",
		borderRadius: "0.5rem",
		borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
		boxShadow: state.isFocused ? "0 0 0 2px #bfdbfe" : "0 1px 2px 0 rgb(0 0 0 / 0.05)",
		"&:hover": { borderColor: state.isFocused ? "#3b82f6" : "#9ca3af" },
		fontSize: "0.875rem",
	}),
	placeholder: (base) => ({ ...base, color: "#9ca3af" }),
	menu: (base) => ({ ...base, zIndex: 30, fontSize: "0.875rem" }),
	option: (base, state) => ({
		...base,
		backgroundColor: state.isSelected ? "#2563eb" : state.isFocused ? "#eff6ff" : "white",
		color: state.isSelected ? "white" : "#111827",
		cursor: "pointer",
	}),
};

/** Searchable single-select wrapper. Takes/returns plain string values. */
function SearchSelect({ options, value, onChange, placeholder, isDisabled }) {
	const selected = options.find((o) => o.value === value) || null;
	return (
		<Select
			classNamePrefix="rsel"
			options={options}
			value={selected}
			onChange={(opt) => onChange(opt ? opt.value : "")}
			placeholder={placeholder}
			isDisabled={isDisabled}
			isClearable
			styles={selectStyles}
			menuPlacement="auto"
		/>
	);
}

function SeatBadge({ section }) {
	const full = section.available <= 0;
	return (
		<span
			className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
				full ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
			}`}
		>
			{full ? "Full" : `${section.available} seat${section.available === 1 ? "" : "s"} open`}
		</span>
	);
}

function SectionCard({ section, local }) {
	return (
		<div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<div className="flex items-center gap-2">
						<span className="text-xs font-bold uppercase tracking-wide text-blue-700">
							Section {section.section}
						</span>
						<SeatBadge section={section} />
					</div>
					<div className="mt-2 text-2xl font-black tracking-tight text-gray-900">
						{local ? local.formatted : "—"}
					</div>
					<div className="mt-1 space-y-0.5 text-xs text-gray-400">
						<div>Mountain: {cleanTime(section.mountainTime)}</div>
						<div>UTC: {cleanTime(section.utcTime)}</div>
						<div>Area: {section.area}</div>
					</div>
				</div>
				<div className="flex flex-wrap items-center justify-end gap-1.5">
					{ELIGIBILITY.filter((e) => section[e.key]).map((e) => (
						<span key={e.key} className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${e.color}`}>
							{e.label}
						</span>
					))}
				</div>
			</div>
			<div className="mt-3 flex items-center gap-4 border-t border-gray-100 pt-2 text-xs text-gray-500">
				<span>
					<strong className="text-gray-700">{section.registered}</strong>/{section.sectionSize} enrolled
				</span>
			</div>
		</div>
	);
}

function ReligionLookup() {
	const navigate = useNavigate();
	const countries = useMemo(() => getSupportedCountries(), []);

	useEffect(() => {
		const previous = document.title;
		document.title = "Religion Course Finder";
		return () => {
			document.title = previous;
		};
	}, []);

	const [course, setCourse] = useState("");
	const [term, setTerm] = useState("");
	const [country, setCountry] = useState("");
	const [region, setRegion] = useState(""); // CMIS sub-area for multi-area countries (US)
	const [zone, setZone] = useState("");
	const [eligibleOnly, setEligibleOnly] = useState(true);
	const [allAreas, setAllAreas] = useState(false); // show sections from every CMIS area

	const areaInfo = useMemo(() => (country ? getAreasForCountry(country) : { areas: [], multi: false }), [country]);
	const zones = useMemo(() => (country ? getZonesForCountry(country) : []), [country]);

	const courseOptions = useMemo(
		() => data.courses.map((c) => ({ value: c.course, label: `${c.course} — ${c.name}` })),
		[]
	);
	const termOptions = useMemo(() => data.terms.map((t) => ({ value: t, label: TERM_LABELS[t] || t })), []);
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

	// In all-areas mode the region/area is irrelevant, so it isn't required.
	const ready =
		course && term && country && zone && (allAreas || selectedAreas.length > 0);

	const eligibleKey = ELIGIBILITY.find((e) => e.studentType === studentType)?.key;

	// Sections matching course/term (+ area unless all-areas), before the
	// eligibility toggle is applied.
	const baseMatches = useMemo(() => {
		if (!ready) return [];
		return data.sections.filter(
			(s) =>
				s.active &&
				s.course === course &&
				s.term === term &&
				(allAreas || selectedAreas.includes(s.area))
		);
	}, [ready, course, term, selectedAreas, allAreas]);

	// The eligibility toggle only does something if some matching section is
	// actually closed to this student type — otherwise it's a no-op, so hide it.
	const hasIneligible = useMemo(
		() => !!eligibleKey && baseMatches.some((s) => !s[eligibleKey]),
		[baseMatches, eligibleKey]
	);

	const results = useMemo(() => {
		const filtered =
			eligibleOnly && eligibleKey ? baseMatches.filter((s) => s[eligibleKey]) : baseMatches;
		const timeOrder = (s) => ((s.utcDay + 6) % 7) * 24 + s.utcHour;
		return filtered
			.map((s) => ({ section: s, local: convertSectionToLocal(s, zone, term) }))
			.sort((a, b) => {
				// In all-areas mode group by area first, then by local weekday/time.
				if (allAreas && a.section.area !== b.section.area) {
					return a.section.area.localeCompare(b.section.area);
				}
				return timeOrder(a.section) - timeOrder(b.section);
			});
	}, [baseMatches, eligibleOnly, eligibleKey, zone, term, allAreas]);

	const courseName = data.courses.find((c) => c.course === course)?.name;
	const refDate = term ? TERM_REFERENCE_DATES[term] : null;

	return (
		<div className="min-h-screen bg-gray-50 text-gray-900 antialiased">
			<main className="mx-auto max-w-4xl px-4 pb-24 pt-8 sm:px-6">
				{/* Header */}
				<div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<h1 className="text-3xl font-black tracking-tight text-blue-700">Religion Course Finder</h1>
						<p className="mt-1 text-sm text-gray-500">
							Internal tool — locate religion sections by course, term, and area, with gathering
							times converted to the destination's local time.
						</p>
					</div>
					<div className="flex flex-col items-start gap-3 sm:items-end">
						<button
							onClick={() => navigate("/")}
							className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50"
						>
							← Back to Calculator
						</button>
						<Toggle checked={allAreas} onChange={setAllAreas} label="Show sections from all areas" />
					</div>
				</div>

				{/* Selection panel */}
				<div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
						<Field label="Course">
							<SearchSelect
								options={courseOptions}
								value={course}
								onChange={setCourse}
								placeholder="Search a course…"
							/>
						</Field>

						<Field label="Term">
							<SearchSelect
								options={termOptions}
								value={term}
								onChange={setTerm}
								placeholder="Select a term…"
							/>
						</Field>

						<Field label="Destination Country">
							<SearchSelect
								options={countryOptions}
								value={country}
								onChange={handleCountry}
								placeholder="Search a country…"
							/>
						</Field>

						{areaInfo.multi && !allAreas && (
							<Field label="Region (CMIS Area)" hint="This country spans several CMIS areas — pick one.">
								<SearchSelect
									options={regionOptions}
									value={region}
									onChange={setRegion}
									placeholder="Select a region…"
								/>
							</Field>
						)}

						{zones.length > 1 && (
							<Field label="Time Zone" hint="This country has multiple time zones.">
								<SearchSelect
									options={zoneOptions}
									value={zone}
									onChange={setZone}
									placeholder="Select a time zone…"
								/>
							</Field>
						)}
					</div>

					{ready && hasIneligible && (
						<label className="mt-4 flex items-center gap-2 text-sm text-gray-600">
							<input
								type="checkbox"
								checked={eligibleOnly}
								onChange={(e) => setEligibleOnly(e.target.checked)}
								className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
							/>
							Only sections open to {studentType} students
						</label>
					)}
				</div>

				{/* Results */}
				<div className="mt-8">
					{!ready ? (
						<div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center text-gray-400">
							Select a course, term, and destination country to locate sections.
						</div>
					) : results.length === 0 ? (
						<div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center text-gray-500">
							No active sections found for {course} in {term}
							{allAreas ? " across all areas." : " for the selected area."}
						</div>
					) : (
						<>
							<div className="mb-3 flex items-baseline justify-between">
								<h2 className="text-lg font-bold text-gray-800">
									{results.length} section{results.length === 1 ? "" : "s"} — {course}
									{courseName ? ` (${courseName})` : ""}
									{allAreas ? " · all areas" : ""}
								</h2>
							</div>
							<p className="mb-4 text-xs text-gray-400">
								Times shown in the destination's local zone ({zone}), computed for the term's reference week
								{refDate ? ` of ${refDate}` : ""}. Daylight-saving time is applied automatically.
							</p>
							<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
								{results.map(({ section, local }) => (
									<SectionCard key={section.section + section.area} section={section} local={local} />
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
