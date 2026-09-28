/* ==========================================================================
   Yojana Setu — deadlines.js

   Calendar.

   The dataset contains ZERO application dates. Rather than ship an empty
   calendar grid or, worse, invent plausible dates, this page explains the gap,
   shows the disabled calendar so the shape of the feature is visible, and
   links to the sources that actually publish the dates.

   If `application_deadline` is ever added to the dataset, `renderRows()`
   switches on and the grid fills in — no other change needed.
   ========================================================================== */

(function () {
  "use strict";

  const t = (k, v) => YS.i18n.t(k, v);
  const $ = YS.ui.$;
  const esc = YS.ui.esc;

  /* ---------- data check -------------------------------------------------------- */

  /** Scans the dataset for any record that actually carries a date. */
  function withDeadlines() {
    return YS.store.all().filter((s) => {
      const f = s.filter || {};
      return !!(s.application_deadline || f.application_deadline ||
                f.last_date_to_apply || f.deadline);
    });
  }

  /* ---------- calendar grid ------------------------------------------------------ */

  /* Days on which at least one scheme's recorded deadline falls. Keys are
     "YYYY-MM-DD" so the grid can mark a cell without re-parsing. */
  function deadlinesByDay(rows) {
    const map = new Map();
    rows.forEach((s) => {
      const raw = s.application_deadline || (s.filter || {}).application_deadline;
      const d = new Date(raw);
      if (isNaN(d.getTime())) return;
      const k = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") +
                "-" + String(d.getDate()).padStart(2, "0");
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(s);
    });
    return map;
  }

  function monthGrid(year, month, marked) {
    const first = new Date(year, month, 1);
    const days = new Date(year, month + 1, 0).getDate();
    const lead = first.getDay();               // 0 = Sunday
    const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dows = ["S", "M", "T", "W", "T", "F", "S"];

    const key = (d) => year + "-" + String(month + 1).padStart(2, "0") +
                       "-" + String(d).padStart(2, "0");

    let cells = "";
    for (let i = 0; i < lead; i++) cells += '<span class="cal__pad"></span>';
    for (let d = 1; d <= days; d++) {
      const hits = marked.get(key(d));
      if (hits) {
        cells += '<span class="cal__day is-set" title="' +
          esc(hits.map(h => h.short_name || h.name).join(", ")) + '">' + d + "</span>";
      } else {
        cells += '<span class="cal__day is-void">' + d + "</span>";
      }
    }

    const any = marked.size > 0;
    return '<div class="cal" aria-hidden="true">' +
      '<div class="cal__head">' +
        '<span class="cal__title">' + names[month] + " " + year + "</span>" +
        '<span class="badge badge-neutral">' +
          esc(any ? marked.size + " " + t("dl.dated") : t("d.notRecorded")) + "</span>" +
      "</div>" +
      '<div class="cal__grid cal__grid--head">' +
        dows.map((x) => "<span>" + x + "</span>").join("") + "</div>" +
      '<div class="cal__grid">' + cells + "</div></div>";
  }

  /* ---------- render ---------------------------------------------------------------- */

  function renderRows(rows) {
    if (!rows.length) return "";
    return '<div class="stack g-3 mt-6">' + rows.map((s) =>
      '<div class="elig-item"><span class="elig-item__icon">' + YS.ui.icon("calendar") + "</span>" +
      "<span><strong>" + esc(s.short_name || s.name) + "</strong><br>" +
      esc(s.application_deadline || s.filter.application_deadline) + "</span></div>").join("") + "</div>";
  }

  function render() {
    const host = $("#calRoot");
    host.removeAttribute("aria-busy");
    const rows = withDeadlines();
    const marked = deadlinesByDay(rows);

    const now = new Date();
    const grid = monthGrid(now.getFullYear(), now.getMonth(), marked);

    host.innerHTML =
      '<div class="notice notice-amber">' + YS.ui.icon("alert") +
        '<span><strong>' + esc(t("dl.none")) + "</strong><br>" + esc(t("dl.noneH")) + "</span></div>" +

      '<div class="sec-head" style="margin-top: var(--sp-10)">' +
        '<h2 style="font-size: 20px">' + esc(t("dl.all")) + "</h2>" +
        "<p>" + esc(t("dl.noneP")) + "</p></div>" +

      grid +
      '<p class="fs-xs subtle tc mt-3">' + esc(t("dl.noFake")) + "</p>" +

      renderRows(rows) +

      /* No outbound link to the National Scholarship Portal here, and none in
         the footer either. It is a third-party site, and this page's whole
         point is that it holds no dates of its own — a button or a chrome
         link to someone else's site overstates what we can tell you, and
         vouching for a government portal in a footer next to our own privacy
         policy implies we speak for it.

         The explanation below stays, and stays deliberately linkless: it tells
         the reader where the real dates are and that this page will fill in
         once application dates are added to the dataset. Naming the portal in
         prose is the honest way to point at it; the reader can reach it, but
         the site is not presenting itself as a gateway to it. */
      '<p class="fs-sm muted tc mt-10" style="max-width: 62ch; margin-inline: auto">' +
        esc(t("dl.ctaP")) + "</p>";
  }

  /* ---------- boot --------------------------------------------------------------------- */

  function ready(err) {
    if (err) {
      $("#calRoot").innerHTML = YS.ui.errorBox(err);
      $("#calRoot").removeAttribute("aria-busy");
      return;
    }
    YS.store.applyLang();
    render();
  }

  YS.ui.boot("deadlines", ready);

  YS.onLangChange = function () {
    YS.store.applyLang();
    if (!YS.store.isLoaded()) return;
    render();
  };
})();
