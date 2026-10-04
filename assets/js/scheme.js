/* ==========================================================================
   Yojana Setu — scheme.js
   Detail page.

   Data honesty rules on this page:
   - There is NO "Apply" button. `application_link` does not exist in the
     dataset, so the only outbound action is the scheme's own official website.
   - No deadline, document list or helpline is rendered. The dataset has none,
     and each of those panels says so explicitly rather than omitting silently.
   - `last_verified_date` is not in the dataset, so the facts card shows
     "Not recorded in dataset" instead of the dataset's compile date, which is
     a different thing.
   ========================================================================== */

(function () {
  "use strict";

  const t = (k, v) => YS.i18n.t(k, v);
  const $ = YS.ui.$;
  const $$ = YS.ui.$$;
  const esc = YS.ui.esc;

  let SCHEME = null;

  /* ---------- crumbs -------------------------------------------------------- */
  function crumbs(s) {
    return '<nav class="crumbs" aria-label="Breadcrumb">' +
      '<a href="index.html">' + esc(t("nav.home")) + "</a>" +
      YS.ui.icon("chevronRight") +
      '<a href="explore.html">' + esc(t("nav.explore")) + "</a>" +
      YS.ui.icon("chevronRight") +
      '<a href="explore.html?cat=' + encodeURIComponent(s.category) + '">' + esc(s.category) + "</a>" +
      YS.ui.icon("chevronRight") +
      '<span aria-current="page">' + esc(s.short_name || s.name) + "</span>" +
      "</nav>";
  }

  /* ---------- hero ----------------------------------------------------------- */
  function hero(s) {
    const saved = YS.store.isSaved(s.id);
    const f = s.filter || {};

    return '<section class="detail-hero"><div class="wrap">' +
      crumbs(s) +
      '<div class="detail-badges">' +
        YS.ui.categoryBadge(s) + YS.ui.statusBadge(s) + YS.ui.noAppBadge(s) +
        '<span class="badge badge-neutral">' + esc(YS.store.labelForType(YS.store.typeKey(s))) + "</span>" +
        YS.ui.unverifiedBadge(s) + YS.ui.scopeBadge(s) +
        YS.ui.unstatedBadge(s) + YS.ui.sourceBadge(s) +
      "</div>" +
      '<h1 class="detail-title">' + esc(s.name) + "</h1>" +
      '<p class="detail-sub">' + esc(s.description) + "</p>" +

      /* An unverified record gets a banner, not just a badge: a badge is easy to
         miss on a long page, and this is the difference between "here is a fact"
         and "here is something a person typed from memory". It sits directly
         under the title, before any eligibility claim. */
      (YS.ui.isUnverified(s)
        ? '<div class="notice notice-amber mt-5" style="max-width: 760px" role="note">' +
          YS.ui.icon("alert") +
          "<span><strong>" + esc(t("d.unverifiedTitle")) + "</strong> " +
          esc(t("d.unverifiedBody")) + "</span></div>"
        : "") +

      (s.scope === "State"
        ? '<div class="notice notice-navy mt-4" style="max-width: 760px">' + YS.ui.icon("info") +
          "<span>" + esc(t("d.stateScope")) + "</span></div>"
        : "") +

      '<div class="detail-actions">' +
        '<a class="btn btn-primary" href="' + esc(s.official_website) + '"' +
          ' target="_blank" rel="noopener noreferrer">' +
          YS.ui.icon("external") + '<span>' + esc(t("btn.visit")) + "</span></a>" +
        '<button type="button" class="btn btn-secondary" data-act="save" data-id="' + esc(s.id) + '"' +
          ' aria-pressed="' + (saved ? "true" : "false") + '">' +
          YS.ui.icon(saved ? "bookmarkFill" : "bookmark") +
          "<span>" + esc(saved ? t("btn.saved") : t("btn.save")) + "</span></button>" +
        '<button type="button" class="btn btn-secondary" data-act="compare-toggle" data-id="' + esc(s.id) + '">' +
          YS.ui.icon("scale") + "<span>" + esc(YS.store.isCompared(s.id) ? t("btn.compare") : t("btn.addCompare")) +
          "</span></button>" +
      "</div>" +

      (f.benefits_individual === false
        ? '<div class="notice notice-navy mt-6" style="max-width: 760px">' + YS.ui.icon("info") +
          "<span>" + esc(t("d.notIndividual")) + "</span></div>"
        : "") +

    "</div></section>";
  }

  /* ---------- benefits -------------------------------------------------------- */
  function benefitsPanel(s) {
    const f = s.filter || {};
    const cards = [];

    cards.push({ label: t("card.benefit"), value: s.coverage_amount });

    const aids = (f.aid_type || []).map((a) => YS.ui.titleCase(a));
    if (aids.length) cards.push({ label: t("c.row.aid"), value: aids.join(", ") });
    if (s.launch_year) cards.push({ label: t("c.row.year"), value: String(s.launch_year) });
    cards.push({ label: t("c.row.status"), value: YS.ui.titleCase(s.status) });

    return panel("d.benefits",
      '<div class="benefit-grid">' + cards.map((c) =>
        '<div class="benefit">' +
          '<p class="benefit__label">' + esc(c.label) + "</p>" +
          '<p class="benefit__value">' + esc(c.value) + "</p>" +
        "</div>").join("") + "</div>");
  }

  /* ---------- eligibility ------------------------------------------------------ */
  function eligibilityPanel(s) {
    const lines = YS.ui.eligibilityLines(s);
    const rows = lines.map((l) =>
      '<li class="elig-item' + (l.kind === "unknown" ? " elig-item--unknown" : "") + '">' +
        '<span class="elig-item__icon">' + YS.ui.icon(l.kind === "unknown" ? "alert" : "checkCircle") + "</span>" +
        "<span>" + esc(l.text) + "</span></li>").join("");

    const unknown = lines.filter((l) => l.kind === "unknown");
    const tail = unknown.length
      ? '<p class="elig-source">' + esc(t("f.disability.note")) + "</p>"
      : '<p class="elig-source">' + esc(t("d.changing")) + "</p>";

    return panel("d.eligibility",
      '<ul class="elig-list">' + (rows || '<li class="elig-item elig-item--unknown">' +
        '<span class="elig-item__icon">' + YS.ui.icon("alert") + "</span><span>" +
        esc(t("d.notRecorded")) + "</span></li>") + "</ul>" + tail);
  }

  /* ---------- key features ------------------------------------------------------ */
  function featuresPanel(s) {
    const list = s.key_features || [];
    if (!list.length) return panel("d.features", "");
    return panel("d.features",
      '<ul class="feature-list">' + list.map((f, i) =>
        '<li class="feature"><span class="feature__idx">' + String(i + 1).padStart(2, "0") + "</span>" +
        "<span>" + esc(f) + "</span></li>").join("") + "</ul>");
  }

  /* ---------- how to apply -------------------------------------------------------- */
  /* The dataset has no scheme-specific steps. We render a navigational stepper,
     clearly labelled as such, whose one factual anchor is this record's own
     official website. Nothing here claims to be the scheme's application process. */
  function howToPanel(s) {
    const f = s.filter || {};
    const individual = f.benefits_individual !== false;

    const steps = [];
    steps.push({ known: true, title: t("d.step1"), desc: t("d.step1d") });
    steps.push({ known: true, title: t("d.step2"),
      desc: s.official_website ? s.official_website.replace(/^https?:\/\//, "").replace(/\/$/, "") : t("d.notRecorded") });
    if (individual) {
      steps.push({ known: false, title: t("d.step3"), desc: t("d.step3d") });
      steps.push({ known: false, title: t("d.step4"), desc: t("d.step4d") });
      steps.push({ known: false, title: t("d.step5"), desc: t("d.step5d") });
    }

    return panel("d.howToApply",
      '<div class="notice notice-amber mb-4">' + YS.ui.icon("alert") +
        "<span>" + esc(individual ? t("d.noSteps") : t("d.notIndividual")) + "</span></div>" +
      '<div class="stepper">' + steps.map((st, i) =>
        '<div class="step' + (st.known ? " step--known" : "") + '">' +
          '<span class="step__num">' + String(i + 1).padStart(2, "0") + "</span>" +
          '<div class="step__body"><p class="step__title">' + esc(st.title) + "</p>" +
          '<p class="step__desc">' + esc(st.desc) + "</p></div></div>").join("") + "</div>");
  }

  /* ---------- what the dataset does NOT have ---------------------------------------- */
  function gapsPanel(s) {
    const dq = YS.store.meta().data_quality || {};
    const missing = dq.not_yet_available || [];
    const rows = [
      { icon: "file", label: "Required documents", note: t("d.noDocs") },
      { icon: "clock", label: "Application dates", note: t("d.deadline") },
      { icon: "info", label: "Helpline number", note: t("d.helpline") },
      { icon: "checkCircle", label: t("d.lastVerified"), note: t("d.notRecorded") }
    ];
    return panel("d.important",
      '<div class="notice notice-amber mb-4">' + YS.ui.icon("alert") +
        "<span><strong>" + esc(t("d.unverifiedWarn")) + "</strong></span></div>" +
      '<ul class="stack g-3">' + rows.map((r) =>
        '<li class="elig-item elig-item--unknown">' +
          '<span class="elig-item__icon">' + YS.ui.icon(r.icon) + "</span>" +
          "<span><strong>" + esc(r.label) + "</strong><br>" + esc(r.note) + "</span></li>").join("") + "</ul>" +
      '<p class="elig-source">Not present in this dataset: <code class="fs-xs">' +
        esc(missing.join(", ")) + "</code></p>");
  }

  /* ---------- data notes (_review) ---------------------------------------------------- */
  function reviewPanel(s) {
    const notes = s._review || [];
    if (!notes.length) return "";
    return panel("d.reviewNotes",
      '<ul class="stack g-2">' + notes.map((n) =>
        '<li class="feature"><span class="feature__idx">' + YS.ui.icon("alert") + "</span>" +
        "<span>" + esc(n) + "</span></li>").join("") + "</ul>");
  }

  /* ---------- related ------------------------------------------------------------------- */
  function relatedPanel(s) {
    const list = YS.store.all()
      .filter((x) => x.id !== s.id && x.category === s.category)
      .slice(0, 3);
    if (!list.length) return "";
    return panel("d.related",
      '<div class="card-grid">' + list.map((x) => YS.ui.schemeCard(x, { showCompare: false })).join("") + "</div>");
  }

  /* ---------- facts card -------------------------------------------------------------------- */
  function facts(s) {
    const f = s.filter || {};
    const rows = [];

    rows.push([t("c.row.category"), s.category]);
    rows.push([t("c.row.ministry"), s.ministry]);
    if (s.implementing_body && s.implementing_body !== s.ministry) {
      rows.push([t("c.row.body"), s.implementing_body]);
    }
    rows.push([t("c.row.type"), YS.store.labelForType(YS.store.typeKey(s))]);
    rows.push([t("c.row.level"), (f.education_level || []).map(YS.ui.levelLabel).join(", ")]);
    rows.push([t("c.row.year"), s.launch_year ? String(s.launch_year) : t("d.notRecorded")]);
    rows.push([t("c.row.status"), YS.ui.titleCase(s.status)]);

    /* Income — the three-way honest rendering. */
    let income;
    if (f.benefits_individual === false) income = t("d.incomeNA");
    else if (f.income_criterion === "limit-known") income = YS.ui.rupeesLabel(f.max_income);
    else if (f.income_criterion === "no-limit") income = t("d.incomeNoLimit");
    else income = t("d.incomeUnstated");
    rows.push([t("c.row.income"), income]);

    rows.push([t("c.row.apply"), applicationLabel(f)]);

    const fhtml = rows.map((r) =>
      '<div class="fact"><dt>' + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd></div>").join("");

    return '<aside class="facts" aria-label="' + esc(t("d.quickFacts")) + '">' +
      '<div class="facts__head"><h2>' + esc(t("d.quickFacts")) + "</h2>" +
      "<p>" + esc(t("m.aggregator")) + "</p></div>" +
      '<div class="facts__body">' + fhtml + "</div>" +
      '<div class="facts__cta">' +
        '<a class="btn btn-primary btn-block" href="' + esc(s.official_website) + '"' +
          ' target="_blank" rel="noopener noreferrer">' + YS.ui.icon("external") +
          "<span>" + esc(t("btn.visit")) + "</span></a>" +
        '<button type="button" class="btn btn-secondary btn-block" data-act="save" data-id="' + esc(s.id) + '">' +
          YS.ui.icon(YS.store.isSaved(s.id) ? "bookmarkFill" : "bookmark") +
          "<span>" + esc(YS.store.isSaved(s.id) ? t("btn.saved") : t("btn.save")) + "</span></button>" +
        '<a class="btn btn-ghost btn-sm btn-block" href="deadlines.html">' +
          YS.ui.icon("calendar") + "<span>" + esc(t("dl.h1")) + "</span></a>" +
      "</div></aside>";
  }

  function applicationLabel(f) {
    if (f.benefits_individual === false) return t("badge.inst");
    return YS.store.label("applications", f.application_required || "varies");
  }

  /* ---------- shell -------------------------------------------------------------------------- */
  function panel(title, body) {
    if (!body) return "";
    return '<section class="panel"><h2 class="panel__title">' + esc(title) + "</h2>" + body + "</section>";
  }

  function render(s) {
    SCHEME = s;
    document.title = s.name + " — Yojana Setu";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", String(s.description || s.name || "").slice(0, 160));

    const body =
      panel("d.overview", '<div class="prose">' + esc(s.description) + "</div>") +
      benefitsPanel(s) +
      eligibilityPanel(s) +
      featuresPanel(s) +
      howToPanel(s) +
      gapsPanel(s) +
      reviewPanel(s) +
      relatedPanel(s);

    $("#detailRoot").innerHTML =
      hero(s) +
      '<div class="page"><div class="wrap">' +
        '<div class="detail-layout">' +
          "<div>" + body + "</div>" +
          facts(s) +
        "</div>" +
      "</div></div>";

    YS.ui.setRepaint(() => {
      const el = $(".facts");
      if (el) el.outerHTML = facts(SCHEME);
    });
  }

  /* ---------- boot ------------------------------------------------------------------------------ */
  function ready(err) {
    if (err) {
      $("#detailRoot").innerHTML =
        '<div class="page"><div class="wrap wrap-narrow">' + YS.ui.errorBox(err) + "</div></div>";
      return;
    }
    YS.store.applyLang();

    const id = new URLSearchParams(location.search).get("id");
    const s = id ? YS.store.get(id) : null;

    if (!s) {
      $("#detailRoot").innerHTML =
        '<div class="page"><div class="wrap">' +
          YS.ui.emptyState({
            icon: "search",
            title: t("se.noResults"),
            body: id ? ("No scheme in this dataset has the id “" + id + "”.") : t("se.noResultsP"),
            actions: [{ label: t("nav.explore"), href: "explore.html", cls: "btn-primary" }]
          }) + "</div></div>";
      return;
    }

    render(s);

    /* Compare toggle on the detail page uses its own button. */
    document.addEventListener("click", (e) => {
      const b = e.target.closest('[data-act="compare-toggle"]');
      if (!b) return;
      const r = YS.store.toggleCompare(b.getAttribute("data-id"));
      if (r.full) {
        YS.ui.toast(esc(t("toast.cmpFull", { max: r.max })), { icon: "alert", duration: 4000 });
        return;
      }
      YS.ui.toast(esc(r.on ? t("toast.addedCmp", { n: r.list.length, max: YS.config.compareLimit })
                            : t("toast.removedCmp")), { icon: "scale", duration: 2200 });
      b.querySelector("span").textContent = YS.store.isCompared(SCHEME.id)
        ? t("btn.compare") : t("btn.addCompare");
      const f = $(".facts");
      if (f) f.outerHTML = facts(SCHEME);
    });
  }

  YS.ui.boot("explore", ready);

  YS.onLangChange = function () {
    YS.store.applyLang();
    if (SCHEME) render(SCHEME);
  };
})();
