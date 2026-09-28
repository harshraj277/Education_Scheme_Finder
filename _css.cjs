/* Static CSS audit for the Yojana Setu restyle.
   1. braces balanced, no empty blocks
   2. every var(--x) referenced is defined
   3. comments stripped before parsing (an earlier version parsed them as
      selectors and produced 48k phantom "clashes")
   4. the restyle's load-bearing rules are actually present
*/
const fs = require("fs");
const path = require("path");
const SITE = "C:/Karan_Project_folder/Karan_Education_Scheme/site";
const FILES = ["assets/css/theme.css", "assets/css/app.css"];

const raw = FILES.map((f) => fs.readFileSync(path.join(SITE, f), "utf8")).join("\n");

let fail = 0;
const bad = (m) => { console.log("  [FAIL] " + m); fail++; };
const ok  = (m) => console.log("  [ok]   " + m);

// Strip CSS comments, replacing each with a space so that two selectors
// separated only by a comment cannot fuse into one bogus selector.
const css = raw.replace(/\/\*[\s\S]*?\*\//g, " ");

console.log("== structure");
const open = (css.match(/\{/g) || []).length;
const close = (css.match(/\}/g) || []).length;
if (open !== close) bad(`braces ${open} open / ${close} close`);
else ok(`braces balanced (${open})`);

console.log("== variables");
const defined = new Set([...css.matchAll(/(--[a-z0-9-]+)\s*:/gi)].map((m) => m[1]));
const used = new Set([...css.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)].map((m) => m[1]));
const undef = [...used].filter((v) => !defined.has(v)).sort();
if (undef.length) bad("undefined var(s): " + undef.join(", "));
else ok(`${used.size} variables used, all defined`);

/* Rule map: selector -> [{prop, order}]. Selectors are whitespace-normalised
   and split on commas, so `.a .b,\n.c .b{}` yields two entries, not one. */
const rules = new Map();
let order = 0;
/* An empty base rule is a hook for a media query below it (e.g.
   .visually-hidden-at-1100 is only ever given display:none under 1100px), so
   those are expected rather than reported. */
const EMPTY_HOOKS = new Set([".visually-hidden-at-1100"]);
const re = /([^{}]+)\{([^{}]*)\}/g;
let m;
while ((m = re.exec(css))) {
  if (m[1].includes("@")) continue;
  const body = m[2];
  const sel = m[1].split(",").map((x) => x.trim().replace(/\s+/g, " ")).filter(Boolean);
  if (!body.trim()) {
    if (sel.some((s) => EMPTY_HOOKS.has(s))) continue;
    bad(`empty rule block: ${sel.join(", ")}`);
    continue;
  }
  /* Capture the declared value as well as the property name. Presence alone
     cannot tell a circular logo from a rounded square — both declare
     border-radius — so the value has to be available for the checks below. */
  const props = [...body.matchAll(/(?:^|[;{])\s*([a-z-]+)\s*:\s*([^;]*)/gi)]
    .map((p) => ({ prop: p[1], value: p[2].trim() }));
  for (const s of sel) {
    if (!rules.has(s)) rules.set(s, []);
    for (const p of props) rules.get(s).push({ prop: p.prop, value: p.value, order: order++ });
  }
}
console.log("== parse");
ok(`${rules.size} distinct selectors parsed`);

/* Does selector `sel` declare `prop`? Matches the selector as a whole, so a
   multi-selector rule counts for each of its parts. */
const has = (sel, prop) => {
  const e = rules.get(sel);
  return !!(e && e.some((d) => d.prop === prop));
};

/* The value `sel` gives `prop`. The last declaration in source order wins, which
   is what the cascade would do for two declarations of the same property in the
   same rule. */
const value = (sel, prop) => {
  const e = rules.get(sel);
  if (!e) return null;
  const hits = e.filter((d) => d.prop === prop);
  return hits.length ? hits[hits.length - 1].value : null;
};

/* Which selector wins for `prop` among candidates? Compares class count, then
   source order. Used to assert the restyle's precedence decisions hold. */
const winner = (prop, cands) => {
  const live = cands.filter((c) => has(c, prop));
  if (!live.length) return null;
  return live.reduce((best, c) => {
    const w = (c.match(/\.[\w-]+/g) || []).length;
    const bw = (best.match(/\.[\w-]+/g) || []).length;
    if (w !== bw) return w > bw ? c : best;
    return rules.get(c).find((d) => d.prop === prop).order >
           rules.get(best).find((d) => d.prop === prop).order ? c : best;
  });
};

console.log("== load-bearing rules present");
const present = [
  [".band-navy", "background", "navy band has a background"],
  [".band-light", "background", "light band has a background"],
  [".band-navy .chip", "background", "band chips painted for navy"],
  [".band-navy .chip.is-active", "background", "active chip is not navy-on-navy"],
  [".site-header", "border-bottom", "header keeps its gold rule"],
  [".nav-link:hover", "border-bottom-color", "nav hover rule exists"],
  [".site-header .icon-btn", "color", "header icon buttons painted for navy"],
  [".site-header .logo-tag", "color", "header brand tagline painted for navy"],
  [".trust-num", "color", "trust numbers are gold on navy"],
  [".trust", "border-top", "trust rule is a translucent white line"],
  [".skip-link", "background", "skip link is gold, not navy"],
  [".card-grid", "grid-template-columns", "scheme grid is still a grid"],
  [".search-row", "display", "explore search row survived"],
  [".filter-toggle", "border-radius", "explore filter button survived"],
  [".filter-toggle.has-filters", "border-color", "filter-active state survived"],
  [".bottomnav", "position", "mobile bottom nav survived"],
  [".scheme-card", "box-shadow", "cards carry the startup shadow"],
  [".btn-accent", "background", "gold CTA survived"],
  [".nav-link", "color", "nav links painted for navy at the base rule"],
  [".hero-cta .btn-secondary", "border-color", "outlined hero CTA survived"],
  [".hero::before", "content", "hero dotted wash layer"],
  [".hero::after", "animation", "hero gold ring"],
  [".page-head", "text-align", "inner pages have a centred opening head"],
  [".hero-row", "display", "hero search bar and CTAs share a row"],
  [".hero-row__search", "flex", "the bar takes the slack, the buttons do not"],
  [".hero-row .searchbar", "max-width", "the bar's own max-width is undone in the row"],
  [".hero-row .hero-cta .btn", "min-height", "CTAs match the search field height"],
  [".eyebrow", "text-transform", "eyebrow is a standalone class"],
  [".band-navy .page-head .eyebrow", "color", "eyebrow stays legible on a band"],
  /* Card top: the long category badge used to render ~388px wide in a ~220px
     box and run over the save button. These four rules are the fix. */
  [".scheme-card__badges .badge-navy", "white-space", "card category badge is allowed to wrap"],
  [".scheme-card__badges .badge-navy", "-webkit-line-clamp", "wrapped badge is clamped to two lines"],
  [".scheme-card__badges .badge-navy", "min-width", "badge can shrink below its longest word"],
  [".save-btn", "z-index", "save button is raised above the badge row"],
  [".btn-link", "white-space", "View Details stays on one line"],
  [".btn-link", "border", "View Details is a bordered control, not a bare link"],
  [".btn-link", "flex", "View Details takes the slack in the card foot"],
  [".scheme-card__foot", "border-top", "card foot is separated from the body by a rule"],
  [".scheme-card__foot", "margin-top", "card foot is pinned to the bottom of the card"],
  [".compare-check", "flex", "compare checkbox does not shrink"],
  /* Branding: the real logo file and the institution strip. */
  [".logo-mark img", "object-fit", "the logo file fills the mark tile"],
  [".logo-mark img", "width", "the logo image is sized, not intrinsic"],
  [".footer-inst", "display", "institution strip is a flex row"],
  [".footer-inst", "border-top", "institution strip is rule-separated from the columns"],
  [".footer-inst__logo", "flex", "institution logo is not squeezed by the name"],
  [".footer-inst__logo", "object-fit", "institution logo fits its plate"],
  [".footer-inst__name", "color", "institution name is white on the footer navy"],
];
for (const [sel, prop, why] of present) (has(sel, prop) ? ok : bad)(`${why}  (${sel} { ${prop} })`);

console.log("== precedence the restyle relies on");
const w = winner("background", [".chip", ".band-navy .chip", ".chip.is-active"]);
w === ".band-navy .chip"
  ? ok("on navy, the chip paint beats the base .chip")
  : bad("expected .band-navy .chip to beat .chip, got " + w);

const w2 = winner("color", [".eyebrow", ".sec-head .eyebrow", ".band-navy .sec-head .eyebrow"]);
w2 === ".band-navy .sec-head .eyebrow"
  ? ok("band eyebrow colour wins over the generic eyebrow")
  : bad("band eyebrow loses to " + w2);

const w4 = winner("color", [".eyebrow", ".page-head .eyebrow", ".band-navy .page-head .eyebrow"]);
w4 === ".band-navy .page-head .eyebrow"
  ? ok("inner-page band eyebrow wins over the generic eyebrow")
  : bad("inner-page band eyebrow loses to " + w4);

const w3 = winner("background", [".chip.is-active", ".band-navy .chip.is-active"]);
w3 === ".band-navy .chip.is-active"
  ? ok("active chip on a band is gold, not navy")
  : bad("active chip on a band resolves to " + w3);

/* The base .badge sets white-space:nowrap for the status pill and the flags
   row. The card's category badge has to out-specify it, or the 50-character
   category string ("Scholarship - Social Category (SC/ST/OBC/Minority)")
   renders ~388px wide in a ~220px column and slides under the save button. */
const w5 = winner("white-space", [".badge", ".scheme-card__badges .badge-navy"]);
w5 === ".scheme-card__badges .badge-navy"
  ? ok("card category badge overrides .badge's nowrap")
  : bad("nowrap beats the card category badge; white-space resolves to " + w5);

console.log("== values that carry meaning, not just presence");
/* Some properties are load-bearing because of their value, not their presence.
   A circular logo and a 12px rounded square both "have" a border-radius, so a
   presence check passes either way and the shape silently regresses. */
const decl = (sel, prop, want, why) => {
  const got = value(sel, prop);
  got === want
    ? ok(`${why}  (${sel} { ${prop}: ${got} })`)
    : bad(`${why}  expected ${sel} { ${prop}: ${want} }, got ${got}`);
};
decl(".logo-mark", "border-radius", "50%", "the site logo is circular");
decl(".logo-mark", "overflow", "hidden", "the circle actually clips the image");
decl(".logo-mark", "width", "40px", "the mark stays a fixed size next to the name");
decl(".logo-mark", "height", "40px", "the mark is square, so the clip is a circle");
decl(".logo-mark img", "object-fit", "contain", "the artwork is never stretched by the clip");

console.log("== icon-only controls must size their icon");
/* `icon()` emits an SVG carrying only a viewBox — no width/height attributes.
   With nothing to size it, the default algorithm hands it the full width of its
   containing block, so the glyph runs edge to edge with no padding. Every
   icon-only button in the card needs an explicit size. */
ok("the save button sizes its icon", has(".save-btn svg", "width") && has(".save-btn svg", "height"),
   "an unsized icon fills its whole tile");
decl(".save-btn svg", "width", "15px", "the save glyph is not a full-bleed blob");
decl(".save-btn svg", "height", "15px", "the save glyph is square, like its viewBox");
decl(".save-btn", "width", "30px", "the save tile is compact");
decl(".save-btn", "height", "30px", "the save tile is square, so the border is even");
/* WCAG 2.2 SC 2.5.8 asks for 24x24 minimum. */
const saveBox = parseInt(value(".save-btn", "width"), 10);
ok("the save target still clears the 24px minimum", saveBox >= 24, `${saveBox}px`);

console.log("== the dark link rule must not out-specify component colours");
/* `[data-theme="dark"] a` scores 0-1-1. Every single-class component colour in
   app.css is 0-1-0, so a plain attribute selector here silently beat `.nav-link`,
   `.btn-accent`, `.btn-secondary` and `.skip-link` — in dark mode those lost their
   own paint and fell back to the bare link colour, which is a LIGHT blue on this
   palette. That put #A9BEDC on the gold CTA (1.01:1) and on the brand bar. The
   rule is now :where()-wrapped to 0-0-1, level with the light-theme rule beside
   it, and the rules that genuinely need to beat a component are written at 0-2-0
   and still do. */
const darkLink = ':where([data-theme="dark"]) a';
ok(`the dark link rule is specificity-zeroed  (${darkLink})`, has(darkLink, "color"));
ok("it still sets the palette link colour", value(darkLink, "color") === "var(--navy-600)");
ok("the unwrapped form is gone  ([data-theme=\"dark\"] a)", !has('[data-theme="dark"] a', "color"),
   "restoring it re-breaks the navbar and the gold CTA");
ok("component link colours out-specify it",
   winner("color", ["a", darkLink, ".nav-link"]) === ".nav-link",
   `winner for color among a / ${darkLink} / .nav-link is ${winner("color", ["a", darkLink, ".nav-link"])}`);
ok("and the gold CTA too",
   winner("color", ["a", darkLink, ".btn-accent"]) === ".btn-accent",
   `winner for color is ${winner("color", ["a", darkLink, ".btn-accent"])}`);

console.log("== fixed-navy surfaces must not follow theme-swapped tokens");
/* --navy-600/--navy-700 are remapped on dark because they mean "a blue that reads
   as text on the page background". The brand bar, the hero and the navy bands are
   not page backgrounds — they are fixed navy in both themes, and their contents
   are all painted for navy. When the bar followed the tokens it inverted to a
   pale blue while its contents stayed white, which is the bug this suite exists
   to catch. */
const INVERTING = ["--navy-600", "--navy-700"];
for (const sel of [".site-header", ".hero", ".band-navy", ".site-footer"]) {
  const v = value(sel, "background") || "";
  const used = INVERTING.filter((tok) => v.includes(`var(${tok})`));
  used.length === 0
    ? ok(`${sel} is not painted with an inverting token`)
    : bad(`${sel} background follows ${used.join(", ")} — it will go pale on dark`);
}

console.log("== no selectors left behind by removed markup");
/* The hero chip row and .chips--scroll were deleted along with it. A rule that
   styles `.hero .chip` can never match again, so it is dead weight that reads
   as though the feature still exists. The same applies to the gold underline on
   the logo tile: it was drawn for a 24px line-art glyph and was removed when
   the mark became a real image, which it would only cut across. */
const RETIRED = [
  ".chips--scroll", ".hero .chip", ".hero .chip__count",
  ".logo-mark svg", ".logo-mark::after", ".site-footer .logo-mark::after"
];
for (const sel of RETIRED) {
  rules.has(sel)
    ? bad(`${sel} is still declared in CSS but nothing renders it`)
    : ok(`${sel} fully removed`);
}

console.log(fail ? `\n${fail} FAILURE(S)` : "\nCSS AUDIT PASSED");
process.exit(fail ? 1 : 0);
