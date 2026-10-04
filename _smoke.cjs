/* Headless smoke test: boots every page in jsdom against the real dataset,
   asserts the DOM rendered, and prints a summary. Run from the site folder:
     node _smoke.js                                                  */

const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const SITE = __dirname;
const DATA = JSON.parse(fs.readFileSync(path.join(SITE, "data/schemes.enriched.json"), "utf8"));

let failures = 0;
function ok(name, cond, extra) {
  const mark = cond ? "PASS" : "FAIL";
  if (!cond) failures++;
  console.log(`  [${mark}] ${name}${extra ? "  -> " + extra : ""}`);
}
function section(s) { console.log("\n== " + s); }

/* Explore is paginated at 9 cards, so the number of .scheme-card nodes on screen
   is no longer a proxy for "how many results matched" -- it saturates at 9.
   Anything reasoning about filter behaviour must read the total out of the count
   line instead, which is also what a user reads. */
function resultTotal(doc) {
  const m = (doc.querySelector("#resultCount") || {}).textContent || "";
  const hit = m.match(/(\d[\d,]*)\s*(?:योजन|schemes?)/i);
  return hit ? Number(hit[1].replace(/,/g, "")) : NaN;
}
function cardCount(doc) {
  return doc.querySelectorAll("#results .scheme-card").length;
}

/* ---------- dataset sanity ------------------------------------------------ */
section("dataset");
ok("103 schemes", DATA.schemes.length === 103, DATA.schemes.length);
ok("every record has filter", DATA.schemes.every(s => s.filter));
ok("every record has _review array", DATA.schemes.every(s => Array.isArray(s._review)));
ok("every record has official_website",
  DATA.schemes.every(s => /^https?:\/\//.test(s.official_website || "")));
ok("no fabricated deadlines", DATA.schemes.every(s => s.application_deadline === undefined));
ok("no fabricated documents", DATA.schemes.every(s => s.documents_required === undefined));
ok("no fabricated helplines", DATA.schemes.every(s => s.helpline === undefined));
ok("no fabricated verified dates", DATA.schemes.every(s => s.last_verified_date === undefined));
ok("vocab has income bands", (DATA.filter_vocabulary.income_bands || []).length >= 5);

/* ---------- boot a page ---------------------------------------------------- */
async function boot(page, opts) {
  const o = opts || {};
  const html = fs.readFileSync(path.join(SITE, page), "utf8");
  const errors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", e => errors.push(e.message));
  vc.on("error", (...a) => errors.push(String(a[0])));

  const dom = new JSDOM(html, {
    url: o.url || ("http://localhost/" + page),
    runScripts: "dangerously",
    resources: undefined,
    pretendToBeVisual: true,
    virtualConsole: vc
  });
  const w = dom.window;

  /* jsdom does not fetch; intercept the JSON and serve it from disk. */
  w.fetch = () => Promise.resolve({
    ok: true, status: 200,
    json: () => Promise.resolve(JSON.parse(JSON.stringify(DATA)))
  });
  w.matchMedia = w.matchMedia || (q => ({
    matches: false, media: q,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}
  }));

  /* Load the scripts by hand, in the order the HTML declares them. */
  const scripts = [...w.document.querySelectorAll("script[src]")].map(s => s.getAttribute("src"));
  for (const src of scripts) {
    const code = fs.readFileSync(path.join(SITE, src), "utf8");
    try { w.eval(code); }
    catch (e) { errors.push(src + ": " + e.message); }
  }

  /* Fonts / stylesheet requests are ignored; wait for the data promise chain. */
  await new Promise(r => setTimeout(r, 120));
  return { dom, w, errors, doc: w.document };
}

/* ---------- pages ------------------------------------------------------------------ */

async function main() {

/* ---------- home ---------------------------------------------------------- */
section("index.html");
{
  const { w, errors, doc } = await boot("index.html");
  ok("no JS errors", errors.length === 0, errors.join(" | "));
  ok("header rendered", !!doc.querySelector(".site-header"));
  ok("footer rendered", !!doc.querySelector(".site-footer"));
  ok("bottom nav rendered", doc.querySelectorAll(".bottomnav a").length === 5);
  ok("hero search rendered", !!doc.querySelector("#heroSearch input"),
     "#heroSearch len=" + doc.querySelector("#heroSearch").innerHTML.length +
     " featured=" + doc.querySelector("#featuredGrid").textContent.slice(0, 120));
  /* The hero no longer carries a category chip row. Assert that, so a stale
     <nav> left behind in the markup cannot come back unnoticed. */
  ok("hero has no chip row", !doc.querySelector("#heroChips") &&
     doc.querySelectorAll(".hero .chip").length === 0);
  ok("the removed config list is gone", !w.YS.config.homeChips,
     typeof w.YS.config.homeChips);

  /* The search bar and both CTAs share one row. Assert the grouping, not just
     the presence: if the CTAs drift back out of .hero-row they would stack
     under the bar again, which is the layout this replaced. */
  const row = doc.querySelector(".hero-row");
  ok("hero has a search + CTA row", !!row);
  const inRow = row ? [...row.querySelectorAll("a.btn")].map(a => a.getAttribute("href")) : [];
  ok("both hero CTAs are inside the row", inRow.length === 2 &&
     inRow.includes("quick-match.html") && inRow.includes("explore.html"), inRow.join(", "));
  ok("the search bar is in the same row as the CTAs",
     !!(row && row.querySelector("#heroSearch input")));
  /* The bar must come first in the DOM, not only in the visual order — the
     suggestion list is anchored to it and the tab order follows the DOM.
     The constant comes off the jsdom window; `Node` is not a Node.js global. */
  const FOLLOWING = w.Node.DOCUMENT_POSITION_FOLLOWING;
  ok("the search bar precedes the CTAs in the DOM",
     !!(row && row.querySelector("#heroSearch") &&
        row.querySelector("#heroSearch").compareDocumentPosition(row.querySelector(".hero-cta"))
          & FOLLOWING));
  /* Count only CTA links, not every .btn: the search field's own submit button
     is a .btn too, and it belongs inside the row by design. */
  ok("no CTA sits outside the row",
     doc.querySelectorAll(".hero a.btn").length === inRow.length,
     doc.querySelectorAll(".hero a.btn").length + " vs " + inRow.length);

  /* The aid-type row is the remaining chip shelf, so it carries the checks the
     hero chips used to: every chip must point somewhere real, no two may
     resolve to the same result set under different labels, and each count must
     be a positive number taken from the dataset. */
  const chips = [...doc.querySelectorAll("#aidChips .chip")];
  ok("aid chips rendered", chips.length > 0, chips.length + " chips");
  /* Compare on the filter itself, not the raw query string. */
  const chipFilterKey = a => {
    const p = new URLSearchParams(a.getAttribute("href").split("?")[1]);
    p.sort();
    return p.toString();
  };
  const chipQs = chips.map(chipFilterKey);
  ok("no two aid chips resolve to the same filter",
     new Set(chipQs).size === chipQs.length, chipQs.join("  "));
  const chipCounts = chips.map(c => Number(c.querySelector(".chip__count").textContent));
  ok("every aid chip resolves to at least one scheme", chipCounts.every(n => n > 0),
     chips.map((c, i) => c.textContent.trim() + "=" + chipCounts[i]).join("  "));
  /* Aid types cut across areas, so their counts may overlap and can sum past
     the dataset size. What must hold is that no single count exceeds it. */
  ok("no aid chip count exceeds the dataset",
     chipCounts.every(n => n <= DATA.schemes.length),
     Math.max(...chipCounts) + " vs " + DATA.schemes.length);
  ok("no aid chip targets an aid type that exists in no record",
     !chips.some(a => {
       const p = new URLSearchParams(a.getAttribute("href").split("?")[1]);
       return p.has("aid") && !DATA.schemes.some(s =>
         (s.filter.aid_type || []).includes(p.get("aid")));
     }));
  /* Every thematic area the hero chips used to surface is still reachable from
     the Explorer, which is what replaced them as an entry point. */
  const { w: w2, doc: doc2 } = await boot("explore.html");
  const emptyChips = [];
  for (const a of chips) {
    w2.YS.store.setFilters(w2.YS.store.paramsToFilters(
      new URLSearchParams(a.getAttribute("href").split("?")[1])));
    if (doc2.querySelectorAll("#results .scheme-card").length === 0) {
      emptyChips.push(a.getAttribute("href"));
    }
  }
  ok("every aid chip opens a non-empty explorer",
     emptyChips.length === 0, emptyChips.join("  "));
  /* The Explorer's own category facet must still offer every area in the
     dataset, including the four that used to be off the home page. The facet
     inputs are marked with data-facet="categories", and their value is the
     record's own category string. */
  const facetCats = [...doc2.querySelectorAll('#filters [data-facet="categories"]')]
    .map(i => i.value);
  const missingCat = [...new Set(DATA.schemes.map(s => s.category))]
    .filter(c => !facetCats.includes(c));
  ok("the Explorer facet covers every area in the dataset", missingCat.length === 0,
     missingCat.join("; ") || facetCats.length + " areas offered");
  w2.close();
  ok("featured cards rendered", doc.querySelectorAll("#featuredGrid .scheme-card").length === 6);
  ok("trust strip shows 103", /\b103\b/.test(doc.querySelector("#trustStrip").textContent));
  ok("disclaimer visible in DOM",
    /changes periodically|change periodically|Verify on official/i.test(doc.querySelector("#homeNotice").textContent));
  ok("dataset gap list surfaced",
    /documents_required|application_deadline/.test(doc.querySelector("#homeNotice").textContent));
  ok("compare bar mounted", !!w.document.querySelector(".cmpbar"));
  ok("Yojana Setu brand", /Yojana Setu/.test(doc.title + doc.body.textContent));

  /* save toggling. Re-query each time: saving triggers a repaint that replaces
     the card node, so a cached reference would be detached from the document. */
  const id = doc.querySelector("#featuredGrid [data-act='save']").getAttribute("data-id");
  doc.querySelector("#featuredGrid [data-act='save']").click();
  ok("save writes to localStorage",
    JSON.parse(w.localStorage.getItem("ys.saved") || "[]").includes(id), id);
  ok("save toast shown", !!doc.querySelector(".toasts .toast"));
  doc.querySelector("#featuredGrid [data-act='save']").click();
  ok("unsave clears", !JSON.parse(w.localStorage.getItem("ys.saved") || "[]").includes(id), id);

  /* theme cycle */
  const th = doc.querySelector("#themeBtn");
  th.click();
  ok("theme cycles to a non-default", w.localStorage.getItem("ys.theme") !== '"auto"',
     w.localStorage.getItem("ys.theme"));
  w.close();
}

/* ---------- explore -------------------------------------------------------- */
section("explore.html");
{
  const { w, errors, doc } = await boot("explore.html");
  ok("no JS errors", errors.length === 0, errors.join(" | "));
  ok("filter sidebar rendered", !!doc.querySelector("#filters"));
  const nInst = DATA.schemes.filter(s => s.filter.benefits_individual === false).length;
  const nIndividual = DATA.schemes.length - nInst;
  const n0 = cardCount(doc);
  ok("results render", n0 > 0, n0 + " cards");
  ok("default hides exactly the institutional records", resultTotal(doc) === nIndividual,
     resultTotal(doc) + " of " + DATA.schemes.length + " (" + nInst + " institutional hidden)");

  /* facet checkbox filtering */
  const catBox = [...doc.querySelectorAll("#filters [data-facet='categories']")][0];
  ok("category facet has options",
     !!catBox,
     doc.querySelector("#filters").textContent.slice(0, 160));
  if (!catBox) throw new Error("no category facet options rendered");
  catBox.checked = true;
  catBox.dispatchEvent(new w.Event("change", { bubbles: true }));
  const t1 = resultTotal(doc);
  ok("category filter narrows", t1 > 0 && t1 < nIndividual, nIndividual + " -> " + t1);
  ok("URL synced", /[?&]cat=/.test(w.location.search), w.location.search);
  ok("active filter chip shown", doc.querySelectorAll("#activeFilters .active-filter").length > 0);

  /* clearing */
  doc.querySelector("#clearAllBtn").click();
  ok("clear restores all", resultTotal(doc) === nIndividual, resultTotal(doc) + " results");

  /* institutional toggle reveals the hidden ones */
  const instBox = doc.querySelector("#filters [data-toggle='includeInstitutional']");
  instBox.checked = true;
  instBox.dispatchEvent(new w.Event("change", { bubbles: true }));
  ok("institutional toggle reveals records",
     resultTotal(doc) === DATA.schemes.length,
     resultTotal(doc) + " of " + DATA.schemes.length);
  w.close();
}

/* ---------- scheme card layout ------------------------------------------------ */
section("scheme card structure");
{
  const { w, doc } = await boot("explore.html");
  const cards = [...doc.querySelectorAll("#results .scheme-card")];
  ok("cards to inspect", cards.length > 0, cards.length + " cards");

  /* The reported bug: the category badge overlapped the save button and the
     save button looked squashed. Assert the DOM lets the two sit side by side
     without either being nested inside or sharing space with the other. */
  const tops = cards.map(c => c.querySelector(".scheme-card__top"));
  ok("every card has a top row", tops.every(Boolean));
  ok("top row is exactly badges + save button",
     tops.every(t => t.children.length === 2 &&
                    t.children[0].classList.contains("scheme-card__badges") &&
                    t.children[1].classList.contains("save-btn")),
     tops.map(t => t.children.length).join(","));
  ok("save button is not inside the badge row (nothing to overlap)",
     cards.every(c => !c.querySelector(".scheme-card__badges .save-btn")));

  /* The category badge must be present and must be the navy one — the rule that
     lets it wrap is scoped to .badge-navy, so a class change here would
     silently bring the overflow back. */
  ok("category badge is the navy badge in every card",
     cards.every(c => {
       const b = c.querySelector(".scheme-card__badges .badge-navy");
       return b && b.textContent.trim().length > 0;
     }));

  /* View Details: one line, no arrow, bordered. The arrow is gone from the
     markup, so a stray SVG inside the link is a regression. */
  const vds = cards.map(c => c.querySelector(".scheme-card__foot .btn-link"));
  ok("every card has a View Details link", vds.every(Boolean));
  ok("View Details carries no arrow icon",
     vds.every(a => !a.querySelector("svg")),
     vds.filter(a => a.querySelector("svg")).map(a => a.textContent.trim()).join(", "));
  ok("View Details text is intact", vds.every(a => a.textContent.trim() === "View Details"),
     [...new Set(vds.map(a => a.textContent.trim()))].join(" | "));
  ok("View Details still links to the scheme",
     vds.every(a => a.getAttribute("href").startsWith("scheme.html?id=")));

  /* Both actions sit in the foot, and the foot is last so it reads as the
     action row. */
  ok("foot is the card's last element",
     cards.every(c => c.lastElementChild.classList.contains("scheme-card__foot")));
  ok("foot holds View Details and the compare checkbox",
     cards.every(c => {
       const f = c.querySelector(".scheme-card__foot");
       return !!f.querySelector(".btn-link") && !!f.querySelector(".compare-check");
     }));

  /* The save button must keep its accessible name — it lost visual prominence
     to the category badge, so its label is the only thing left identifying it. */
  const saves = cards.map(c => c.querySelector(".save-btn"));
  ok("save button keeps an accessible name",
     saves.every(b => (b.getAttribute("aria-label") || "").length > 5),
     saves.map(b => b.getAttribute("aria-label")).filter(s => !s || s.length <= 5).join(" | "));
  ok("save button exposes pressed state",
     saves.every(b => b.getAttribute("aria-pressed") === "false" || b.getAttribute("aria-pressed") === "true"));
  w.close();
}

/* ---------- explore: income honesty --------------------------------------- */
section("explore.html — income matching");
{
  const { w, doc } = await boot("explore.html");
  /* Pick the tightest band: below Rs.1 lakh. Only schemes whose recorded
     ceiling is >= 1 lakh should match. */
  const band = doc.querySelector("#filters [data-band='b1']");
  band.checked = true;
  band.dispatchEvent(new w.Event("change", { bubbles: true }));

  const matched = DATA.schemes.filter(s => {
    const f = s.filter;
    if (f.benefits_individual === false) return false;
    if (f.income_criterion === "no-limit") return true;
    if (f.income_criterion === "unstated") return false;
    return f.max_income >= 100000;
  }).map(s => s.id);

  /* The match set can exceed one page, so compare the TOTAL, and separately
     confirm that nothing on the visible page violates the rule. */
  const shownOnPage = () => [...doc.querySelectorAll("#results .scheme-card")]
    .map(c => c.getAttribute("data-scheme"));
  ok("income band matches the documented rule",
     resultTotal(doc) === matched.length,
     "total " + resultTotal(doc) + " / expected " + matched.length);
  ok("every card on the visible page is in the matched set",
     shownOnPage().every(id => matched.includes(id)),
     shownOnPage().length + " cards checked");
  ok("no 'unstated' scheme leaks into a band match",
     !shownOnPage().some(id => {
       const s = DATA.schemes.find(x => x.id === id);
       return s.filter.income_criterion === "unstated";
     }));
  ok("diagnostic banner offers to widen",
     !!doc.querySelector("[data-act='show-unstated']"));

  const before = resultTotal(doc);
  doc.querySelector("[data-act='show-unstated']").click();
  ok("widening reveals the unstated ones", resultTotal(doc) > before,
     before + " -> " + resultTotal(doc));
  w.close();
}

/* ---------- scheme detail -------------------------------------------------- */
section("scheme.html");
{
  const { w, errors, doc } = await boot("scheme.html", { url: "http://localhost/scheme.html?id=NMMS" });
  ok("no JS errors", errors.length === 0, errors.join(" | "));
  ok("hero title is the dataset name", doc.querySelector(".detail-title").textContent
     === DATA.schemes.find(s => s.id === "NMMS").name);
  ok("quick facts card rendered", !!doc.querySelector(".facts"));
  ok("official site link is the dataset's own",
     doc.querySelector(".facts__cta a").getAttribute("href")
       === DATA.schemes.find(s => s.id === "NMMS").official_website);
  ok("NO apply button anywhere",
     ![...doc.querySelectorAll("button,a")].some(b => /^apply\b/i.test(b.textContent.trim())));
  ok("documents stated as unavailable", /aren't in the dataset|aren’t in the dataset/i.test(doc.body.textContent));
  ok("deadlines stated as unavailable", /Application dates aren't in the dataset/i.test(doc.body.textContent));
  ok("helpline stated as unavailable", /Helpline numbers aren't in the dataset/i.test(doc.body.textContent));
  ok("last verified NOT shown as the compile date",
     !/Last verified[^0-9]*2026-09-10/.test(doc.body.textContent));
  ok("stepper renders 5 steps", doc.querySelectorAll(".step").length === 5);
  ok("stepper carries the not-available disclaimer",
     /does not contain scheme-specific application steps/i.test(doc.body.textContent));
  ok("related schemes rendered", doc.querySelectorAll(".panel .scheme-card").length > 0);
  w.close();
}

/* ---------- institutional record ------------------------------------------ */
section("scheme.html — institutional record (Samagra)");
{
  const { w, doc } = await boot("scheme.html", { url: "http://localhost/scheme.html?id=SAMAGRA-SHIKSHA" });
  ok("states it is not individually applicable",
     /don't apply to it|programme, institution or policy/i.test(doc.body.textContent));
  ok("no apply CTA", ![...doc.querySelectorAll(".facts__cta a")].some(a => /apply/i.test(a.textContent)));
  w.close();
}

/* ---------- Explore pagination ------------------------------------------------
   Explore shows 9 cards in a 3-up grid at a time instead of the whole set in one
   long scroll. These pin the behaviour that is easy to break: the page size, the
   fact that a filter change must not strand the reader on a page that no longer
   exists, and the fact that only Explore is paginated -- Saved and the home
   featured row still use the auto-fill grid and must not grow a pager. */
section("explore.html — pagination");
{
  const { w, doc, errors } = await boot("explore.html");
  const PAGE = 9;
  const cardIds = () => [...doc.querySelectorAll("#results .scheme-card")]
    .map(c => c.dataset.scheme);
  const shownTotal = () => {
    const m = doc.querySelector("#resultCount").textContent
      .match(/(\d[\d,]*)\s*(?:योजन|schemes?)/i);
    return m ? Number(m[1].replace(/,/g, "")) : NaN;
  };

  ok("no JS errors", errors.length === 0, errors.join(" | "));
  ok("grid is the fixed 3-up variant, not auto-fill",
     !!doc.querySelector("#results .card-grid--paged"));
  ok("shows exactly " + PAGE + " cards", cardIds().length === PAGE, cardIds().length);

  const pages = Math.ceil(shownTotal() / PAGE);
  ok("pager is rendered when the set needs more than one page", pages > 1,
     shownTotal() + " results -> " + pages + " pages");
  ok("prev is disabled on the first page",
     doc.querySelector('#pager [data-page="0"]').disabled === true);
  ok("current page is marked", doc.querySelector("#pager [aria-current=\"page\"]")
     .textContent.trim() === "1");

  /* 9 pages would wrap the pager onto two rows on a phone, so the middle has to
     collapse into a non-interactive gap. */
  if (pages > 7) {
    ok("long pager collapses the middle into a gap",
       doc.querySelectorAll("#pager .pager__gap").length >= 1,
       doc.querySelectorAll("#pager .pager__gap").length + " gap marker(s)");
    ok("gap markers are hidden from assistive tech",
       [...doc.querySelectorAll("#pager .pager__gap")]
         .every(g => g.getAttribute("aria-hidden") === "true" && !g.dataset.page));
    ok("first and last page stay reachable",
       !!doc.querySelector('#pager [data-page="1"]') &&
       !!doc.querySelector('#pager [data-page="' + pages + '"]'));
  }

  /* Page 2 must be a genuinely different slice, not a re-render of page 1. */
  const p1 = cardIds();
  doc.querySelector('#pager [data-page="2"]').click();
  ok("page 2 also shows " + PAGE + " cards", cardIds().length === PAGE, cardIds().length);
  ok("page 2 shares no records with page 1",
     !cardIds().some(id => p1.includes(id)));
  ok("count line reports the visible slice, not just the total",
     /10\D*18/.test(doc.querySelector("#resultCount").textContent.replace(/\s/g, "")),
     JSON.stringify(doc.querySelector("#resultCount").textContent.trim()));
  ok("prev is enabled once off the first page",
     doc.querySelector('#pager [data-page="1"]').disabled === false);

  /* The last page is short and must not offer a next page. */
  doc.querySelector('#pager [data-page="' + pages + '"]').click();
  const remaining = shownTotal() - (pages - 1) * PAGE;
  ok("last page holds only the remainder", cardIds().length === remaining,
     cardIds().length + " of " + remaining);
  ok("next is disabled on the last page",
     doc.querySelector('#pager [data-page="' + (pages + 1) + '"]').disabled === true);

  /* A filter change must reset to page 1: staying on page 9 of a set that now has
     two pages would show an empty grid under a live pager. */
  const catBox = [...doc.querySelectorAll("#filters [data-facet='categories']")][0];
  catBox.checked = true;
  catBox.dispatchEvent(new w.Event("change", { bubbles: true }));
  ok("a filter change returns to page 1",
     doc.querySelector("#pager[aria-current], #pager [aria-current=\"page\"]") &&
     (doc.querySelector("#pager").innerHTML === "" ||
      doc.querySelector('#pager [aria-current="page"]').textContent.trim() === "1"));
  ok("never more than " + PAGE + " cards are rendered", cardIds().length <= PAGE,
     cardIds().length + " cards of " + shownTotal());

  /* Narrow to a set that fits one page: the pager must disappear entirely. */
  const boxes = () => [...doc.querySelectorAll("#filters [data-facet='categories']")];
  const small = boxes().map(b => ({
    value: b.value,
    n: Number(b.closest("label").querySelector(".check__count").textContent)
  })).filter(x => x.n > 0 && x.n <= PAGE).sort((a, b) => a.n - b.n)[0];
  ok("dataset has a category that fits one page", !!small, small && small.n + " records");
  if (small) {
    /* One dispatch at a time, re-querying between: each change repaints the
       panel, replacing its nodes, so a single snapshot goes stale immediately. */
    for (let pass = 0; pass < 20; pass++) {
      const wrong = boxes().find(b => b.checked !== (b.value === small.value));
      if (!wrong) break;
      wrong.checked = wrong.value === small.value;
      wrong.dispatchEvent(new w.Event("change", { bubbles: true }));
    }
    ok("single-page set renders every record", cardIds().length === shownTotal(),
       cardIds().length + " of " + shownTotal());
    ok("single-page set shows no pager", doc.querySelector("#pager").innerHTML === "");
  }
  w.close();

  /* Only Explore is paginated. */
  const saved = await boot("saved.html");
  ok("saved page has no pager", !saved.doc.querySelector("#pager"));
  ok("saved grid is still auto-fill", !saved.doc.querySelector(".card-grid--paged"));
  saved.w.close();
}

/* ---------- verification tier -------------------------------------------------
   The dataset now mixes two tiers: the original curated records, and records
   added from a source that never checked them against an official portal. The
   whole point of shipping the second tier is that it is LABELLED, so these
   assert the label is actually rendered -- and, just as importantly, that it is
   NOT applied to the original records, which would wrongly imply those are
   unverified too. */
section("verification tier is labelled, and only where it applies");
{
  const unv = DATA.schemes.filter(s => s.verification === "unverified");
  const curated = DATA.schemes.filter(s => !s.verification);
  ok("dataset actually contains both tiers", unv.length > 0 && curated.length > 0,
     curated.length + " curated + " + unv.length + " unverified");

  /* every unverified record must SAY SO in the data, not only look that way */
  const notFlagged = unv.filter(s => s.status !== "unverified");
  ok("unverified records also carry status:'unverified'", notFlagged.length === 0,
     notFlagged.map(s => s.id).join(", "));
  const wrongFlag = curated.filter(s => s.status === "unverified");
  ok("curated records are not marked unverified", wrongFlag.length === 0,
     wrongFlag.map(s => s.id).join(", "));

  /* an unverified record must not assert an income limit it never sourced */
  const inventedCeiling = unv.filter(s =>
    s.filter.income_criterion === "limit-known" && !/income/i.test(s.eligibility || ""));
  ok("no income ceiling claimed without one in the eligibility text",
     inventedCeiling.length === 0, inventedCeiling.map(s => s.id).join(", "));

  /* The label must reach the card. Explore paginates 9 at a time and the default
     "relevant" sort is dataset order, which puts the 24 curated records first --
     so page 1 is entirely curated. Walk to the last page to see unverified cards
     rather than assuming they are on screen. */
  const { w, doc } = await boot("explore.html");
  const pages = Math.ceil(resultTotal(doc) / 9);
  ok("unverified records are not all on page 1",
     ![...doc.querySelectorAll("#results .scheme-card")]
       .some(c => unv.some(u => u.id === c.dataset.scheme)),
     pages + " pages to walk");
  doc.querySelector('#pager [data-page="' + pages + '"]').click();
  const badged = [...doc.querySelectorAll("#results .scheme-card")]
    .filter(c => c.querySelector(".badge-unverified")).length;
  ok("explore cards badge the unverified records", badged > 0, badged + " cards badged");
  ok("a curated card is not badged unverified",
     ![...doc.querySelectorAll("#results .scheme-card")]
       .some(c => curated.some(k => k.id === c.dataset.scheme) &&
                       c.querySelector(".badge-unverified")));
  const origCard = doc.querySelector('[data-scheme="' + curated[0].id + '"]');
  ok("curated record found on some page and not badged",
     !origCard || !origCard.querySelector(".badge-unverified"), curated[0].id);
  w.close();

  /* and the detail page must carry a banner, not just a badge */
  const u = unv[0];
  const d2 = await boot("scheme.html", { url: "http://localhost/scheme.html?id=" + u.id });
  ok("detail page shows the unverified banner",
     /Unverified record/i.test(d2.doc.body.textContent), u.id);
  ok("detail page sets a meta description without throwing",
     !!(d2.doc.querySelector("meta[name=description]") || {}).content);
  d2.w.close();

  /* curated records must NOT get the banner */
  const c = curated[0];
  const d3 = await boot("scheme.html", { url: "http://localhost/scheme.html?id=" + c.id });
  ok("a curated detail page shows no unverified banner",
     !/Unverified record/i.test(d3.doc.body.textContent), c.id);
  d3.w.close();
}

/* ---------- state-scope records ---------------------------------------------- */
section("state-scope records are marked as state schemes");
{
  const st = DATA.schemes.filter(s => s.scope === "State");
  ok("dataset contains state-scope records", st.length > 0, st.length + " records");
  const { w, doc } = await boot("scheme.html", { url: "http://localhost/scheme.html?id=" + st[0].id });
  ok("detail page says it is a state scheme",
     /state government scheme/i.test(doc.body.textContent), st[0].id);
  w.close();
}

/* ---------- unknown id ------------------------------------------------------ */
section("scheme.html — bad id");
{
  const { w, doc, errors } = await boot("scheme.html", { url: "http://localhost/scheme.html?id=NOPE" });
  ok("no JS errors", errors.length === 0, errors.join(" | "));
  ok("shows an empty state, not a crash", !!doc.querySelector(".empty"));
  ok("names the missing id", /NOPE/.test(doc.body.textContent));
  w.close();
}

/* ---------- quick match ----------------------------------------------------- */
section("quick-match.html");
{
  const { w, errors, doc } = await boot("quick-match.html");
  ok("no JS errors", errors.length === 0, errors.join(" | "));
  ok("5 step bars", doc.querySelectorAll(".qm__step").length === 5);
  ok("step 1 offers education levels", doc.querySelectorAll(".opt").length === 6);
  ok("advance blocked without a level",
     doc.querySelector('[data-act="next"]').hasAttribute("aria-disabled"));

  const lvl = doc.querySelector('.opt[data-value="school"]');
  lvl.click();
  ok("level selected", doc.querySelector('.opt[data-value="school"]').classList.contains("is-selected"));
  doc.querySelector('[data-act="next"]').click();
  ok("moved to profile", doc.querySelectorAll(".opt").length > 6);
  ok("state question explains why it cannot filter",
     /cannot narrow your results/i.test(doc.body.textContent));

  /* walk to results */
  doc.querySelector('.opt[data-key="gender"][data-value="female"]').click();
  doc.querySelector('[data-act="next"]').click();
  doc.querySelector('.opt[data-value="b1"]').click();
  doc.querySelector('[data-act="next"]').click();
  ok("aid step is multi-select",
     doc.querySelector('.opt[data-key="aid"]').getAttribute("aria-pressed") !== null);
  doc.querySelector('[data-act="next"]').click();
  ok("reached results", /may qualify for/i.test(doc.body.textContent));
  ok("results use qualifying language, not 'eligible'",
     !/\byou are eligible\b/i.test(doc.body.textContent));
  ok("primary button links to explorer with filters",
     /explore\.html\?/.test(doc.querySelector('[data-act="next"]').getAttribute("data-href") || ""));
  w.close();
}

/* ---------- compare --------------------------------------------------------- */
section("compare.html");
{
  const { w, errors, doc } = await boot("compare.html");
  ok("no JS errors", errors.length === 0, errors.join(" | "));
  ok("empty state at 0 selected", !!doc.querySelector(".empty"));

  const s = w.YS.store;
  s.toggleCompare("NMMS");
  s.toggleCompare("PM-VIDYALAXMI");
  await new Promise(r => setTimeout(r, 40));
  ok("table appears with 2", !!doc.querySelector("table.cmp"));
  /* The page's own copy says "we don't score or rank", so a naive substring
     scan hits that disclaimer. Scan the data cells only, and check the header
     for any per-column emphasis. */
  const cells = [...doc.querySelectorAll("table.cmp tbody td")].map(td => td.textContent);
  const offenders = cells.filter(c =>
    /\b(score|rank|ranked|best|winner|top pick|recommended|eligible for you)\b/i.test(c));
  ok("no ranking language in any data cell", offenders.length === 0, offenders.join(" | "));
  ok("row labels are neutral field names, not verdicts",
     ![...doc.querySelectorAll("table.cmp tbody th")].some(th =>
       /\b(best|worst|winner|loser|top|recommended|rank|score|versus|vs)\b/i.test(th.textContent)),
     [...doc.querySelectorAll("table.cmp tbody th")].map(t => t.textContent).join(" | "));
  ok("no column is visually marked as a favourite",
     doc.querySelectorAll("table.cmp .is-best, table.cmp .is-winner, table.cmp [data-best]").length === 0);
  ok("every compared column has the same number of rows",
     new Set([...doc.querySelectorAll("table.cmp tbody tr")]
       .map(r => r.querySelectorAll("td").length)).size === 1);

  const third = s.toggleCompare("PM-YASASVI");
  const fourth = s.toggleCompare("SWAYAM");
  ok("4th add refused at the cap", fourth.full === true && s.compareCount() === 3,
     s.compareCount());
  w.close();
}

/* ---------- saved ------------------------------------------------------------ */
section("saved.html");
{
  const { w, errors, doc } = await boot("saved.html");
  ok("no JS errors", errors.length === 0, errors.join(" | "));
  ok("empty state at 0 saved", !!doc.querySelector(".empty"));
  ok("says storage is browser-local", /localStorage|this browser only/i.test(doc.body.textContent));
  w.YS.store.toggleSave("NMMS");
  await new Promise(r => setTimeout(r, 40));
  ok("saved card renders", doc.querySelectorAll("#savedRoot .scheme-card").length === 1);
  ok("count announced", /1 scheme saved/.test(doc.querySelector("#savedCount").textContent));
  w.close();
}

/* ---------- deadlines --------------------------------------------------------- */
section("deadlines.html");
{
  const { w, errors, doc } = await boot("deadlines.html");
  ok("no JS errors", errors.length === 0, errors.join(" | "));
  const txt = doc.body.textContent;
  ok("says no deadlines available", /No deadlines available/i.test(txt));
  ok("explains why", /does not contain application dates/i.test(txt));
  ok("refuses to estimate", /don't show estimated or guessed dates/i.test(txt));
  ok("calendar grid present but void",
     doc.querySelectorAll(".cal__day").length > 27 &&
     doc.querySelectorAll(".cal__day.is-set").length === 0);
  /* This page has no link to the National Scholarship Portal anywhere, and has
     not had one since the CTA was demoted and the footer entry then dropped.
     The site's chrome must not endorse a third-party government site. */
  ok("no link to the portal on this page",
     ![...doc.querySelectorAll("a")].some(a => a.href.includes("scholarships.gov.in")));
  /* The explanation of where the real dates live must survive that removal —
     dropping it would leave the reader with no route to the information at
     all. The prose names the portal; only the link is gone. */
  ok("still explains where the real dates are",
     /National Scholarship Portal lists current application dates/i.test(txt));
  ok("no countdown or date string fabricated",
     !/\b\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+20\d\d\b/i.test(txt));

  /* The calendar is meant to switch on by itself once real dates arrive, so
     feed it a dated record and confirm the cell lights up rather than staying
     in the "void" state. This is the only test allowed to invent a date, and
     it never touches the dataset on disk. */
  {
    const dated = JSON.parse(JSON.stringify(DATA));
    const y = new Date().getFullYear();
    const m = String(new Date().getMonth() + 1).padStart(2, "0");
    dated.schemes[0].application_deadline = y + "-" + m + "-14";
    const html = fs.readFileSync(path.join(SITE, "deadlines.html"), "utf8");
    const d2 = new JSDOM(html, { url: "http://localhost/deadlines.html",
      runScripts: "dangerously", pretendToBeVisual: true, virtualConsole: new VirtualConsole() });
    d2.window.fetch = () => Promise.resolve({ ok: true, json: async () => dated });
    d2.window.matchMedia = q => ({ matches: false, media: q,
      addEventListener(){}, removeEventListener(){}, addListener(){}, removeListener(){} });
    for (const src of ["config.js","i18n.js","store.js","ui.js","deadlines.js"]) {
      d2.window.eval(fs.readFileSync(path.join(SITE, "assets/js", src), "utf8"));
    }
    await new Promise(r => setTimeout(r, 120));
    ok("a real date lights up the matching calendar cell",
       d2.window.document.querySelectorAll(".cal__day.is-set").length >= 1,
       d2.window.document.querySelectorAll(".cal__day.is-set").length + " marked");
    ok("the dated scheme is listed under the grid",
       d2.window.document.querySelector("#calRoot").textContent.includes(
         dated.schemes[0].short_name || dated.schemes[0].name));
    d2.window.close();
  }
  w.close();
}

/* ---------- dark mode + i18n -------------------------------------------------- */
section("theme & language");
{
  const { w, doc } = await boot("index.html");
  w.localStorage.setItem("ys.theme", '"dark"');
  w.localStorage.setItem("ys.lang", '"hi"');
  const dom2 = await boot("index.html", {
    url: "http://localhost/index.html"
  });
  /* re-boot with the stores populated */
  const html = fs.readFileSync(path.join(SITE, "index.html"), "utf8");
  const { JSDOM: J2 } = require("jsdom");
  const d = new J2(html, { url: "http://localhost/index.html", runScripts: "dangerously",
    pretendToBeVisual: true, virtualConsole: new VirtualConsole() });
  d.window.localStorage.setItem("ys.theme", '"dark"');
  d.window.localStorage.setItem("ys.lang", '"hi"');
  d.window.fetch = () => Promise.resolve({ ok: true, json: async () => DATA });
  d.window.matchMedia = q => ({ matches: false, media: q,
    addEventListener(){}, removeEventListener(){}, addListener(){}, removeListener(){} });
  for (const src of ["config.js","i18n.js","store.js","ui.js","home.js"]) {
    d.window.eval(fs.readFileSync(path.join(SITE, "assets/js", src), "utf8"));
  }
  await new Promise(r => setTimeout(r, 120));
  ok("dark theme applied to <html>",
     d.window.document.documentElement.getAttribute("data-theme") === "dark");
  ok("Hindi interface strings applied",
     /योजना|खोजें|केंद्रीय/.test(d.window.document.body.textContent));
  ok("scheme data stays English (not translated)",
     DATA.schemes.some(s => d.window.document.body.textContent.includes(s.name)));
  w.close(); dom2.w.close(); d.window.close();
}

/* ---------- load-error state --------------------------------------------------- */
section("fetch failure -> error state");
{
  const html = fs.readFileSync(path.join(SITE, "index.html"), "utf8");
  const d = new JSDOM(html, { url: "http://localhost/index.html", runScripts: "dangerously",
    pretendToBeVisual: true, virtualConsole: new VirtualConsole() });
  d.window.fetch = () => Promise.reject(new Error("Failed to fetch"));
  d.window.matchMedia = q => ({ matches: false, media: q,
    addEventListener(){}, removeEventListener(){}, addListener(){}, removeListener(){} });
  for (const src of ["config.js","i18n.js","store.js","ui.js","home.js"]) {
    d.window.eval(fs.readFileSync(path.join(SITE, "assets/js", src), "utf8"));
  }
  await new Promise(r => setTimeout(r, 120));
  const txt = d.window.document.body.textContent;
  ok("error box shown", !!d.window.document.querySelector(".error-box"));
  ok("names the real cause (file:// blocks fetch)", /file system/i.test(txt));
  ok("gives the fix command", /python -m http.server 8000/.test(txt));
  d.window.close();
}

/* ---------- inner page opening heads -------------------------------------------- */
/* The five inner pages share one opening block: a small gold eyebrow over the
   title over the subtitle, centred. scheme.html is deliberately excluded — its
   h1 is a scheme's own name, which is a document title and must not be centred
   or given a marketing eyebrow. */
section("inner page heads");
{
  const INNER = ["explore.html", "quick-match.html", "compare.html", "saved.html", "deadlines.html"];
  for (const page of INNER) {
    const { w, doc } = await boot(page);
    const head = doc.querySelector(".page-head");
    const eb = head && head.querySelector(".eyebrow");
    const h1 = head && head.querySelector("h1");
    ok(page + ": has a .page-head", !!head);
    ok(page + ": head has an eyebrow with text", !!eb && !!eb.textContent.trim(),
       eb ? eb.textContent.trim() : "missing");
    ok(page + ": eyebrow is not the h1 text",
       !!eb && !!h1 && eb.textContent.trim() !== h1.textContent.trim(),
       eb && h1 ? eb.textContent.trim() + " vs " + h1.textContent.trim() : "");
    ok(page + ": h1 is inside the head, so the page still has one h1",
       doc.querySelectorAll("h1").length === 1 && doc.querySelector("h1") === h1);
    /* The eyebrow must be a translated string, not copy typed into the markup.
       i18n.apply() overwrites textContent but leaves data-i18n in place, so the
       attribute is a reliable handle on which key the label is bound to. */
    const key = eb && eb.getAttribute("data-i18n");
    ok(page + ": eyebrow is bound to an i18n key", !!key && w.YS.i18n.t(key) === eb.textContent.trim(),
       key || "no data-i18n on the eyebrow");
    w.close();
  }

  /* The five keys are distinct, so no two pages show the same label. */
  const keys = [];
  let tables = null;
  for (const page of INNER) {
    const { w, doc } = await boot(page);
    keys.push(doc.querySelector(".page-head .eyebrow").getAttribute("data-i18n"));
    tables = w.YS.i18n.tables;
    w.close();
  }
  ok("all five eyebrows are distinct labels", new Set(keys).size === INNER.length, keys.join(", "));
  ok("every eyebrow key is translated in Hindi",
     keys.every(k => typeof tables.hi[k] === "string" && tables.hi[k].trim().length),
     keys.filter(k => !tables.hi[k]).join(", ") || "all present");
  ok("no Hindi eyebrow is left as the English string",
     keys.every(k => tables.hi[k] !== tables.en[k]),
     keys.filter(k => tables.hi[k] === tables.en[k]).join(", ") || "all differ");
}

/* ---------- a11y spot checks ------------------------------------------------------ */
section("accessibility");
{
  const { w, doc } = await boot("explore.html");

  /* Names, not just presence — find anything unlabelled. */
  const unnamed = [...doc.querySelectorAll("button, a[href], input, [role=radio], [role=checkbox]")]
    .filter(n => {
      const name = n.getAttribute("aria-label") || n.getAttribute("title") ||
        (n.labels && n.labels.length ? [...n.labels].map(l => l.textContent).join(" ") : "") ||
        n.textContent.trim();
      return !name.length;
    })
    .map(n => n.tagName + "." + (n.className || ""));
  ok("every control has an accessible name", unnamed.length === 0, unnamed.join(", "));

  ok("skip link exists", !!doc.querySelector(".skip-link"));
  ok("skip link targets main", (doc.querySelector(".skip-link") || {}).href === "" ||
     (doc.querySelector(".skip-link") || { getAttribute: () => null })
       .getAttribute("href") === "#main");
  ok("main landmark present and focusable", !!doc.querySelector("main#main") &&
     doc.querySelector("main#main").getAttribute("tabindex") !== null);
  ok("every page has exactly one h1", doc.querySelectorAll("h1").length === 1,
     doc.querySelectorAll("h1").length);
  ok("primary nav labelled", !!doc.querySelector("nav[aria-label]"));
  ok("filters labelled", !!doc.querySelector(".filters[aria-label]"));
  ok("results region is a live region",
     doc.querySelector("#results").getAttribute("aria-live") === "polite");
  ok("no positive tabindex anywhere", ![...doc.querySelectorAll("[tabindex]")]
     .some(n => Number(n.getAttribute("tabindex")) > 0));
  ok("no inline onclick handlers",
     !doc.documentElement.innerHTML.includes("onclick="),
     (doc.documentElement.innerHTML.match(/onclick=/g) || []).length + " found");
  ok("all images have alt text", [...doc.querySelectorAll("img")]
     .every(i => i.hasAttribute("alt")));
  ok("lang attribute set on <html>", !!doc.documentElement.getAttribute("lang"));
  w.close();
}

/* ---------- branding: the site mark and the institution strip ---------------- */
section("branding");
{
  /* config.js assigns onto `window`, so it cannot be eval'd bare in node. The
     booted page already has it loaded as a script — read it from there. */
  const { w, doc } = await boot("index.html");
  const CFG = w.YS.config;

  /* The site logo is a real image file now, referenced from config so the path
     lives in one place. Check it is the configured file and not a stray hard-
     coded one, and that it is the only mark in the header. */
  const head = doc.querySelector(".site-header .logo-mark img");
  ok("header shows the configured logo file", !!head, CFG.brand.logo);
  ok("logo src comes from config", head && head.getAttribute("src") === CFG.brand.logo,
     head && head.getAttribute("src"));
  ok("logo is the only image in the header",
     doc.querySelectorAll(".site-header img").length === 1);
  /* alt is intentionally empty: the brand name is already visible text beside
     it, so naming the image would make a screen reader say it twice. An empty
     alt is the correct answer, but a MISSING one is not — that reads the file
     name aloud. */
  ok("logo has an alt attribute", head && head.hasAttribute("alt"));
  ok("logo alt is empty because the name is already in text",
     head && head.getAttribute("alt") === "",
     head && JSON.stringify(head.getAttribute("alt")));
  /* Intrinsic size on the element reserves the box, so the header cannot jump
     when the image decodes. */
  ok("logo declares width and height", !!head && !!head.getAttribute("width") && !!head.getAttribute("height"),
     head && (head.getAttribute("width") + "x" + head.getAttribute("height")));

  /* The institution strip: attribution at the foot of the footer. */
  const strip = doc.querySelector(".footer-inst");
  ok("institution strip exists", !!strip);
  const ilogo = strip && strip.querySelector("img.footer-inst__logo");
  ok("institution logo present and from config",
     !!ilogo && ilogo.getAttribute("src") === CFG.brand.institution.logo,
     ilogo && ilogo.getAttribute("src"));
  ok("institution logo has an alt attribute", !!ilogo && ilogo.hasAttribute("alt"));
  const iname = strip && strip.querySelector(".footer-inst__name");
  ok("institution name matches config exactly",
     !!iname && iname.textContent === CFG.brand.institution.name,
     iname && iname.textContent);

  /* It is attribution, not navigation: the strip must contain no link, or the
     college would read as somewhere the site sends you. */
  ok("institution strip contains no link", !!strip && strip.querySelectorAll("a").length === 0);

  /* The apostrophe in the name is the real risk in a string that travels
     through innerHTML. An unescaped one would truncate the name at "Society". */
  ok("apostrophe in the name survived escaping",
     !!iname && /Society's College of Engineering, Pune/.test(iname.textContent));
  ok("no raw HTML leaked into the name",
     !!iname && iname.children.length === 0 && !/<[a-z]/i.test(iname.textContent));

  /* It belongs at the foot of the footer: after the navigation columns, before
     the disclaimer and the copyright line. Everything in the footer is wrapped
     in one .wrap, so the comparison has to be between siblings inside that,
     not between children of <footer> (which is just the single .wrap). */
  const foot = doc.querySelector(".site-footer .wrap");
  const order = [...foot.children].map(c => c.className);
  const after = (a, b) => !!(a.compareDocumentPosition(b) & w.Node.DOCUMENT_POSITION_FOLLOWING);
  ok("strip sits below the footer's link columns",
     after(foot.querySelector(".footer-top"), strip), order.join(" -> "));
  ok("strip sits above the disclaimer and copyright line",
     after(strip, foot.querySelector(".footer-disclaimer")) &&
     after(strip, foot.querySelector(".footer-bottom")), order.join(" -> "));
  ok("the footer's own order is unchanged",
     order.join(",") === "footer-top,footer-inst,footer-disclaimer,footer-bottom",
     order.join(","));
  ok("strip is not the last thing in the footer",
     !!foot.querySelector(".footer-disclaimer") && !!foot.querySelector(".footer-bottom"));

  /* The label is translatable; the name is a registered proper noun and is not
     translated. Guard both, so neither is "fixed" in the wrong direction. */
  ok("the label is an i18n key", /\S/.test(strip.querySelector(".footer-inst__label").textContent),
     strip.querySelector(".footer-inst__label").textContent);
  ok("the name is left untranslated (proper noun)",
     iname.textContent === CFG.brand.institution.name &&
     w.YS.i18n.tables.hi["footer.institution"] !== w.YS.i18n.tables.en["footer.institution"]);
  w.close();
}

/* ---------- the portal is not ours to advertise ---------------------------- */
/* The National Scholarship Portal is third-party government infrastructure. It
   used to be linked from the deadlines page and then from the footer; both are
   gone. The site chrome must not vouch for a site it does not run, so the only
   remaining route to the portal is a scheme record's own official_website
   field — which is data, quoted as-is, not a call to action. */
section("National Scholarship Portal link");
{
  /* boot() reads the page from disk by filename, so a query string has to be
     passed as opts.url rather than glued onto the name. */
  const PAGES = [
    ["index.html", "http://localhost/index.html"],
    ["explore.html", "http://localhost/explore.html"],
    ["quick-match.html", "http://localhost/quick-match.html"],
    ["compare.html", "http://localhost/compare.html"],
    ["saved.html", "http://localhost/saved.html"],
    ["deadlines.html", "http://localhost/deadlines.html"],
    ["scheme.html", "http://localhost/scheme.html?id=NMMS"]
  ];

  const inChrome = [];
  const inBody = [];
  for (const [file, url] of PAGES) {
    const { w, doc } = await boot(file, { url });
    if (doc.querySelector('.site-footer a[href*="scholarships.gov.in"], .site-header a[href*="scholarships.gov.in"]')) {
      inChrome.push(file);
    }
    /* The footer's own body, which is where the link used to be. */
    const foot = doc.querySelector(".site-footer");
    if (foot && foot.textContent.includes("National Scholarship Portal")) inBody.push(file);
    w.close();
  }
  ok("no page's header or footer links the portal", inChrome.length === 0, inChrome.join(", "));
  ok("no page's footer text names the portal", inBody.length === 0, inBody.join(", "));

  /* Removing the link must not remove the reader's route to the information.
     The deadlines page is the one place that talks about where real dates
     live, so it has to still say so — in prose, with no link attached. */
  {
    const { w, doc } = await boot("deadlines.html");
    const txt = doc.body.textContent;
    ok("deadlines page still names the portal in prose",
       /National Scholarship Portal/.test(txt));
    ok("that mention is not a link",
       ![...doc.querySelectorAll("main a")].some(a => a.href.includes("scholarships.gov.in")));
    w.close();
  }

  /* A scheme record may still point at the portal, because that is the
     scheme's own official_website field. Confirm the route is genuinely there
     rather than assuming it. */
  {
    const nsp = DATA.schemes.filter(s => /scholarships\.gov\.in/.test(s.official_website || ""));
    ok("records still carry the portal as their own official_website",
       nsp.length > 0, nsp.length + " records");
    const { w, doc } = await boot("scheme.html", { url: "http://localhost/scheme.html?id=" + nsp[0].id });
    const link = doc.querySelector("main a[href*='scholarships.gov.in']");
    ok("and that field is rendered as the scheme's outbound link", !!link,
       nsp[0].id);
    ok("it opens safely in a new tab",
       !!link && link.getAttribute("rel") === "noopener noreferrer");
    w.close();
  }
}

/* ---------- summary ------------------------------------------------------------------ */
console.log("\n" + (failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"));
process.exit(failures === 0 ? 0 : 1);

} /* main */

main().catch(e => { console.error("\nHARNESS CRASH:", e); process.exit(2); });
