#!/usr/bin/env node
/**
 * Converts docs/Book2.xlsx (religion course section schedule) into
 * src/data/religionSections.json for the /religion lookup view.
 *
 * Re-run whenever the spreadsheet is updated:
 *   node scripts/convertReligionData.mjs [path/to/Book2.xlsx]
 *
 * No xlsx dependency: unzips the workbook with the system `unzip` and parses
 * the SpreadsheetML XML directly (same approach validated against the file).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const xlsxPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(repoRoot, "docs", "Book2.xlsx");
const outPath = path.join(repoRoot, "src", "data", "religionSections.json");

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Collapse inconsistent area spellings coming out of the source data.
const AREA_ALIASES = {
  "Middle East Africa North": "Middle East/Africa North",
};
const normalizeArea = (a) => AREA_ALIASES[a] || a;

function unzipWorkbook(file) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "religion-xlsx-"));
  execFileSync("unzip", ["-o", file, "-d", dir], { stdio: "ignore" });
  return dir;
}

function readSharedStrings(dir) {
  const xml = fs.readFileSync(path.join(dir, "xl", "sharedStrings.xml"), "utf8");
  const strings = [];
  const re = /<si>(.*?)<\/si>/gs;
  let m;
  while ((m = re.exec(xml))) {
    const ts = [...m[1].matchAll(/<t[^>]*>(.*?)<\/t>/gs)].map((x) => x[1]);
    strings.push(decode(ts.join("")));
  }
  return strings;
}

function decode(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#10;/g, "\n")
    .replace(/&#39;/g, "'");
}

function colNum(ref) {
  let n = 0;
  for (const c of ref.match(/^[A-Z]+/)[0]) n = n * 26 + (c.charCodeAt(0) - 64);
  return n;
}

function readRows(dir, strings) {
  const xml = fs.readFileSync(path.join(dir, "xl", "worksheets", "sheet1.xml"), "utf8");
  const rows = [...xml.matchAll(/<row[^>]*>(.*?)<\/row>/gs)];
  return rows.map((r) => {
    const cells = [
      ...r[1].matchAll(
        /<c r="([A-Z]+\d+)"(?:[^>]*t="([^"]*)")?[^>]*>(?:<v>(.*?)<\/v>|<is>(.*?)<\/is>)?<\/c>/gs
      ),
    ];
    const obj = {};
    for (const c of cells) {
      let v = c[3];
      if (c[2] === "s") v = strings[parseInt(v, 10)];
      else if (c[2] === "inlineStr") v = decode((c[4] || "").replace(/<t[^>]*>(.*?)<\/t>/gs, "$1"));
      obj[colNum(c[1])] = v ?? "";
    }
    return obj;
  });
}

/**
 * Parses "Thursday 05:00 PM UTC+0 (89)" -> { utcDay: 4, utcHour: 17, utcMinute: 0 }.
 * The trailing index is an hour-of-week marker (Monday 00:00 UTC = 0) and is
 * used as a fallback / cross-check.
 */
function parseUtcTime(raw) {
  if (!raw) return null;
  const m = raw.match(/^(\w+)\s+(\d{1,2}):(\d{2})\s*(AM|PM)\s*UTC([+-]\d+)(?:\s*\((\d+)\))?/i);
  if (!m) return null;
  const day = DAYS.indexOf(m[1]);
  let hour = parseInt(m[2], 10) % 12;
  if (/PM/i.test(m[4])) hour += 12;
  const minute = parseInt(m[3], 10);
  return { utcDay: day, utcHour: hour, utcMinute: minute };
}

function main() {
  if (!fs.existsSync(xlsxPath)) {
    console.error(`Spreadsheet not found: ${xlsxPath}`);
    process.exit(1);
  }
  const dir = unzipWorkbook(xlsxPath);
  const strings = readSharedStrings(dir);
  const raw = readRows(dir, strings);
  fs.rmSync(dir, { recursive: true, force: true });

  const body = raw.slice(1); // drop header
  const sections = [];
  let skipped = 0;
  for (const r of body) {
    const utc = parseUtcTime(r[14]);
    if (!utc) {
      skipped++;
      continue;
    }
    sections.push({
      term: r[1],
      courseName: r[2],
      course: r[3],
      sectionSize: Number(r[4]) || 0,
      registered: Number(r[5]) || 0,
      available: Number(r[6]) || 0,
      section: r[7],
      allowDomestic: r[8] === "1",
      allowFilipino: r[9] === "1",
      allowInternational: r[10] === "1",
      area: normalizeArea(r[12]),
      active: r[13] === "Yes",
      mountainTime: r[11], // Column K: gathering time in Mountain (UTC-6)
      utcTime: r[14], // Column N: same gathering time expressed in UTC+0
      ...utc,
    });
  }

  const terms = [...new Set(sections.map((s) => s.term))].sort();
  const areas = [...new Set(sections.map((s) => s.area))].sort();
  const courses = [...new Map(sections.map((s) => [s.course, s.courseName])).entries()]
    .map(([course, name]) => ({ course, name }))
    .sort((a, b) => a.course.localeCompare(b.course));

  const payload = {
    generatedFrom: path.basename(xlsxPath),
    terms,
    areas,
    courses,
    sections,
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(payload));
  console.log(
    `Wrote ${sections.length} sections (${skipped} skipped), ` +
      `${terms.length} terms, ${courses.length} courses, ${areas.length} areas -> ${path.relative(
        repoRoot,
        outPath
      )}`
  );
}

main();
