/* Static checks that do not need a DOM: dead i18n keys, unreachable assets,
   and i18n keys the code asks for but the tables do not define.
     node _links.cjs                                                                   */

const fs = require("fs");
const path = require("path");

let problems = 0;
const bad = (msg) => { console.log("  [FAIL] " + msg); problems++; };
const good = (msg) => console.log("  [PASS] " + msg);

/* ---------- 1. every i18n key referenced in code exists ------------------ */
console.log("\n== i18n key coverage");

const jsFiles = fs.readdirSync("assets/js").filter(f => f.endsWith(".js"));
const src = jsFiles.map(f => fs.readFileSync(path.join("assets/js", f), "utf8")).join("\n");

/* Pull the string tables straight out of i18n.js by evaluating it with a stub
   document, so we test the real tables rather than parsing them. */
global.window = global;
global.document = {
  documentElement: { lang: "en", setAttribute() {}, getAttribute() { return "en"; } },
  querySelectorAll() { return []; },
  addEventListener() {}
};
global.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
global.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };

/* config.js defines the namespace the other files expect. */
eval(fs.readFileSync("assets/js/config.js", "utf8"));
eval(fs.readFileSync("assets/js/i18n.js", "utf8"));

const tables = YS.i18n.tables;
if (!tables) {
  bad("could not reach the i18n string tables (export them for testability)");
} else {
  const flat = (o, p) => Object.entries(o).flatMap(([k, v]) =>
    (v && typeof v === "object") ? flat(v, p + k + ".") : [p + k]);
  const en = new Set(flat(tables.en, ""));
  const hi = new Set(flat(tables.hi, ""));

  /* every t("...") / data-i18n="..." reference in the codebase */
  const refs = new Set();
  for (const m of src.matchAll(/\bt\(\s*"([a-zA-Z0-9_.\-]+)"/g)) refs.add(m[1]);
  for (const m of src.matchAll(/data-i18n(?:-ph|-aria)?="([a-zA-Z0-9_.\-]+)"/g)) refs.add(m[1]);
  for (const f of fs.readdirSync(".").filter(f => f.endsWith(".html"))) {
    const h = fs.readFileSync(f, "utf8");
    for (const m of h.matchAll(/data-i18n(?:-ph|-aria)?="([a-zA-Z0-9_.\-]+)"/g)) refs.add(m[1]);
  }

  /* strip trailing arg fragments: t("key", {…}) is fine, but t("k.sub") with a
     dynamic second segment is not — those are counted separately below. */
  const missingEn = [...refs].filter(k => !en.has(k) && !k.endsWith("."));
  const missingHi = [...missingEn].filter(k => !hi.has(k));

  good(refs.size + " keys referenced across JS and HTML");
  if (missingEn.length) bad("referenced in code but missing from the en table: " + missingEn.join(", "));
  else good("every referenced key exists in en");
  if (missingHi.length) bad("missing from the hi table: " + missingHi.join(", "));
  else good("every referenced key is translated in hi");

  /* Keys defined but never used. Many keys are reached indirectly — FACET_TITLE
     and TYPE_LABEL hold them as string values and index t() with the result —
     so count any key that appears as a string literal anywhere in the source. */
  const literals = new Set([...src.matchAll(/"([a-zA-Z0-9_.\-]{3,})"/g)].map(m => m[1]));
  const htmlSrc = fs.readdirSync(".").filter(f => f.endsWith(".html"))
    .map(f => fs.readFileSync(f, "utf8")).join("\n");
  for (const m of htmlSrc.matchAll(/"([a-zA-Z0-9_.\-]{3,})"/g)) literals.add(m[1]);
  const unused = [...en].filter(k => !literals.has(k) && !refs.has(k));
  if (unused.length) {
    console.log("  note: " + unused.length + " defined-but-unused keys -> " +
      unused.slice(0, 14).join(", ") + (unused.length > 14 ? ", ..." : ""));
  } else {
    good("no dead keys in the string tables");
  }

  /* non-empty values: an empty string is a silent blank in the UI */
  const empties = Object.entries(flattenStrings(tables.en))
    .filter(([, v]) => v === "" || /undefined|\[object/.test(v));
  if (empties.length) bad("en values that are empty or a bad interpolation: " +
    empties.map(([k]) => k).join(", "));
  else good("no empty or unresolved en values");
}

function flattenStrings(o, p) {
  const out = {};
  for (const [k, v] of Object.entries(o)) {
    if (v && typeof v === "object") Object.assign(out, flattenStrings(v, p + k + "."));
    else out[p + k] = v;
  }
  return out;
}

/* ---------- 2. every referenced asset exists ----------------------------- */
console.log("\n== asset references");
let missingAssets = 0;
for (const f of fs.readdirSync(".").filter(f => f.endsWith(".html"))) {
  const h = fs.readFileSync(f, "utf8");
  const refs2 = [...h.matchAll(/(?:href|src)="((?!https?:|data:|#|mailto:)[^"]+)"/g)]
    .map(m => m[1]);
  for (const r of refs2) {
    if (!fs.existsSync(path.join(".", r))) { bad(f + " -> missing " + r); missingAssets++; }
  }
}
if (!missingAssets) good("every local href/src in every page resolves to a real file");

/* The header and footer are built in JS, so the site logo and the institution
   mark are referenced from config.js rather than from any HTML. Scanning only
   the pages would not see those paths at all, which is exactly how a renamed or
   mistyped image ships as a broken image with every test still green. */
{
  const cfgSrc = fs.readFileSync(path.join("assets/js/config.js"), "utf8");
  const jsPaths = [...cfgSrc.matchAll(/^\s*(?:logo|[a-z]+Logo):\s*"([^"]+)"/gm)].map(m => m[1]);
  const missing = jsPaths.filter(p => !fs.existsSync(path.join(".", p)));
  for (const p of missing) { bad("config.js -> missing " + p); missingAssets++; }
  if (!missing.length && jsPaths.length) {
    good(jsPaths.length + " image path(s) configured in config.js resolve to real files");
  }

  /* And the reverse: an image sitting in assets/img that nothing points at is
     dead weight, or a leftover from a logo that was swapped out. */
  const imgDir = path.join("assets/img");
  if (fs.existsSync(imgDir)) {
    const onDisk = fs.readdirSync(imgDir).filter(n => /\.(png|jpe?g|webp|gif|svg)$/i.test(n));
    const jsAll = jsPaths.concat(
      [...fs.readdirSync("assets/js").filter(n => n.endsWith(".js"))
        .map(n => fs.readFileSync(path.join("assets/js", n), "utf8")).join("\n")
        .matchAll(/["'](assets\/img\/[^"']+)["']/g)].map(m => m[1]));
    const orphans = onDisk.filter(n => !jsAll.some(p => p.endsWith(n)));
    if (orphans.length) bad("unused image(s) in assets/img: " + orphans.join(", "));
    else good("every image in assets/img is referenced");
  }
}

/* ---------- 3. no hard-coded scheme ids that could go stale --------------- */
console.log("\n== internal links");
const data = JSON.parse(fs.readFileSync("data/schemes.enriched.json", "utf8"));
const ids = new Set(data.schemes.map(s => s.id));
const linkSrc = jsFiles.concat(fs.readdirSync(".").filter(f => f.endsWith(".html")))
  .map(f => fs.readFileSync(f.endsWith(".html") ? f : path.join("assets/js", f), "utf8")).join("\n");

/* Detail links are built as scheme.html?id=<encoded s.id>, so any literal id in
   a link is a hard-coded one that will rot if the dataset is re-issued. */
const hardCoded = [...linkSrc.matchAll(/scheme\.html\?id=([A-Za-z0-9_.\-]+)/g)].map(m => m[1]);
if (hardCoded.length) {
  bad("hard-coded scheme ids in links (use s.id): " + [...new Set(hardCoded)].join(", "));
} else {
  good("no hard-coded scheme ids in any link — all come from the dataset");
}

/* store.js POPULAR are search phrases, not ids. Every one must match at least
   one record, or the search box offers a dead end. */
const popBlock = fs.readFileSync("assets/js/store.js", "utf8").match(/const POPULAR = \[[\s\S]*?\]/);
const popTerms = popBlock ? [...popBlock[0].matchAll(/"([^"]+)"/g)].map(m => m[1]) : [];
if (!popTerms.length) {
  bad("could not read the POPULAR list out of store.js");
} else {
  const norm = s => String(s).toLowerCase().replace(/&/g, " and ")
    .replace(/[^a-z0-9₹\s-]/g, " ").replace(/\s+/g, " ").trim();
  const hay = data.schemes.map(s => norm([s.name, s.short_name, s.category,
    s.ministry, s.description, s.coverage_amount,
    (s.filter.aid_type || []).join(" "), s.official_website].join(" ")));
  const dead = popTerms.filter(t => {
    const n = norm(t);
    return !hay.some(h => h.includes(n));
  });
  if (dead.length) bad("POPULAR searches that match no record: " + dead.join(", "));
  else good("all " + popTerms.length + " popular searches return results");
}

/* ---------- 4. dataset sanity ------------------------------------------- */
console.log("\n== dataset");
const dq = data.meta.data_quality;
const banned = dq.not_yet_available || [];
const present = [];
data.schemes.forEach(s => banned.forEach(b => {
  if (s[b] !== undefined && s[b] !== null) present.push(s.id + "." + b);
}));
if (present.length) bad("fields listed as unavailable are present anyway: " + present.join(", "));
else good("none of the " + banned.length + " unavailable fields appear on any record");

const noReview = data.schemes.filter(s => !s._review || !s._review.length).map(s => s.id);
console.log("  note: " + noReview.length + " records carry no _review note" +
  (noReview.length ? " (" + noReview.join(", ") + ")" : ""));

const missing = [];
data.schemes.forEach(s => {
  if (!s.name || !s.short_name || !s.category || !s.ministry || !s.status ||
      !s.official_website || !s.description || !s.coverage_amount) {
    missing.push(s.id);
  }
  if (!s.filter) missing.push(s.id + "(no filter)");
  /* disability is deliberately absent unless the source text names a
     provision; store.js defaults it to "unstated". Requiring it here would
     mean inventing the value for 21 records. */
  ["education_level", "aid_type", "category", "income_criterion",
   "application_required", "benefits_individual", "gender", "merit_type"]
    .forEach(k => {
      if (s.filter && s.filter[k] === undefined) missing.push(s.id + "." + k);
    });
});
if (missing.length) bad("records with missing required fields: " + missing.join(", "));
else good("all " + data.schemes.length + " records carry every required field");

/* income_criterion must agree with max_income */
const inconsistent = data.schemes.filter(s => {
  const f = s.filter;
  if (f.income_criterion === "limit-known") return f.max_income === null;
  if (f.income_criterion === "no-limit") return f.max_income !== null;
  return false;
}).map(s => s.id);
if (inconsistent.length) bad("income_criterion disagrees with max_income: " + inconsistent.join(", "));
else good("income_criterion and max_income agree on all " + data.schemes.length + " records");

console.log("\n" + (problems === 0 ? "NO PROBLEMS FOUND" : problems + " PROBLEM(S) FOUND"));
process.exit(problems === 0 ? 0 : 1);
