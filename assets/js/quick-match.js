/* ==========================================================================
   Yojana Setu — quick-match.js
   Five-step wizard.

   The wizard never claims a match it cannot support. Two consequences:
   - "State" is asked but cannot filter anything: the dataset is central-only,
     so the step explains that instead of pretending to narrow results.
   - A "No" answer to disability does NOT filter to "unstated". "unstated"
     means the dataset is silent, which is not the same as "no provision",
     so filtering on it would hide the three schemes that do name one.
   ========================================================================== */

(function () {
  "use strict";

  const t = (k, v) => YS.i18n.t(k, v);
  const $ = YS.ui.$;
  const $$ = YS.ui.$$;
  const esc = YS.ui.esc;

  const STEPS = [
    { key: "level",     labelKey: "qm.s1" },
    { key: "profile",   labelKey: "qm.s2" },
    { key: "income",    labelKey: "qm.s3" },
    { key: "aid",       labelKey: "qm.s4" },
    { key: "results",   labelKey: "qm.s5" }
  ];

  let step = 0;
  let dir = "fwd";
  const a = { level: "", gender: "", cat: "", disability: "", income: "", aid: [],
              state: "", _unstated: false, _inst: false };

  /* ---------- option primitives ------------------------------------------ */

  function opt(key, value, label, icon, multi) {
    const list = a[key] || [];
    const val = multi ? list.indexOf(value) !== -1 : a[key] === value;
    const aria = multi
      ? ' aria-pressed="' + (val ? "true" : "false") + '"'
      : ' role="radio" aria-checked="' + (val ? "true" : "false") + '"';
    return '<button type="button" class="opt' + (val ? " is-selected" : "") + '"' +
      ' data-key="' + esc(key) + '" data-value="' + esc(value) + '"' + aria + ">" +
      (icon ? '<span class="opt__icon" aria-hidden="true">' + icon + "</span>" : "") +
      "<span>" + esc(label) + "</span>" +
      '<span class="opt__check">' + YS.ui.icon("check") + "</span>" +
      "</button>";
  }

  function section(key, titleKey, hintKey, optionsHtml) {
    return '<fieldset style="border:0;padding:0;margin:0">' +
      '<legend class="sr-only">' + esc(t(titleKey)) + "</legend>" +
      '<h2>' + esc(t(titleKey)) + "</h2>" +
      (hintKey ? '<p class="hint">' + esc(t(hintKey)) + "</p>" : "") +
      '<div class="opt-grid" role="radiogroup">' + optionsHtml + "</div>" +
      "</fieldset>";
  }

  function sectionMulti(key, titleKey, hintKey, optionsHtml) {
    return '<fieldset style="border:0;padding:0;margin:0">' +
      '<legend class="sr-only">' + esc(t(titleKey)) + "</legend>" +
      '<h2>' + esc(t(titleKey)) + "</h2>" +
      (hintKey ? '<p class="hint">' + esc(t(hintKey)) + "</p>" : "") +
      '<div class="opt-grid">' + optionsHtml + "</div>" +
      "</fieldset>";
  }

  /* ---------- step 1: education ------------------------------------------- */

  const LEVEL_OPTS = [
    ["pre-primary", "Pre-primary", "🧸"],
    ["school", "School (Classes I–XII)", "🏫"],
    ["undergraduate", "Undergraduate", "🎓"],
    ["postgraduate", "Postgraduate", "📚"],
    ["doctoral", "Doctoral / PhD", "🔬"],
    ["diploma/vocational", "Diploma / Vocational", "🛠️"]
  ];

  function stepLevel() {
    return section("level", "qm.q1", "qm.q1h",
      LEVEL_OPTS.map((o) => opt("level", o[0], o[1], o[2])).join(""));
  }

  /* ---------- step 2: profile --------------------------------------------- */

  function stepProfile() {
    const genders = [
      opt("gender", "female", t("qm.gender"), "👧"),
      opt("gender", "male", t("qm.genderM"), "👦"),
      opt("gender", "other", t("qm.genderX"), "⚧")
    ].join("");

    const cats = [
      ["general", "qm.catGeneral"], ["SC", "qm.catSC"], ["ST", "qm.catST"],
      ["OBC", "qm.catOBC"], ["EBC", "qm.catEBC"], ["DNT", "qm.catDNT"],
      ["minority", "qm.catMinority"]
    ].map((c) => opt("cat", c[0], t(c[1]), c[0] === "general" ? "•" : c[0])).join("");

    const dis = [
      opt("disability", "yes", t("qm.disYes"), "✓"),
      opt("disability", "no", t("qm.disNo"), "✗"),
      opt("disability", "skip", t("qm.noAnswer"), "?")
    ].join("");

    return '<h2>' + esc(t("qm.s2")) + "</h2>" +
      '<div class="stack g-8" style="margin-top: var(--sp-6)">' +
        '<div><h3 class="fs-sm muted fw-6 mb-3" style="text-transform:uppercase;letter-spacing:.06em">' +
          esc(t("qm.q2g")) + '</h3><div class="opt-grid" role="radiogroup">' + genders + "</div></div>" +
        '<div><h3 class="fs-sm muted fw-6 mb-3" style="text-transform:uppercase;letter-spacing:.06em">' +
          esc(t("qm.q2c")) + '</h3><div class="opt-grid" role="radiogroup">' + cats + "</div></div>" +
        '<div><h3 class="fs-sm muted fw-6 mb-3" style="text-transform:uppercase;letter-spacing:.06em">' +
          esc(t("qm.q2d")) + '</h3><div class="opt-grid" role="radiogroup">' + dis + "</div></div>" +
        '<div class="notice">' + YS.ui.icon("info") +
          "<span><strong>" + esc(t("qm.q2s")) + "</strong><br>" + esc(t("qm.stateNote")) + "</span></div>" +
      "</div>";
  }

  /* ---------- step 3: income ------------------------------------------------ */

  function stepIncome() {
    const bands = (YS.store.vocab().income_bands || [])
      .filter((b) => b.id !== "any");
    return section("income", "qm.q3", "qm.q3h",
      bands.map((b) => opt("income", b.id, b.label, "₹")).join(""));
  }

  /* ---------- step 4: aid type -------------------------------------------- */

  function stepAid() {
    const aids = YS.store.vocab().aid_type || [];
    return sectionMulti("aid", "qm.q4", "qm.q4h",
      aids.map((x) => opt("aid", x, YS.ui.titleCase(x), null, true)).join(""));
  }

  /* ---------- step 5: results ------------------------------------------------ */

  function buildFilters(extra) {
    const f = YS.store.blankFilters();
    f.levels = a.level ? [a.level] : [];
    f.genders = a.gender && a.gender !== "other" ? [a.gender] : [];
    f.beneficiaries = a.cat && a.cat !== "general" ? [a.cat] : [];
    f.aids = a.aid || [];
    /* "No" and "skip" both leave the filter alone: "unstated" is not "no". */
    f.disability = a.disability === "yes" ? "eligible" : "";
    if (a.income) {
      const b = (YS.store.vocab().income_bands || []).find((x) => x.id === a.income);
      f.incomeBandId = a.income;
      f.incomeMax = b ? b.max : null;
    }
    Object.assign(f, extra || {});
    f.includeUnstatedIncome = !!a._unstated;
    f.includeInstitutional = !!a._inst;
    return f;
  }

  function answerSummary() {
    const rows = [];
    if (a.level) {
      const o = LEVEL_OPTS.find((x) => x[0] === a.level);
      if (o) rows.push([t("qm.s1"), o[1]]);
    }
    if (a.gender) {
      const m = { female: "qm.gender", male: "qm.genderM", other: "qm.genderX" };
      rows.push([t("qm.q2g"), t(m[a.gender])]);
    }
    if (a.cat) {
      const m = { general: "qm.catGeneral", SC: "qm.catSC", ST: "qm.catST", OBC: "qm.catOBC",
                  EBC: "qm.catEBC", DNT: "qm.catDNT", minority: "qm.catMinority" };
      rows.push([t("qm.q2c"), t(m[a.cat])]);
    }
    if (a.disability === "yes") rows.push([t("qm.q2d"), t("qm.disYes")]);
    if (a.income) {
      const b = (YS.store.vocab().income_bands || []).find((x) => x.id === a.income);
      rows.push([t("qm.s3"), b ? b.label : a.income]);
    }
    if (a.aid && a.aid.length) rows.push([t("f.aid"), a.aid.map(YS.ui.titleCase).join(", ")]);
    return rows;
  }

  function stepResults(res) {
    const n = res.total;
    const rows = answerSummary().map((r) =>
      "<div><dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd></div>").join("");

    let head = n === 0
      ? '<div class="empty" style="border-style:solid">' +
        '<div class="empty__icon">' + YS.ui.icon("search") + "</div>" +
        "<h3>" + esc(t("se.noResults")) + "</h3><p>" + esc(t("se.noResultsP")) + "</p>" +
        '<div class="empty__actions">' +
          '<a class="btn btn-primary" href="explore.html">' + esc(t("nav.explore")) + "</a>" +
          '<a class="btn btn-secondary" href="explore.html">' + esc(t("se.t2")) + "</a>" +
        "</div></div>"
      : '<h2>' + esc(n === 1 ? t("qm.resultHeadOne", { n: n }) : t("qm.resultHead", { n: n })) + "</h2>" +
        '<p class="hint">' + esc(t("qm.resultSub")) + "</p>";

    /* Disclosure banners: say what we could not decide, offer to widen. */
    const extra = [];
    if (res.hiddenUnstated > 0) {
      extra.push('<div class="notice notice-amber mb-4">' + YS.ui.icon("alert") +
        '<span>' + esc(t("qm.incomeUnknown", { n: res.hiddenUnstated })) +
        (a._unstated
          ? ""
          : ' <button type="button" class="btn btn-ghost btn-sm" data-act="widen-unstated">' +
            esc(t("qm.showUnknown")) + "</button>") +
        "</span></div>");
    }
    if (res.hiddenInstitutional > 0) {
      extra.push('<div class="notice mb-4">' + YS.ui.icon("info") +
        '<span>' + esc(t("qm.instHidden", { n: res.hiddenInstitutional })) +
        (a._inst
          ? ""
          : ' <button type="button" class="btn btn-ghost btn-sm" data-act="widen-inst">' +
            esc(t("badge.inst")) + "</button>") +
        "</span></div>");
    }

    return head + extra.join("") +
      (rows ? '<div class="qm__summary"><p class="fs-xs fw-7" style="text-transform:uppercase;' +
        'letter-spacing:.07em;margin-bottom:var(--sp-2)">' + esc(t("qm.explain")) + "</p>" +
        "<dl>" + rows + "</dl></div>" : "") +
      (n === 0 ? "" : '<div class="card-grid mt-6">' +
        res.results.map((s) => YS.ui.schemeCard(s)).join("") + "</div>");
  }

  /* ---------- chrome --------------------------------------------------------- */

  function paintBar() {
    $("#stepBar").innerHTML = STEPS.map((s, i) =>
      '<div class="qm__step' + (i < step ? " is-done" : i === step ? " is-current" : "") + '">' +
        '<span class="qm__step-bar"></span>' +
        '<span class="qm__step-label">' + esc(t(s.labelKey)) + "</span>" +
      "</div>").join("");
  }

  function canAdvance() { return step !== 0 || !!a.level; }

  function render() {
    paintBar();
    const bodies = [stepLevel, stepProfile, stepIncome, stepAid];
    const isResults = step === 4;

    const inner = isResults
      ? stepResults(YS.store.query(buildFilters(), { facets: true }))
      : bodies[step]();

    const counter = '<p class="qm__counter">' + (step + 1) + " / " + STEPS.length + "</p>";

    $("#wizard").innerHTML =
      '<div class="qm__panel step-panel' + (dir === "back" ? " is-back" : "") + '">' +
        counter + inner +
        '<div class="qm__foot">' +
          (step > 0
            ? '<button type="button" class="btn btn-secondary" data-act="back">' +
              esc(t("btn.back")) + "</button>"
            : '<span></span>') +
          '<button type="button" class="btn btn-primary" data-act="next"' +
            (isResults ? "" : canAdvance() ? "" : ' aria-disabled="true"') + ">" +
            esc(isResults ? t("btn.explore") : step === 3 ? t("btn.finish") : t("btn.continue")) +
            YS.ui.icon("arrowRight") + "</button>" +
        "</div>" +
      "</div>";

    /* Results step: the primary button hands the wizard's own filters to the
       explorer, so the user lands on a URL they can share. */
    if (isResults) {
      const p = YS.store.filtersToParams(buildFilters());
      const q = p.toString();
      $('[data-act="next"]').setAttribute("data-href", "explore.html" + (q ? "?" + q : ""));
    }
  }

  /* ---------- wiring ------------------------------------------------------------ */

  function wire() {
    $("#wizard").addEventListener("click", (e) => {
      const o = e.target.closest(".opt");
      if (o) {
        const key = o.getAttribute("data-key");
        const val = o.getAttribute("data-value");
        if (key === "aid") {
          const i = a.aid.indexOf(val);
          if (i === -1) a.aid.push(val); else a.aid.splice(i, 1);
        } else {
          a[key] = a[key] === val ? "" : val;   // click again to deselect
        }
        render();
        return;
      }

      const act = e.target.closest("[data-act]");
      if (!act) return;
      const what = act.getAttribute("data-act");

      const href = act.getAttribute("data-href");
      if (href) { location.href = href; return; }

      if (what === "back") { step = Math.max(0, step - 1); dir = "back"; render(); return; }
      if (what === "next") { step = Math.min(STEPS.length - 1, step + 1); dir = "fwd"; render(); return; }
      if (what === "widen-unstated") { a._unstated = true; render(); return; }
      if (what === "widen-inst") { a._inst = true; render(); return; }
    });
  }

  /* ---------- boot ------------------------------------------------------------------ */

  function ready(err) {
    if (err) {
      $("#wizard").innerHTML = '<div class="wrap wrap-narrow" style="padding:0">' +
        YS.ui.errorBox(err) + "</div>";
      return;
    }
    YS.store.applyLang();
    wire();
    render();
  }

  YS.ui.boot("quickmatch", ready);

  YS.onLangChange = function () {
    YS.store.applyLang();
    if (!YS.store.isLoaded()) return;
    render();
  };
})();
