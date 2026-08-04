import { DateTime } from "luxon";
import ct from "countries-and-timezones";
import countryAreaData from "../data/countryToCmisArea.json";

const COUNTRY_AREA_MAP = countryAreaData.map;

/**
 * Religion gatherings recur weekly, so the source data gives a weekday + UTC
 * hour but no calendar date. DST-correct conversion needs a concrete instant,
 * so we anchor each term to a representative week. These dates only affect
 * whether the destination zone is in daylight-saving time, so month-level
 * accuracy is enough — but confirm them against the official BYU-Pathway
 * academic calendar and adjust if a term straddles a DST transition.
 *
 * Any date within the term works; we snap to that week's Monday internally.
 */
export const TERM_REFERENCE_DATES = {
  "26B3": "2026-09-21",
  "26B4": "2026-11-09",
  "26B5": "2027-01-11",
};

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** ISO weekday (1=Mon..7=Sun) of the section's UTC gathering, Monday-based. */
function mondayHourOfWeek(section) {
  // section.utcDay: 0=Sun..6=Sat. Convert to Monday-based day index (Mon=0..Sun=6).
  const mondayDay = (section.utcDay + 6) % 7;
  return mondayDay * 24 + section.utcHour;
}

/** The UTC instant of this section's gathering within the term's reference week. */
function sectionUtcInstant(section, termCode) {
  const ref = TERM_REFERENCE_DATES[termCode] || TERM_REFERENCE_DATES["26B3"];
  const mondayUtc = DateTime.fromISO(ref, { zone: "utc" }).startOf("week");
  return mondayUtc.plus({ hours: mondayHourOfWeek(section), minutes: section.utcMinute || 0 });
}

/**
 * Returns the non-deprecated IANA time zones for a country code, each with a
 * human label and current example offset. Sorted by offset.
 */
export function getZonesForCountry(countryCode) {
  const country = ct.getCountry(countryCode);
  if (!country) return [];
  const zones = country.timezones
    .map((name) => ct.getTimezone(name))
    .filter((z) => z && !z.deprecated);
  // Fall back to including deprecated if filtering left nothing.
  const list = zones.length ? zones : country.timezones.map((n) => ct.getTimezone(n)).filter(Boolean);
  const seen = new Set();
  return list
    .filter((z) => (seen.has(z.name) ? false : seen.add(z.name)))
    .sort((a, b) => a.utcOffset - b.utcOffset)
    .map((z) => ({
      name: z.name,
      label: `${z.name.replace(/_/g, " ")} (${z.utcOffsetStr})`,
    }));
}

/**
 * Resolves a country code to its CMIS area(s). Returns:
 *   { areas: string[], multi: boolean }
 * `multi` is true when the user must pick a sub-region (e.g. the United States).
 */
export function getAreasForCountry(countryCode) {
  const value = COUNTRY_AREA_MAP[countryCode];
  if (!value) return { areas: [], multi: false };
  if (Array.isArray(value)) return { areas: value, multi: true };
  return { areas: [value], multi: false };
}

/** Sorted [{ code, name }] of all countries we can map to a CMIS area. */
export function getSupportedCountries() {
  const all = ct.getAllCountries();
  return Object.keys(COUNTRY_AREA_MAP)
    .map((code) => ({ code, name: all[code]?.name || code }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Converts a section's weekly UTC gathering time into the local time of the
 * given IANA zone, DST-aware for the term's reference week.
 *
 * Returns null, or:
 *   { dayName, time, formatted, zoneAbbr, offset, crossesDay,
 *     weekdayIndex, hour, minuteOfWeek }
 *
 * `weekdayIndex` (0=Mon..6=Sun) groups results by the *local* day and
 * `minuteOfWeek` sorts them — the UTC weekday can't do either, because a
 * gathering lands on a different day for the student than it does in UTC.
 */
export function convertSectionToLocal(section, zoneName, termCode) {
  if (!zoneName) return null;
  const instant = sectionUtcInstant(section, termCode);
  const local = instant.setZone(zoneName);
  if (!local.isValid) return null;
  const dayName = DAY_NAMES[local.weekday % 7]; // luxon weekday 7=Sun -> index 0
  const time = local.toFormat("h:mm a");
  const zoneAbbr = local.toFormat("ZZZZ");
  const offset = local.toFormat("ZZ");
  return {
    dayName,
    time,
    formatted: `${dayName} ${time} ${zoneAbbr}`,
    zoneAbbr,
    offset,
    crossesDay: dayName !== DAY_NAMES[section.utcDay],
    weekdayIndex: local.weekday - 1,
    hour: local.hour,
    minuteOfWeek: (local.weekday - 1) * 1440 + local.hour * 60 + local.minute,
  };
}
