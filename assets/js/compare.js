/* ==========================================================================
   Yojana Setu — compare.js

   CompareTable. Deliberately has no score column, no "best match" badge and no
   winner highlighting. Every cell is a value that appears in the dataset, or
   an explicit "not recorded" where the dataset is silent. The user decides.
   ========================================================================== */

(function () {
  "use strict";

  const t = (k, v) => YS.i18n.t(k, v);
  const $ = YS.ui.$;
  const esc = YS.ui.esc;

  /* ---------- cell renderers ------------------------------------------------ */

  function incomeCell(s) {
    const f = s.filter || {};
    if (f.benefits_individual === false) return t("d.incomeNA");
    if (f.income_criterion === "limit-known") return YS.ui.rupeesLabel(f.max_income);
    if (f.income_criterion === "no-limit") return t("d.incomeNoLimit");
    return t("d.incomeUnstated");
  }

  function applyCell(s) {
    const f = s.filter || {};
    if (f.benefits_individual === false) return t("badge.inst");
    return YS.store.label("applications", f.application_required || "varies");
  }

  function eligibilityCell(s) {
    return YS.ui.eligibilityLines(s).slice(0, 6)
      .map((l) => l.text).join("; ") || t("d.notRecorded");
  }

  function ROWS() {
    return [
      { label: t("c.row.category"),   get: (s) => s.category },
      { label: t("c.row.ministry"),   get: (s) => s.ministry },
      { label: t("c.row.body"),       get: (s) => s.implementing_body || t("d.notRecorded") },
      { label: t("c.row.type"),       get: (s) => YS.store.labelForType(YS.store.typeKey(s)) },
      { label: t("c.row.level"),
        get: (s) => (s.filter.education_level || []).map(YS.ui.levelLabel).join(", ") },
      { label: t("c.row.aid"),
        get: (s) => (s.filter.aid_type || []).map(YS.ui.titleCase).join(", ") },
      { label: t("c.row.benefit"),    get: (s) => s.coverage_amount },
      { label: t("c.row.eligibility"), get: eligibilityCell },
      { label: t("c.row.beneficiary"),
        get: (s) => (s.filter.category || []).map(YS.ui.titleCase).join(", ") },
      { label: t("c.row.income"),     get: incomeCell },
      { label: t("c.row.apply"),      get: applyCell },
      { label: t("c.row.year"),
        get: (s) => (s.launch_year ? String(s.launch_year) : t("d.notRecorded")) },
      { label: t("c.row.status"),     get: (s) => YS.ui.titleCase(s.status) },
      { label: t("c.row.source"),
        get: (s) => s.official_website,
        html: (s) => '<a href="' + esc(s.official_website) + '" target="_blank" rel="noopener noreferrer">' +
          esc(s.official_website.replace(/^https?:\/\//, "").replace(/\/$/, "")) +
          " " + YS.ui.icon("external") + "</a>" }
    ];
  }

  /* ---------- table ------------------------------------------------------------ */

  function table(list) {
    const rows = ROWS();
    const head =
      '<tr><th scope="col"><span class="sr-only">' + esc(t("c.h1")) + "</span></th>" +
      list.map((s) =>
        '<th scope="col"><a href="scheme.html?id=' + encodeURIComponent(s.id) + '">' +
          esc(s.short_name || s.name) + "</a>" +
          '<div class="subtle fw-6 mt-2" style="text-transform:none;letter-spacing:0;font-size:12.5px">' +
            esc(YS.store.labelForType(YS.store.typeKey(s))) + "</div>" +
          '<button type="button" class="cmp__remove" data-remove="' + esc(s.id) + '"' +
            ' aria-label="' + esc(t("c.remove", { name: s.short_name || s.name })) + '">' +
            YS.ui.icon("x") + "</button></th>").join("") + "</tr>";

    const body = rows.map((r) =>
      "<tr><th scope=\"row\">" + esc(r.label) + "</th>" +
      list.map((s) => "<td>" + (r.html ? r.html(s) : esc(r.get(s))) + "</td>").join("") +
      "</tr>").join("");

    return '<div class="table-scroll" tabindex="0" role="region"' +
      ' aria-label="' + esc(t("c.h1")) + '">' +
      '<table class="cmp"><caption class="sr-only">' + esc(t("c.sub")) + "</caption>" +
      "<thead>" + head + "</thead><tbody>" + body + "</tbody></table></div>";
  }

  /* ---------- page --------------------------------------------------------------- */

  function render() {
    const host = $("#compareRoot");
    host.removeAttribute("aria-busy");
    const list = YS.store.comparedSchemes();
    const min = YS.config.compareMin;

    if (list.length === 0) {
      host.innerHTML = YS.ui.emptyState({
        icon: "scale",
        title: t("c.empty"),
        body: t("c.emptyP"),
        actions: [
          { label: t("nav.explore"), href: "explore.html", cls: "btn-primary" },
          { label: t("btn.quickMatch"), href: "quick-match.html", cls: "btn-secondary" }
        ]
      });
      return;
    }

    if (list.length < min) {
      host.innerHTML =
        '<div class="notice notice-amber mb-4">' + YS.ui.icon("info") +
        "<span>" + esc(t("c.tooFew", { n: min - list.length })) + "</span></div>" +
        table(list);
      return;
    }

    host.innerHTML = table(list);
  }

  function paintNote() {
    $("#cmpNote").innerHTML = YS.ui.icon("info") +
      "<span><strong>" + esc(t("c.h1")) + "</strong><br>" + esc(t("c.sub")) + "</span>";
  }

  /* ---------- boot ------------------------------------------------------------------ */

  function ready(err) {
    if (err) {
      $("#compareRoot").innerHTML = YS.ui.errorBox(err);
      $("#compareRoot").removeAttribute("aria-busy");
      return;
    }
    YS.store.applyLang();
    paintNote();
    render();

    $("#compareRoot").addEventListener("click", (e) => {
      const rm = e.target.closest("[data-remove]");
      if (rm) {
        YS.store.removeCompare(rm.getAttribute("data-remove"));
        render();
      }
    });

    $("#clearCmp").addEventListener("click", () => {
      if (!YS.store.compareCount()) return;
      YS.ui.modal({
        title: t("btn.clear"),
        subtitle: t("c.emptyP"),
        body: "<p>" + esc(t("c.h1")) + " — " + esc(String(YS.store.compareCount())) + "</p>",
        onAction: (act) => {
          if (act !== "clear-cmp") return;
          YS.store.clearCompare();
          render();
        },
        actions:
          '<button type="button" class="btn btn-secondary" data-close>' + esc(t("btn.close")) + "</button>" +
          '<button type="button" class="btn btn-primary" data-modal-action="clear-cmp">' +
            esc(t("btn.clear")) + "</button>"
      });
    });

    YS.store.on("compare", render);
  }

  YS.ui.boot("compare", ready);

  YS.onLangChange = function () {
    YS.store.applyLang();
    if (!YS.store.isLoaded()) return;
    paintNote();
    render();
  };
})();
