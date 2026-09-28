/* ==========================================================================
   Yojana Setu — home.js
   ========================================================================== */

(function () {
  "use strict";

  const t = (k, v) => YS.i18n.t(k, v);
  const $ = YS.ui.$;

  /* ---------- trust strip: real counts, computed ------------------------- */
  function paintTrust() {
    const areas = YS.store.areasInUse();
    const total = YS.store.all().length;
    const govLinked = YS.store.all().filter((s) => YS.ui.isGovHost(s.official_website)).length;

    /* Number and label are separate nodes with a real space between them, so a
       screen reader announces "24 Central Schemes" rather than "24Central". */
    $("#trustStrip").innerHTML =
      '<div class="trust-item"><span class="trust-num">' + total + "</span> " +
        '<span class="trust-label">' + YS.ui.esc(t("trust.schemes")) + "</span></div>" +
      '<span class="trust-sep" aria-hidden="true"></span>' +
      '<div class="trust-item"><span class="trust-num">' + areas.length + "</span> " +
        '<span class="trust-label">' + YS.ui.esc(t("trust.cats")) + "</span></div>" +
      '<span class="trust-sep" aria-hidden="true"></span>' +
      '<div class="trust-item"><span class="trust-num">' + govLinked + " / " + total + "</span> " +
        '<span class="trust-label">' + YS.ui.esc(t("trust.sources")) +
        '<br><span class="fs-xs subtle">' + YS.ui.esc(t("trust.sources.sub")) + "</span></span></div>";
  }

  /* ---------- honesty notice ---------------------------------------------- */
  function paintNotice() {
    const meta = YS.store.meta();
    const dq = meta.data_quality || {};
    const missing = dq.not_yet_available || [];
    $("#homeNotice").innerHTML =
      YS.ui.icon("alert") +
      "<span><strong>" + YS.ui.esc(t("m.notice")) + "</strong><br>" +
      YS.ui.esc(meta.disclaimer || "") +
      (missing.length
        ? '<br><span class="fs-xs">Not in this dataset: <code>' + YS.ui.esc(missing.join(", ")) +
          "</code>. We surface these gaps rather than filling them in.</span>"
        : "") +
      "</span>";
  }

  /* ---------- hero search -------------------------------------------------- */
  function paintSearch() {
    $("#heroSearch").innerHTML = YS.ui.searchBar({ id: "heroQ" });
    YS.ui.wireSearchBar($("#heroSearch"), (q, cat) => {
      if (cat) location.href = "explore.html?cat=" + encodeURIComponent(cat);
      else if (q) location.href = "explore.html?q=" + encodeURIComponent(q);
      else location.href = "explore.html";
    });
  }

  function paintAidChips() {
    const counts = YS.store.facet("aids");
    $("#aidChips").innerHTML = YS.config.aidChips.map((a) =>
      '<a class="chip" href="explore.html?aid=' + encodeURIComponent(a.aid) + '">' +
      "<span>" + YS.ui.esc(a.label) + "</span>" +
      '<span class="chip__count">' + (counts.get(a.aid) || 0) + "</span></a>"
    ).join("");
  }

  /* ---------- featured grid ---------------------------------------------------- */
  function paintFeatured() {
    const host = $("#featuredGrid");
    /* A deliberately mixed, hand-picked set: the schemes most likely to be
       searched for. Not an endorsement, just a starting shelf. */
    const picks = ["NMMS", "PM-VIDYALAXMI", "PM-YASASVI", "NAVODAYA", "POST-MATRIC-SC", "SWAYAM"];
    const list = picks.map((id) => YS.store.get(id)).filter(Boolean);

    if (!list.length) {
      /* Fall back to the first records if any id was renamed. */
      YS.store.query({ includeInstitutional: false }).results.slice(0, 6);
    }
    host.removeAttribute("aria-busy");
    host.innerHTML = '<div class="card-grid">' +
      list.map((s) => YS.ui.schemeCard(s)).join("") + "</div>";
    YS.ui.setRepaint(() => {
      const fresh = picks.map((id) => YS.store.get(id)).filter(Boolean);
      host.innerHTML = '<div class="card-grid">' +
        fresh.map((s) => YS.ui.schemeCard(s)).join("") + "</div>";
    });
  }

  /* ---------- quick-match step preview ------------------------------------------ */
  function paintQmSteps() {
    const steps = [
      { k: "qm.s1", i: "cap" }, { k: "qm.s2", i: "users" },
      { k: "qm.s3", i: "bank" }, { k: "qm.s4", i: "award" }, { k: "qm.s5", i: "checkCircle" }
    ];
    $("#qmSteps").innerHTML =
      '<div class="stack g-3">' + steps.map((s, i) =>
        '<div class="row g-3" style="padding: var(--sp-3) var(--sp-4); background: var(--surface-muted);' +
        'border-radius: var(--r-md)">' +
          '<span style="width:28px;height:28px;flex:0 0 28px;display:grid;place-items:center;' +
          'background:var(--navy-50);color:var(--navy-700);border-radius:var(--r-xs);' +
          'font-size:12px;font-weight:800">' + (i + 1) + "</span>" +
          '<span class="fw-6 fs-sm grow">' + YS.ui.esc(t(s.k)) + "</span>" +
          '<span style="color: var(--text-subtle)">' + YS.ui.icon(s.i) + "</span>" +
        "</div>").join("") + "</div>";
  }

  /* ---------- boot ---------------------------------------------------------------- */
  function ready(err) {
    if (err) {
      $("#featuredGrid").innerHTML = YS.ui.errorBox(err);
      $("#aidChips").innerHTML = "";
      return;
    }
    YS.store.applyLang();
    paintTrust();
    paintNotice();
    paintSearch();
    paintAidChips();
    paintFeatured();
    paintQmSteps();
  }

  YS.ui.boot("home", ready);

  YS.onLangChange = function () {
    YS.store.applyLang();
    if (!YS.store.isLoaded()) return;
    paintTrust(); paintNotice(); paintAidChips(); paintFeatured(); paintQmSteps();
    YS.ui.wireSearchBar($("#heroSearch"), (q, cat) => {
      if (cat) location.href = "explore.html?cat=" + encodeURIComponent(cat);
      else if (q) location.href = "explore.html?q=" + encodeURIComponent(q);
      else location.href = "explore.html";
    });
  };
})();
