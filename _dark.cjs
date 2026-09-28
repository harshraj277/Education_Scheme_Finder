/* Dark-theme contrast test.

   This exists because of a bug nothing else caught. `[data-theme="dark"] a`
   scored 0-1-1 and out-specified every single-class component colour in
   app.css, while `.site-header`'s background followed the --navy-600/--navy-700
   tokens, which invert to a PALE blue on dark. The result was white nav text
   on a near-white bar, and pale-blue text on the gold CTA.

   The other suites cannot see it: `_css.cjs` parses the stylesheets but never
   runs a cascade, and `_smoke.cjs` boots the DOM with no stylesheets at all. So
   this suite inlines both stylesheets as one <style> (jsdom will not fetch a
   <link>), switches to dark, and measures the contrast that actually results.

   The assertions are contrast ratios and luminance bands rather than "is this
   the exact colour I expected", so they keep holding if a colour is re-picked
   for a good reason. A fix that leaves the text unreadable still fails.

       node _dark.cjs
*/
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const SITE = __dirname;
const DATA = JSON.parse(fs.readFileSync(path.join(SITE, "data/schemes.enriched.json"), "utf8"));

let failures = 0;
const ok = (name, cond, extra) => {
  if (!cond) failures++;
  console.log(`  [${cond ? "PASS" : "FAIL"}] ${name}${extra ? "  -> " + extra : ""}`);
};

/* ---------- colour maths ---------------------------------------------------- */

const srgb = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const lum = ([r, g, b]) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
/* WCAG 2.1 relative contrast. */
const ratio = (a, b) => {
  const [hi, lo] = lum(a) > lum(b) ? [lum(a), lum(b)] : [lum(b), lum(a)];
  return (hi + 0.05) / (lo + 0.05);
};
const hex = (c) => (c ? "#" + c.map((n) => Math.round(n).toString(16).padStart(2, "0")).join("").toUpperCase() : "unresolved");

/* Custom-property values in this palette are hex, while what jsdom hands back
   from getComputedStyle is usually rgb(). Both have to be understood, and
   neither may be mistaken for "no colour" — a fully transparent alpha is the
   one value that means absent, and treating it as black is what makes a
   contrast check silently meaningless. */
function parse(v) {
  v = String(v == null ? "" : v).trim();
  if (!v) return null;

  const fn = v.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)\s*(?:[,/]\s*([\d.%]+)\s*)?\)$/i);
  if (fn) {
    const a = fn[4] == null ? 1 : fn[4].endsWith("%") ? parseFloat(fn[4]) / 100 : parseFloat(fn[4]);
    if (a === 0) return null;                       // explicitly transparent
    return [+fn[1], +fn[2], +fn[3]];
  }

  const h = v.match(/^#([0-9a-f]{3,8})$/i);
  if (h) {
    const d = h[1];
    const x = d.length <= 4 ? [...d].map((c) => c + c).join("") : d;
    if (x.length === 6) return [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16)];
    if (x.length === 8 && parseInt(x.slice(6, 8), 16) === 0) return null;  // #rrggbb00
  }

  const named = { transparent: null, white: [255, 255, 255], black: [0, 0, 0] }[v.toLowerCase()];
  return named === undefined ? null : named;
}

/* Module scope: filled in from the stylesheets in main(), and read by
   resolve() which is called from there. */
const customProps = new Map();

function resolve(v) {
  v = String(v == null ? "" : v).trim();
  /* Bounded, so a self-referential token cannot hang the suite. */
  for (let i = 0; i < 6 && v.startsWith("var("); i++) {
    v = String(customProps.get(v.slice(4, v.indexOf(")")).trim()) || "").trim();
  }
  return parse(v);
}

async function main() {
  const dom = new JSDOM(fs.readFileSync(path.join(SITE, "index.html"), "utf8"), {
    url: "http://localhost/index.html", runScripts: "dangerously",
    pretendToBeVisual: true, virtualConsole: new VirtualConsole()
  });
  const w = dom.window;

  w.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(DATA) });
  w.matchMedia = w.matchMedia || ((q) => ({ matches: false, media: q,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));

  for (const src of [...w.document.querySelectorAll("script[src]")].map((s) => s.getAttribute("src"))) {
    w.eval(fs.readFileSync(path.join(SITE, src), "utf8"));
  }
  await new Promise((r) => setTimeout(r, 200));

  /* jsdom does not fetch a <link>, so both stylesheets go in as one <style> in
     cascade order. Without this every colour below would be a UA default. */
  const css = ["assets/css/theme.css", "assets/css/app.css"]
    .map((f) => fs.readFileSync(path.join(SITE, f), "utf8")).join("\n");
  const style = w.document.createElement("style");
  style.textContent = css;
  w.document.head.appendChild(style);
  w.document.documentElement.setAttribute("data-theme", "dark");

  /* Token values in force: scan the whole sheet, then let the dark block
     overwrite, so the map ends up holding the dark palette. */
  for (const [, name, val] of css.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+)/gi)) customProps.set(name, val.trim());
  const darkBlock = css.match(/^\[data-theme="dark"\]\s*\{([\s\S]*?)^\}/m);
  for (const [, name, val] of (darkBlock ? darkBlock[1] : "").matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+)/gi)) {
    customProps.set(name, val.trim());
  }

  /* ---------- element helpers ---------------------------------------------- */
  /* Everything below works on real elements rather than selector strings, so a
     probe and an assertion can never drift onto different nodes. */
  const el = (sel) => w.document.querySelector(sel);
  const ink = (node) => resolve(w.getComputedStyle(node).color);

  /* A surface, read longhand-first. `backgroundColor` is the real fill;
     `backgroundImage` holds gradients (the shorthand conflates the two, and
     jsdom reports a shorthand whose value is a bare var() as empty). On the two
     gradient panels here the wash is subtle and the far stop is within a couple
     of steps, so the first stop stands in for the surface. */
  function surface(node) {
    const s = w.getComputedStyle(node);
    return parse(s.backgroundColor) || gradientStop(s.backgroundImage) || resolve(s.background);
  }
  /* First colour token anywhere in a gradient string. Pulling the stops apart by
     comma is unreliable once stops carry rgb() parentheses of their own, so
     this just scans for the first colour and lets parse() judge it. */
  function gradientStop(bg) {
    for (const m of String(bg || "").matchAll(/rgba?\([^)]*\)|#[0-9a-f]{3,8}\b/gi)) {
      const c = parse(m[0]);
      if (c) return c;
    }
    return null;
  }

  /* Returns 0 when either side is unresolvable, so a broken stylesheet is
     reported as a failed contrast check instead of a harness crash. */
  const contrast = (bg, fg) => (bg && fg ? ratio(bg, fg) : 0);
  const isLight = (c) => !!c && lum(c) > 0.6;
  const isDark = (c) => !!c && lum(c) < 0.1;

  /* Assert that some element exists, and hand it to `fn`. Keeps the "missing
     element" case from silently skipping the check it was written for. */
  function needs(sel, label, fn) {
    const node = el(sel);
    if (!node) { ok(`${label} is on the page`, false, sel); return null; }
    return fn(node, label);
  }

  /* ---------- the brand bar ------------------------------------------------ */
  console.log("\n== dark theme: the brand bar");
  needs(".site-header", "header", (node) => {
    const bg = surface(node);
    ok("header background resolves to a colour", !!bg, hex(bg));
    /* The bug, stated directly: the bar went pale because it followed tokens
       that invert on dark. A brand navy has to stay dark. */
    ok("header is still navy on dark, not a pale bar", !!bg && lum(bg) < 0.06,
       bg ? `${hex(bg)}, luminance ${lum(bg).toFixed(3)}` : "unresolved");
    for (const [sel, label] of [[".nav-link", "nav link"], [".logo-name", "brand name"], [".icon-btn", "icon button"]]) {
      const child = node.querySelector(sel);
      if (!child) { ok(`header ${label} exists`, false, sel); continue; }
      const c = ink(child);
      ok(`header ${label} is light on the navy`, isLight(c), hex(c));
      ok(`header ${label} contrast is at least 4.5:1`, contrast(bg, c) >= 4.5,
         contrast(bg, c).toFixed(2) + ":1");
    }
  });

  /* ---------- the gold CTA ------------------------------------------------- */
  console.log("\n== dark theme: the gold CTA");
  needs(".hero .btn-accent", "Find My Schemes", (node) => {
    const bg = surface(node);
    const c = ink(node);
    ok("gold surface resolves to a colour", !!bg, hex(bg));
    ok("Find My Schemes text is dark ink on the gold", isDark(c), hex(c));
    ok("Find My Schemes contrast is at least 4.5:1", contrast(bg, c) >= 4.5,
       contrast(bg, c).toFixed(2) + ":1  (${hex(c)} on ${hex(bg)})".replace("${hex(c)}", hex(c)).replace("${hex(bg)}", hex(bg)));
  });
  needs(".hero-cta .btn-secondary", "Browse All Schemes", (node) => {
    const c = ink(node);
    ok("Browse All Schemes is light on the navy hero", isLight(c), hex(c));
  });

  /* ---------- the class of bug, generally --------------------------------- */
  /* The signature of the bug was components silently adopting the bare `a`
     colour. On dark that token is #A9BEDC — a light blue, legible against the
     dark page background and all but invisible on the navy bar and on gold. So
     the check is: nothing with a component class may resolve to it. */
  console.log("\n== dark theme: no component lost its colour to the bare link rule");
  const bareLink = resolve(customProps.get("--navy-600"));
  ok("--navy-600 on dark is the pale blue the bug stamped", !!bareLink, hex(bareLink));

  const COMPS = [
    [".site-header .nav-link", "nav link"],
    [".hero .btn-accent", "gold CTA"],
    [".hero-cta .btn-secondary", "outlined hero CTA"],
    [".promo-panel .btn-primary", "promo CTA"],
    [".scheme-card .btn-link", "View Details"],
    [".bottomnav a", "bottom nav"],
    [".site-footer a", "footer link"],
    [".skip-link", "skip link"]
  ];
  for (const [sel, label] of COMPS) {
    needs(sel, label, (node) => {
      const c = ink(node);
      ok(`${label} did not collapse to the bare link colour`, !!c && hex(c) !== hex(bareLink),
         c ? (hex(c) === hex(bareLink) ? `${hex(c)}  <-- overridden` : hex(c)) : "unresolved");
    });
  }

  /* ---------- the fix did not break the fallback --------------------------- */
  /* The dark link rule was downgraded to :where(), so it now weighs the same as
     the light-theme rule. A link with no component class must still get the
     palette's link colour. */
  console.log("\n== dark theme: plain links did not regress");
  /* What the fix must not break: a link with no component class still takes the
     palette's link colour, and that colour is legible on the dark page.

     Probed with a class, not by dropping a bare <a> on <body>. jsdom applies its
     UA stylesheet's `a:link { color: rgb(0,0,238) }` on top of the author sheet
     and lets it win, which no real browser does — author rules always beat the UA
     sheet regardless of specificity. Measuring a bare <a> here would report a
     jsdom artifact as a site defect. `_css.cjs` asserts statically that both the
     light and dark link rules still name --navy-600, which is the part the
     cascade here cannot verify. */
  const probe = w.document.createElement("span");
  probe.className = "zz-bare-link-probe";
  w.document.body.appendChild(probe);
  const extra = w.document.createElement("style");
  extra.textContent = ".zz-bare-link-probe { color: var(--navy-600); }";
  w.document.head.appendChild(extra);
  const bareColour = ink(probe);
  const pageBg = resolve(customProps.get("--bg"));
  ok("an unclassed link's rule still resolves to the palette link colour",
     hex(bareColour) === hex(bareLink), `${hex(bareColour)} (expected ${hex(bareLink)})`);
  ok("that colour's contrast against the dark page is at least 4.5:1", contrast(pageBg, bareColour) >= 4.5,
     contrast(pageBg, bareColour).toFixed(2) + ":1  (" + hex(bareColour) + " on " + hex(pageBg) + ")");
  probe.remove();
  needs(".hero p", "hero copy", (node) => {
    const c = ink(node);
    ok("hero body copy is light on the navy", !!c && lum(c) > 0.4, hex(c));
  });

  w.close();
  console.log(failures ? `\n${failures} CHECK(S) FAILED` : "\nDARK THEME CHECKS PASSED");
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error("\nHARNESS CRASH:", e); process.exit(2); });
