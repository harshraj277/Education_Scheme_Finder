/* ==========================================================================
   Yojana Setu — ui.js
   --------------------------------------------------------------------------
   Shared components. Everything that renders a scheme reads from the dataset;
   nothing here adds a fact that isn't in the JSON.

   Component list (per spec §24): Navbar, SearchBar, CategoryChip, SchemeCard,
   SchemeBadge, FilterSidebar, FilterDrawer, QuickMatchWizard, EligibilityCard,
   BenefitCard, SchemeDetail, CompareTable, SavedSchemeCard, Calendar,
   LanguageSelector, ThemeToggle, Footer, EmptyState, LoadingSkeleton,
   ToastNotification, Modal, BottomNavigation.
   ========================================================================== */

window.YS = window.YS || {};

YS.ui = (function () {
  "use strict";

  const CFG = YS.config;
  const t = (k, v) => YS.i18n.t(k, v);

  /* ---------- DOM helpers -------------------------------------------------- */

  function el(tag, attrs, html) {
    const n = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach((k) => {
        if (k === "class") n.className = attrs[k];
        else if (k === "dataset") Object.assign(n.dataset, attrs[k]);
        else if (attrs[k] !== null && attrs[k] !== undefined && attrs[k] !== false) {
          n.setAttribute(k, attrs[k]);
        }
      });
    }
    if (html !== undefined && html !== null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s === null || s === undefined ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* ---------- icons -------------------------------------------------------- */

  const ICON = {
    search: '<path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/><path d="m21 21-4.3-4.3"/>',
    bookmark: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z"/>',
    bookmarkFill: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z" fill="currentColor"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    chevronLeft: '<path d="m15 18-6-6 6-6"/>',
    arrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z"/>',
    sliders: '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2" fill="var(--surface)"/><circle cx="15" cy="12" r="2" fill="var(--surface)"/><circle cx="8" cy="18" r="2" fill="var(--surface)"/>',
    scale: '<path d="M12 3v18M7 7h10M5 7l-2 5h4L5 7ZM19 7l-2 5h4l-2-5ZM8 21h8"/>',
    home: '<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10Z"/><path d="M9 22V12h6v10"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-5M12 8h.01"/>',
    alert: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
    award: '<circle cx="12" cy="9" r="6"/><path d="m8.2 14-1.2 7 5-2.6 5 2.6-1.2-7"/>',
    school: '<path d="m3 10 9-5 9 5-9 5-9-5Z"/><path d="M7 12v5c0 1 2.2 2 5 2s5-1 5-2v-5"/>',
    cap: '<path d="m2 8 10-4 10 4-10 4L2 8Z"/><path d="M6 10.5V16c0 1.2 2.7 2.4 6 2.4s6-1.2 6-2.4v-5.5"/>',
    bank: '<path d="M3 10h18M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18M12 3l9 5H3l9-5Z"/>',
    tool: '<path d="M14.7 6.3a4 4 0 0 0 5 5l-9.4 9.4a2.1 2.1 0 0 1-3-3Z"/><path d="M14.7 6.3 17 4a4 4 0 0 1 3 4.3l-2.3 2.3"/>',
    monitor: '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
    heart: '<path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21.4l8.8-8.7a5 5 0 0 0 0-7.1Z"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.3 3.1-5 7-5s7 1.7 7 5"/><path d="M16 5.2a3.5 3.5 0 0 1 0 6.6M18 20c0-2.2-.8-3.7-2-4.6"/>',
    meal: '<path d="M4 3v8a3 3 0 0 0 6 0V3"/><path d="M7 11v10"/><path d="M17 3c-1.5 2-2 4-2 6s.8 3 2 3 2-1 2-3-.5-4-2-6Z"/><path d="M17 12v9"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"/><path d="M14 2v6h6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    building: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/>',
    type: '<path d="M4 7V5h16v2M9 5v14M15 5v14"/>',
    contrast: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>'
  };

  function icon(name, cls) {
    const d = ICON[name] || "";
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' +
      (cls ? ' class="' + cls + '"' : "") + ">" + d + "</svg>";
  }

  /* The site mark. A real logo file now, not the drawn SVG this used to carry,
     so the publisher's own artwork is what ships.

     alt is deliberately empty rather than "Yojana Setu": everywhere this
     appears, the brand name is already in the link as visible text, so naming
     the image too makes a screen reader say the name twice. width/height carry
     the file's real 256x256 so the browser reserves the box before the bytes
     land and the header does not jump. */
  const LOGO_IMG =
    '<img class="logo-img" src="' + esc(CFG.brand.logo) + '" alt="" ' +
    'width="256" height="256" decoding="async">';

  /* ---------- formatting ---------------------------------------------------- */

  function rupees(n) {
    if (n === null || n === undefined) return "";
    if (n >= 10000000) return "₹" + (n / 10000000).toFixed(n % 10000000 === 0 ? 0 : 2) + " crore";
    if (n >= 100000) return "₹" + (n / 100000).toFixed(n % 100000 === 0 ? 0 : 2) + " lakh";
    return "₹" + n.toLocaleString("en-IN");
  }
  function rupeesLabel(n) {
    if (n === null || n === undefined) return t("d.notRecorded");
    return rupees(n) + " / year";
  }
  function levelLabel(key) { return YS.store.label("levels", key); }
  function titleCase(s) { return YS.store.titleCase(s); }
  function isGovHost(url) {
    return /\.gov\.in|\.nic\.in|\.ac\.in/i.test(String(url || ""));
  }

  /* ---------- eligibility highlights (derived, never invented) -------------- */

  /**
   * Builds the check-list under a card. Every line traces to a recorded field.
   * Anything we can't confirm is stated as unknown rather than omitted.
   */
  function eligibilityLines(s) {
    const f = s.filter || {};
    const lines = [];

    if (f.benefits_individual === false) {
      lines.push({ kind: "info", text: t("d.notIndividual") });
    } else {
      if (f.application_required === "none") {
        lines.push({ kind: "ok", text: t("card.noApplication") });
      }
      if (f.min_marks_pct) {
        lines.push({ kind: "ok", text: t("d.minMarks", { pct: f.min_marks_pct }) });
      }
      if (f.min_percentile_xii) {
        lines.push({ kind: "ok", text: "Top " + f.min_percentile_xii + " percentile in Class XII" });
      }
      if (f.only_child_required) {
        lines.push({ kind: "ok", text: t("d.onlyChild") });
      }
      if (f.first_time_borrower_only) {
        lines.push({ kind: "ok", text: t("d.firstTime") });
      }
      if (f.age_min !== undefined && f.age_max !== undefined) {
        lines.push({ kind: "ok", text: t("d.ageRange", { min: f.age_min, max: f.age_max }) });
      }
      if (f.max_child_age_at_opening) {
        lines.push({ kind: "ok", text: "Open until the child turns " + f.max_child_age_at_opening });
      }

      // Income — three distinct honest outcomes.
      const v = f.income_criterion;
      if (v === "limit-known") {
        lines.push({ kind: "ok", text: t("d.incomeKnown", { amt: rupees(f.max_income) }) });
      } else if (v === "no-limit") {
        lines.push({ kind: "ok", text: t("d.incomeNoLimit") });
      } else if (v === "unstated") {
        lines.push({ kind: "unknown", text: t("d.incomeUnstated") });
      }

      if (f.merit_type === "merit") lines.push({ kind: "ok", text: "Merit based" });
      else if (f.merit_type === "means") lines.push({ kind: "ok", text: "Income based" });
      else if (f.merit_type === "both") lines.push({ kind: "ok", text: "Merit + income based" });

      const cats = (f.category || []).filter((c) => c !== "all");
      if (cats.length) {
        lines.push({ kind: "ok", text: "For " + cats.join(", ") + " students" });
      }
      if (f.gender === "female") lines.push({ kind: "ok", text: "For girls / women" });

      if (f.disability === "eligible") {
        lines.push({ kind: "ok", text: "Names a disability provision" });
      }
    }

    // Education level always applies, even for institutional records.
    const lv = (f.education_level || []).filter((x) => x !== "not-applicable");
    if (lv.length) {
      lines.push({
        kind: "ok",
        text: lv.length > 2
          ? "For " + lv.slice(0, 2).map(levelLabel).join(", ").replace(/, ([^,]*)$/, " and $1") + " and more"
          : "For " + lv.map(levelLabel).join(" and ")
      });
    }
    return lines;
  }

  /** 3 compact lines for a card. */
  function cardHighlights(s) {
    return eligibilityLines(s).filter((l) => l.kind !== "info").slice(0, 3);
  }

  /* ---------- badges --------------------------------------------------------- */

  function statusBadge(s) {
    if (s.status === "active") {
      return '<span class="badge badge-active"><span class="dot"></span>' + esc(t("badge.active")) + "</span>";
    }
    return '<span class="badge badge-neutral">' + esc(titleCase(s.status)) + "</span>";
  }
  function categoryBadge(s) {
    return '<span class="badge badge-navy">' + esc(s.category) + "</span>";
  }
  function noAppBadge(s) {
    const f = s.filter || {};
    if (f.benefits_individual === false) {
      return '<span class="badge badge-neutral">' + esc(t("badge.inst")) + "</span>";
    }
    if (f.application_required === "none") {
      return '<span class="badge badge-gold">' + esc(t("badge.noApp")) + "</span>";
    }
    return "";
  }
  function sourceBadge(s) {
    if (!s.official_website) return "";
    return '<span class="badge ' + (isGovHost(s.official_website) ? "badge-source" : "badge-neutral") + '">' +
      icon("external") + esc(t("badge.verifiedSource")) + "</span>";
  }
  function unstatedBadge(s) {
    if ((s.filter || {}).income_criterion === "unstated" && s.filter.benefits_individual !== false) {
      return '<span class="badge badge-amber">' + icon("alert") + esc(t("badge.needsCheck")) + "</span>";
    }
    return "";
  }

  /* Verification tier. A record carries verification:"unverified" when it was
     added from a source that did not check it against its official portal, so it
     is labelled rather than presented as fact. Absent on the original records,
     which are treated as the curated set. */
  function isUnverified(s) { return s && s.verification === "unverified"; }
  function unverifiedBadge(s) {
    if (!isUnverified(s)) return "";
    return '<span class="badge badge-unverified" title="' + esc(t("badge.unverifiedTitle")) + '">' +
      icon("alert") + esc(t("badge.unverified")) + "</span>";
  }
  /* State-scope records sit alongside the central ones, so they are marked
     rather than silently widening what the site claims to cover. */
  function scopeBadge(s) {
    if (!s || s.scope !== "State") return "";
    return '<span class="badge badge-neutral">' + esc(t("badge.state")) + "</span>";
  }

  /* ---------- scheme card ----------------------------------------------------- */

  /**
   * @param {object} s       scheme
   * @param {object} opts    { showCompare, compact }
   */
  function schemeCard(s, opts) {
    const o = opts || {};
    const f = s.filter || {};
    const saved = YS.store.isSaved(s.id);
    const cmp = YS.store.isCompared(s.id);
    const cmpFull = YS.store.compareCount() >= CFG.compareLimit && !cmp;

    const lines = cardHighlights(s);
    const lis = lines.map((l) =>
      '<li>' + icon(l.kind === "unknown" ? "alert" : "check") + "<span>" + esc(l.text) + "</span></li>"
    ).join("");

    const aidChips = (f.aid_type || []).slice(0, 2).map((a) =>
      '<span class="badge badge-neutral">' + esc(titleCase(a)) + "</span>"
    ).join("");

    return '' +
    '<article class="scheme-card" data-scheme="' + esc(s.id) + '">' +
      '<div class="scheme-card__top">' +
        '<div class="scheme-card__badges">' + categoryBadge(s) + statusBadge(s) + "</div>" +
        '<button type="button" class="save-btn" data-act="save" data-id="' + esc(s.id) + '"' +
          ' aria-pressed="' + (saved ? "true" : "false") + '"' +
          ' aria-label="' + esc(saved ? t("card.unsave", { name: s.name }) : t("card.save", { name: s.name })) + '"' +
          ' title="' + esc(saved ? t("btn.saved") : t("btn.save")) + '">' +
          icon(saved ? "bookmarkFill" : "bookmark") +
        "</button>" +
      "</div>" +

      '<h3 class="scheme-card__title">' +
        '<a href="scheme.html?id=' + encodeURIComponent(s.id) + '">' + esc(s.name) + "</a>" +
      "</h3>" +
      '<p class="scheme-card__ministry">' + icon("building") + esc(s.ministry) + "</p>" +

      '<p class="scheme-card__desc">' + esc(s.description) + "</p>" +

      '<div class="scheme-card__benefit">' +
        '<div class="scheme-card__benefit-label">' + esc(t("card.benefit")) + "</div>" +
        '<div class="scheme-card__benefit-text">' + esc(s.coverage_amount) + "</div>" +
      "</div>" +

      (lis ? '<ul class="scheme-card__eligibility">' + lis + "</ul>" : "") +

      '<div class="scheme-card__flags">' + unverifiedBadge(s) + scopeBadge(s) +
        noAppBadge(s) + aidChips + unstatedBadge(s) + sourceBadge(s) + "</div>" +

      '<div class="scheme-card__foot">' +
        '<a class="btn-link" href="scheme.html?id=' + encodeURIComponent(s.id) + '"' +
          ' aria-label="' + esc(t("card.seeDetailA11y", { name: s.name })) + '">' +
          esc(t("btn.viewDetails")) + "</a>" +
        (o.showCompare === false ? "" :
          '<label class="compare-check' + (cmpFull ? " is-disabled" : "") + '">' +
            '<input type="checkbox" data-act="compare" data-id="' + esc(s.id) + '"' +
              (cmp ? "checked" : "") + (cmpFull ? " disabled" : "") + '>' +
            "<span>" + esc(t("btn.compare")) + "</span>" +
          "</label>") +
      "</div>" +
    "</article>";
  }

  /* ---------- states --------------------------------------------------------- */

  function skeletonCards(n) {
    let out = "";
    for (let i = 0; i < (n || 6); i++) {
      out += '<div class="skel" aria-hidden="true">' +
        '<div class="skel__line skel__line--sm"></div>' +
        '<div class="skel__line skel__line--lg"></div>' +
        '<div class="skel__line skel__line--md"></div>' +
        '<div class="skel__block"></div>' +
        '<div class="skel__line skel__line--md"></div>' +
        '<div class="skel__line skel__line--sm"></div>' +
        "</div>";
    }
    return out;
  }
  function loadingBlock(label) {
    return '<p class="sr-only" role="status">' + esc(label || t("st.loading")) + "</p>" +
      '<div class="card-grid" aria-busy="true">' + skeletonCards(6) + "</div>";
  }

  function emptyState(o) {
    return '<div class="empty">' +
      '<div class="empty__icon">' + icon(o.icon || "search") + "</div>" +
      '<h3>' + esc(o.title) + "</h3>" +
      '<p>' + esc(o.body) + "</p>" +
      (o.actions && o.actions.length
        ? '<div class="empty__actions">' + o.actions.map((a) =>
            '<a class="btn ' + (a.cls || "btn-secondary") + '" href="' + esc(a.href) + '">' +
            esc(a.label) + "</a>").join("") + "</div>"
        : "") +
      "</div>";
  }

  function errorBox(err) {
    return '<div class="error-box" role="alert">' +
      '<h3>' + esc(t("st.error")) + "</h3>" +
      '<p>' + esc(t("st.errorP")) + "</p>" +
      "<p>" + esc(t("st.errorFix")) + "</p>" +
      "<code>python -m http.server 8000</code>" +
      '<p class="fs-sm subtle mt-4">' + esc(t("st.errorFix2")) + "</p>" +
      (err ? '<p class="fs-xs subtle mt-2">(' + esc(String(err.message || err)) + ")</p>" : "") +
      '<div class="empty__actions mt-6">' +
        '<button type="button" class="btn btn-primary" data-act="retry">' + icon("arrowRight") + esc(t("btn.retry")) + "</button>" +
      "</div>" +
      "</div>";
  }

  /* ---------- toast ---------------------------------------------------------- */

  function toastHost() {
    let host = $(".toasts");
    if (!host) {
      host = el("div", { class: "toasts", role: "status", "aria-live": "polite" });
      document.body.appendChild(host);
    }
    return host;
  }
  function toast(message, opts) {
    const o = opts || {};
    const host = toastHost();
    const node = el("div", { class: "toast" },
      icon(o.icon || "bookmark") + "<div>" + message + "</div>");
    host.appendChild(node);
    const life = o.duration || 3200;
    setTimeout(() => {
      node.classList.add("is-out");
      setTimeout(() => node.remove(), 220);
    }, life);
    // Keep the stack short.
    while (host.children.length > 3) host.firstChild.remove();
  }

  /* ---------- modal ----------------------------------------------------------- */

  let openModal = null;
  function modal(o) {
    closeModal();
    const scrim = el("div", { class: "scrim" });
    const wrap = el("div", { class: "modal", role: "dialog", "aria-modal": "true", "aria-label": o.title || "Dialog" });
    const panel = el("div", { class: "modal__panel" });
    panel.innerHTML =
      '<div class="modal__head"><div><h2>' + esc(o.title || "") + "</h2>" +
      (o.subtitle ? '<p class="fs-sm muted mt-2">' + esc(o.subtitle) + "</p>" : "") + "</div>" +
      '<button type="button" class="icon-btn" data-close aria-label="' + esc(t("btn.close")) + '">' +
      icon("x") + "</button></div>" +
      '<div class="modal__body">' + (o.body || "") + "</div>" +
      (o.actions ? '<div class="modal__foot">' + o.actions + "</div>" : "");
    wrap.appendChild(panel);
    document.body.appendChild(scrim);
    document.body.appendChild(wrap);
    requestAnimationFrame(() => { scrim.classList.add("is-open"); wrap.classList.add("is-open"); });
    const focusable = panel.querySelector("[data-close]");
    if (focusable) focusable.focus();

    function close() { scrim.remove(); wrap.remove(); openModal = null; document.removeEventListener("keydown", onKey); }
    function onKey(e) { if (e.key === "Escape") close(); }
    document.addEventListener("keydown", onKey);
    scrim.addEventListener("click", close);
    panel.addEventListener("click", (e) => {
      if (e.target.closest("[data-close]")) close();
      if (e.target.closest("[data-modal-action]")) {
        const act = e.target.closest("[data-modal-action]").getAttribute("data-modal-action");
        close();
        if (o.onAction) o.onAction(act);
      }
    });
    openModal = { close: close, panel: panel };
    return openModal;
  }
  function closeModal() { if (openModal) openModal.close(); }

  /* ---------- header ------------------------------------------------------------ */

  function navLinks(active) {
    return [
      { href: "explore.html", label: t("nav.explore"), key: "explore", icon: "compass" },
      { href: "quick-match.html", label: t("nav.quickmatch"), key: "quickmatch", icon: "sliders" },
      { href: "compare.html", label: t("nav.compare"), key: "compare", icon: "scale" },
      { href: "saved.html", label: t("nav.saved"), key: "saved", icon: "bookmark" }
    ];
  }

  function header(active) {
    const links = navLinks(active);
    const savedN = YS.store.savedCount();
    const cmpN = YS.store.compareCount();

    const desktopNav = links.map((l) =>
      '<a class="nav-link' + (l.key === active ? " is-active" : "") + '" href="' + l.href + '">' +
      esc(l.label) +
      (l.key === "saved" && savedN ? '<span class="count-pill">' + savedN + "</span>" : "") +
      (l.key === "compare" && cmpN ? '<span class="count-pill">' + cmpN + "</span>" : "") +
      "</a>"
    ).join("");

    const theme = YS.store.state.theme;
    const themeIcon = theme === "dark" ? "moon" : theme === "light" ? "sun" : "contrast";
    const themeLabel = theme === "dark" ? t("set.themeDark") : theme === "light" ? t("set.themeLight") : t("set.themeAuto");

    return '' +
    '<a class="skip-link" href="#main">' + esc(t("m.skip")) + "</a>" +
    '<header class="site-header" id="siteHeader">' +
      '<div class="header-inner">' +
        '<button type="button" class="icon-btn hide" id="navToggle" aria-label="' + esc(t("nav.menu")) + '" ' +
          'aria-expanded="false" aria-controls="mobileNav" style="display:none">' + icon("menu") + "</button>" +

        '<a class="logo" href="index.html">' +
          '<span class="logo-mark">' + LOGO_IMG + "</span>" +
          '<span class="logo-text">' +
            '<span class="logo-name">' + esc(CFG.brand.name) + "</span>" +
            '<span class="logo-tag" id="brandTagline">' + esc(CFG.brand.tagline) + "</span>" +
          "</span>" +
        "</a>" +

        '<nav class="nav" aria-label="Primary">' + desktopNav + "</nav>" +

        '<div class="header-actions">' +
          '<a class="icon-btn visually-hidden-at-1100" href="explore.html" aria-label="' + esc(t("nav.search")) + '">' +
            icon("search") + "</a>" +

          /* Language */
          '<div class="menu-wrap">' +
            '<button type="button" class="icon-btn" data-menu="langMenu" aria-label="' + esc(t("set.language")) + '"' +
              ' aria-expanded="false" aria-haspopup="true">' + icon("globe") + "</button>" +
            '<div class="menu" id="langMenu" role="menu">' +
              '<p class="menu__label">' + esc(t("set.language")) + "</p>" +
              CFG.langs.map((l) =>
                '<button type="button" class="menu__item" role="menuitem" data-lang="' + l.code + '">' +
                "<span>" + esc(l.native) + "</span>" +
                (l.ready ? (YS.store.state.lang === l.code ? icon("check") : "") :
                  '<span class="badge badge-amber" style="margin-left:auto">' + esc(t("set.langSoon")) + "</span>") +
                "</button>").join("") +
              '<div class="menu__sep"></div>' +
              '<p class="fs-xs subtle" style="padding:0 12px 6px;line-height:1.5">' + esc(t("set.langNoteBody")) + "</p>" +
            "</div>" +
          "</div>" +

          /* Accessibility prefs */
          '<div class="menu-wrap hide" id="a11yWrap">' +
            '<button type="button" class="icon-btn" data-menu="a11yMenu" aria-label="' + esc(t("set.menu")) + '"' +
              ' aria-expanded="false" aria-haspopup="true">' + icon("type") + "</button>" +
            '<div class="menu" id="a11yMenu" role="menu">' +
              '<p class="menu__label">' + esc(t("set.textSize")) + "</p>" +
              [["normal", "set.textNormal"], ["large", "set.textLarge"], ["xlarge", "set.textXLarge"]]
                .map((p) => '<button type="button" class="menu__item" role="menuitemradio" data-textsize="' + p[0] + '"' +
                  ' aria-checked="' + (YS.store.state.prefs.textSize === p[0]) + '"><span>' + esc(t(p[1])) + "</span>" +
                  (YS.store.state.prefs.textSize === p[0] ? icon("check") : "") + "</button>").join("") +
              '<div class="menu__sep"></div>' +
              '<button type="button" class="menu__item" role="menuitemcheckbox" data-contrast="1"' +
                ' aria-checked="' + (YS.store.state.prefs.contrast ? "true" : "false") + '">' +
                icon("contrast") + "<span>" + esc(t("set.contrast")) + "</span>" +
                (YS.store.state.prefs.contrast ? icon("check") : "") + "</button>" +
            "</div>" +
          "</div>" +

          /* Theme */
          '<button type="button" class="icon-btn" id="themeBtn" data-act="theme"' +
            ' aria-label="' + esc(t("set.theme") + ": " + themeLabel) + '" title="' + esc(themeLabel) + '">' +
            icon(themeIcon) + "</button>" +
        "</div>" +
      "</div>" +
    "</header>" +

    /* Mobile drawer */
    '<div class="scrim" id="navScrim"></div>' +
    '<nav class="mobile-nav-panel" id="mobileNav" aria-label="Mobile" aria-hidden="true">' +
      links.map((l) =>
        '<a class="nav-link' + (l.key === active ? " is-active" : "") + '" href="' + l.href + '">' +
        icon(l.icon) + "<span>" + esc(l.label) + "</span></a>").join("") +
      '<a class="nav-link" href="deadlines.html">' + icon("calendar") + "<span>" + esc(t("dl.h1")) + "</span></a>" +
      '<div class="menu__sep"></div>' +
      '<p class="menu__label">' + esc(t("set.language")) + "</p>" +
      CFG.langs.map((l) =>
        '<button type="button" class="menu__item" data-lang="' + l.code + '"><span>' + esc(l.native) + "</span>" +
        (l.ready ? (YS.store.state.lang === l.code ? icon("check") : "") :
          '<span class="badge badge-amber" style="margin-left:auto">soon</span>') + "</button>").join("") +
    "</nav>";
  }

  function mountHeader(active) {
    const host = $("[data-header]");
    if (host) host.innerHTML = header(active);
    const foot = $("[data-footer]");
    if (foot) foot.innerHTML = footer();
    const bn = $("[data-bottomnav]");
    if (bn) bn.innerHTML = bottomNav(active);

    /* Mobile menu toggle — hidden on desktop via inline style for the <1100 case */
    const toggle = $("#navToggle");
    const panel = $("#mobileNav");
    const scrim = $("#navScrim");
    if (toggle) {
      const mq = window.matchMedia("(max-width: 1099px)");
      const sync = () => { toggle.style.display = mq.matches ? "grid" : "none"; };
      sync();
      if (mq.addEventListener) mq.addEventListener("change", sync);
      toggle.addEventListener("click", () => {
        const open = panel.classList.toggle("is-open");
        scrim.classList.toggle("is-open", open);
        panel.setAttribute("aria-hidden", open ? "false" : "true");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }
    if (scrim) scrim.addEventListener("click", () => {
      panel.classList.remove("is-open");
      scrim.classList.remove("is-open");
      panel.setAttribute("aria-hidden", "true");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    });

    /* Sticky header shadow */
    const hdr = $("#siteHeader");
    if (hdr) {
      const onScroll = () => hdr.classList.toggle("is-scrolled", window.scrollY > 4);
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }

    /* Theme cycle */
    const themeBtn = $("#themeBtn");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        const mode = YS.store.cycleTheme();
        const label = mode === "dark" ? t("set.themeDark") : mode === "light" ? t("set.themeLight") : t("set.themeAuto");
        themeBtn.setAttribute("aria-label", t("set.theme") + ": " + label);
        themeBtn.title = label;
        themeBtn.innerHTML = icon(mode === "dark" ? "moon" : mode === "light" ? "sun" : "contrast");
        toast(t("set.theme") + ": " + label, { icon: "contrast", duration: 1600 });
      });
    }

    /* Menus */
    $$("[data-menu]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const menu = document.getElementById(btn.getAttribute("data-menu"));
        const open = menu.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        $$(".menu.is-open").forEach((m) => { if (m !== menu) m.classList.remove("is-open"); });
      });
    });
    document.addEventListener("click", () => {
      $$(".menu.is-open").forEach((m) => m.classList.remove("is-open"));
      $$("[data-menu]").forEach((b) => b.setAttribute("aria-expanded", "false"));
    });

    /* Keep counts live */
    YS.store.on("saved", updateCounts);
    YS.store.on("compare", updateCounts);
    updateCounts();
  }

  function updateCounts() {
    const savedN = YS.store.savedCount();
    const cmpN = YS.store.compareCount();
    const sn = $("[data-saved-count]");
    if (sn) sn.textContent = savedN;
    const cn = $("[data-compare-count]");
    if (cn) cn.textContent = cmpN;
    $$("[data-count-for]").forEach((b) => {
      const which = b.getAttribute("data-count-for");
      const n = which === "saved" ? savedN : cmpN;
      if (n > 0) b.setAttribute("data-count", n); else b.removeAttribute("data-count");
    });
  }

  /* ---------- bottom nav -------------------------------------------------------- */

  function bottomNav(active) {
    const items = [
      { href: "index.html", key: "home", icon: "home", label: t("nav.home") },
      { href: "explore.html", key: "explore", icon: "compass", label: t("nav.explore") },
      { href: "quick-match.html", key: "quickmatch", icon: "sliders", label: t("nav.quickmatch") },
      { href: "compare.html", key: "compare", icon: "scale", label: t("nav.compare"), badge: "compare" },
      { href: "saved.html", key: "saved", icon: "bookmark", label: t("nav.saved"), badge: "saved" }
    ];
    return items.map((i) =>
      '<a href="' + i.href + '"' + (i.key === active ? ' class="is-active" aria-current="page"' : "") + ">" +
      icon(i.icon) + "<span>" + esc(i.label) + "</span>" +
      (i.badge ? '<span class="count-pill" data-' + i.badge + '-count>0</span>' : "") +
      "</a>").join("");
  }

  /* ---------- compare bar --------------------------------------------------------- */

  function compareBar() {
    let bar = $(".cmpbar");
    if (!bar) {
      bar = el("div", { class: "cmpbar" });
      bar.setAttribute("role", "region");
      bar.setAttribute("aria-label", t("btn.compare"));
      document.body.appendChild(bar);
    }
    function paint() {
      const list = YS.store.comparedSchemes();
      const n = list.length;
      bar.classList.toggle("is-up", n > 0);
      if (n === 0) { bar.innerHTML = ""; return; }
      const thumbs = list.map((s) =>
        '<span class="cmpbar__thumb" title="' + esc(s.short_name || s.name) + '">' +
        esc((s.short_name || s.name).slice(0, 2).toUpperCase()) + "</span>").join("");
      bar.innerHTML =
        '<span class="cmpbar__thumbs">' + thumbs + "</span>" +
        '<span class="cmpbar__label"><b>' + n + "</b> / " + CFG.compareLimit + "</span>" +
        '<a class="btn btn-accent btn-sm" href="compare.html">' + esc(t("btn.viewCompare")) + "</a>" +
        '<button type="button" class="icon-btn" data-cmpbar="clear" aria-label="' + esc(t("btn.clear")) + '"' +
          ' style="color:rgba(255,255,255,.7)">' + icon("x") + "</button>";
    }
    paint();
    YS.store.on("compare", paint);
    bar.addEventListener("click", (e) => {
      if (e.target.closest('[data-cmpbar="clear"]')) {
        YS.store.clearCompare();
        toast(t("toast.removedCmp"), { icon: "scale", duration: 2000 });
      }
    });
  }

  /* ---------- footer ---------------------------------------------------------------- */

  function footer() {
    return '' +
    '<footer class="site-footer">' +
      '<div class="wrap">' +
        '<div class="footer-top">' +
          "<div>" +
            '<a class=\"logo\" href=\"index.html\">' +
              '<span class="logo-mark">' + LOGO_IMG + "</span>" +
              '<span class="logo-text"><span class="logo-name">' + esc(CFG.brand.name) + "</span>" +
              '<span class="logo-tag">' + esc(CFG.brand.tagline) + "</span></span>" +
            "</a>" +
            '<p class="footer-blurb">' + esc(t("m.aggregator")) + "</p>" +
          "</div>" +
          "<div>" +
            '<p class="footer-h">' + esc(t("footer.explore")) + "</p>" +
            '<ul class="footer-list">' +
              '<li><a href="explore.html">' + esc(t("nav.explore")) + "</a></li>" +
              '<li><a href="quick-match.html">' + esc(t("nav.quickmatch")) + "</a></li>" +
              '<li><a href="compare.html">' + esc(t("nav.compare")) + "</a></li>" +
              '<li><a href="saved.html">' + esc(t("nav.saved")) + "</a></li>" +
              '<li><a href="deadlines.html">' + esc(t("dl.h1")) + "</a></li>" +
            "</ul>" +
          "</div>" +
          "<div>" +
            '<p class="footer-h">' + esc(t("footer.info")) + "</p>" +
            '<ul class="footer-list">' +
              '<li><a href="#" data-info="about">' + esc(t("footer.about")) + "</a></li>" +
              '<li><a href="#" data-info="accessibility">' + esc(t("footer.a11y")) + "</a></li>" +
              '<li><a href="#" data-info="disclaimer">' + esc(t("footer.disclaimer")) + "</a></li>" +
              '<li><a href="#" data-info="privacy">' + esc(t("footer.privacy")) + "</a></li>" +
              /* The National Scholarship Portal was linked here once. It is
                 third-party infrastructure, not part of this site, and the
                 footer is a list of things this site is — about it, how it
                 treats accessibility, what it claims, what it stores. A
                 government portal sitting in that list alongside our own
                 privacy policy implies we speak for it. Removed at the user's
                 request; the deadlines page still names it in prose, which is
                 the honest way to point at it. */
            "</ul>" +
          "</div>" +
        "</div>" +

        /* Who publishes this site. Sits at the foot of the footer as its own
           strip rather than as a fourth link column, because it is not
           navigation — it is attribution. The college is named here and
           nowhere else on the site, and it is not presented as a source for
           any scheme: every scheme links to its own official site, and none
           of them is this institution.

           The name is a registered proper noun, so it is deliberately not
           translated: "Modern Education Society's College of Engineering,
           Pune" is the name on the affiliation, not a phrase to render in
           another language. Only the label above it is an i18n key. */
        '<div class="footer-inst">' +
          '<img class="footer-inst__logo" src="' + esc(CFG.brand.institution.logo) + '" alt="" ' +
            'width="224" height="224" loading="lazy" decoding="async">' +
          "<div>" +
            '<p class="footer-inst__label">' + esc(t("footer.institution")) + "</p>" +
            '<p class="footer-inst__name">' + esc(CFG.brand.institution.name) + "</p>" +
          "</div>" +
        "</div>" +

        '<div class="footer-disclaimer">' + icon("alert") +
          "<span>" + esc(t("m.aggregator")) + " " + esc(t("d.changing")) + "</span>" +
        "</div>" +
        '<div class="footer-bottom">' +
          "<span>&copy; " + CFG.brand.year + " " + esc(CFG.brand.name) + "</span>" +
          '<span id="footerMeta"></span>' +
        "</div>" +
      "</div>" +
    "</footer>";
  }

  function paintFooterMeta() {
    const m = document.getElementById("footerMeta");
    if (!m) return;
    const meta = YS.store.meta();
    if (!meta || !meta.last_compiled) { m.textContent = ""; return; }
    const bits = [t("footer.compiled", { d: meta.last_compiled })];
    if (meta.enriched_on) bits.push(t("footer.enriched", { d: meta.enriched_on }));
    m.textContent = bits.join(" · ");
  }

  /* ---------- search bar -------------------------------------------------------------- */

  function searchBar(opts) {
    const o = opts || {};
    const id = o.id || "q";
    return '' +
    '<div class="searchbar" data-searchbar>' +
      '<div class="searchbar__field">' + icon("search") +
        '<label class="sr-only" for="' + id + '">' + esc(o.label || t("nav.search")) + "</label>" +
        '<input id="' + id + '" type="search" autocomplete="off" spellcheck="false"' +
          ' placeholder="' + esc(o.placeholder || t("hero.search.ph")) + '"' +
          ' value="' + esc(o.value || "") + '" role="combobox" aria-expanded="false"' +
          ' aria-controls="' + id + '-list" aria-autocomplete="list">' +
        '<button type="button" class="btn btn-primary" data-act="search-go">' +
          icon("arrowRight") + "<span>" + esc(o.button || t("hero.search.btn")) + "</span></button>" +
      "</div>" +
      '<div class="suggest" id="' + id + '-list" role="listbox" hidden></div>' +
    "</div>";
  }

  function wireSearchBar(root, onSubmit) {
    const bar = (root || document).querySelector("[data-searchbar]");
    if (!bar) return null;
    const input = bar.querySelector("input");
    const list = bar.querySelector(".suggest");
    let cursor = -1;
    let items = [];

    function close() { list.hidden = true; list.innerHTML = ""; input.setAttribute("aria-expanded", "false"); cursor = -1; }

    function render() {
      const q = input.value;
      const s = YS.store.suggest(q);
      let html = "";

      if (!q.trim()) {
        html += '<p class="suggest__label">' + esc(t("hero.popular")) + "</p>";
        html += s.popular.map((p) =>
          '<button type="button" class="suggest__item" role="option" data-q="' + esc(p) + '">' +
          icon("clock") + "<span>" + esc(p) + "</span></button>").join("");
        if (s.schemes.length) {
          html += '<div class="menu__sep"></div><p class="suggest__label">' + esc(t("se.schemes")) + "</p>";
          html += s.schemes.map((x) =>
            '<a class="suggest__item" role="option" href="scheme.html?id=' + encodeURIComponent(x.id) + '">' +
            icon("file") + "<span>" + esc(x.short_name || x.name) + "</span>" +
            '<span class="suggest__meta">' + esc(x.category) + "</span></a>").join("");
        }
      } else {
        if (s.schemes.length) {
          html += '<p class="suggest__label">' + esc(t("se.schemes")) + "</p>";
          html += s.schemes.map((x) =>
            '<a class="suggest__item" role="option" href="scheme.html?id=' + encodeURIComponent(x.id) + '">' +
            icon("file") + "<span>" + esc(x.name) + "</span>" +
            '<span class="suggest__meta">' + esc(x.short_name || "") + "</span></a>").join("");
        }
        if (s.categories.length) {
          html += '<p class="suggest__label">' + esc(t("se.categories")) + "</p>";
          html += s.categories.map((c) =>
            '<button type="button" class="suggest__item" role="option" data-cat="' + esc(c) + '">' +
            icon("filter") + "<span>" + esc(c) + "</span></button>").join("");
        }
        if (!s.schemes.length && !s.categories.length) {
          html += '<p class="suggest__label">' + esc(t("se.schemes")) + "</p>";
          html += '<p class="fs-sm subtle" style="padding:8px 12px">' + esc(t("se.noResults")) + "</p>";
        }
      }
      list.innerHTML = html;
      list.hidden = false;
      input.setAttribute("aria-expanded", "true");
      items = Array.prototype.slice.call(list.querySelectorAll("[role='option']"));
      cursor = -1;
    }

    function go() {
      const q = input.value.trim();
      close();
      if (onSubmit) onSubmit(q);
    }

    input.addEventListener("focus", () => { if (input.value.trim() || true) render(); });
    input.addEventListener("input", render);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); go(); return; }
      if (e.key === "Escape") { close(); return; }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!items.length) return;
        cursor = e.key === "ArrowDown"
          ? (cursor + 1) % items.length
          : (cursor - 1 + items.length) % items.length;
        items.forEach((it, i) => it.classList.toggle("is-active", i === cursor));
        if (items[cursor].scrollIntoView) items[cursor].scrollIntoView({ block: "nearest" });
        input.setAttribute("aria-activedescendant", "opt-" + cursor);
      }
    });
    bar.addEventListener("click", (e) => {
      if (e.target.closest('[data-act="search-go"]')) { go(); return; }
      const popular = e.target.closest("[data-q]");
      if (popular) { input.value = popular.getAttribute("data-q"); go(); return; }
      const cat = e.target.closest("[data-cat]");
      if (cat) { close(); if (onSubmit) onSubmit("", cat.getAttribute("data-cat")); }
    });
    document.addEventListener("click", (e) => { if (!bar.contains(e.target)) close(); });

    return { input: input, close: close };
  }

  /* ---------- global delegation (save / compare / lang / prefs) ------------------ */

  function wireGlobal() {
    if (wireGlobal._done) return;   // one set of document listeners, ever
    wireGlobal._done = true;

    document.addEventListener("click", (e) => {
      const save = e.target.closest('[data-act="save"]');
      if (save) {
        e.preventDefault();
        const id = save.getAttribute("data-id");
        const r = YS.store.toggleSave(id);
        const s = YS.store.get(id);
        save.innerHTML = icon(YS.store.isSaved(id) ? "bookmarkFill" : "bookmark");
        save.setAttribute("aria-pressed", YS.store.isSaved(id) ? "true" : "false");
        save.setAttribute("aria-label", YS.store.isSaved(id)
          ? t("card.unsave", { name: s.name }) : t("card.save", { name: s.name }));
        save.classList.add("is-pop");
        setTimeout(() => save.classList.remove("is-pop"), 260);
        toast(esc(r.on ? t("toast.saved", { name: r.name }) : t("toast.unsaved", { name: r.name })),
              { icon: r.on ? "bookmarkFill" : "bookmark" });
        // Repaint cards so the compare checkbox disabled state stays in sync.
        if (o_repaint) o_repaint();
        return;
      }

      const lang = e.target.closest("[data-lang]");
      if (lang) {
        const code = lang.getAttribute("data-lang");
        const res = YS.store.setLang(code);
        $$(".menu.is-open").forEach((m) => m.classList.remove("is-open"));
        if (!res.ready) toast(esc(t("m.languageInProgress")), { icon: "globe", duration: 4200 });
        if (window.YS.onLangChange) YS.onLangChange();
        return;
      }

      const ts = e.target.closest("[data-textsize]");
      if (ts) {
        YS.store.setPref("textSize", ts.getAttribute("data-textsize"));
        $$("[data-textsize]").forEach((b) => b.setAttribute("aria-checked",
          YS.store.state.prefs.textSize === b.getAttribute("data-textsize")));
        return;
      }

      if (e.target.closest("[data-contrast]")) {
        YS.store.setPref("contrast", !YS.store.state.prefs.contrast);
        $$("[data-contrast]").forEach((b) => b.setAttribute("aria-checked",
          YS.store.state.prefs.contrast ? "true" : "false"));
        toast(YS.store.state.prefs.contrast ? t("set.contrastOn") : t("set.contrast"), { icon: "contrast", duration: 1800 });
        return;
      }

      const retry = e.target.closest('[data-act="retry"]');
      if (retry) { location.reload(); return; }

      const info = e.target.closest("[data-info]");
      if (info) { e.preventDefault(); infoModal(info.getAttribute("data-info")); return; }
    });

    document.addEventListener("change", (e) => {
      const cmp = e.target.closest('[data-act="compare"]');
      if (!cmp) return;
      const id = cmp.getAttribute("data-id");
      const r = YS.store.toggleCompare(id);
      if (r.full) {
        cmp.checked = false;
        toast(esc(t("toast.cmpFull", { max: r.max })), { icon: "alert", duration: 4000 });
      } else {
        toast(esc(r.on ? t("toast.addedCmp", { n: r.list.length, max: CFG.compareLimit })
                       : t("toast.removedCmp")), { icon: "scale", duration: 2200 });
      }
      if (o_repaint) o_repaint();
    });
  }

  // Set by a page if it wants cards re-rendered after save/compare.
  let o_repaint = null;
  function setRepaint(fn) { o_repaint = fn; }

  /* ---------- info modals (About / Disclaimer / Privacy / A11y) ----------------- */

  function infoModal(topic) {
    const data = YS.store.meta().data_quality || {};
    const missing = (data.not_yet_available || []).join(", ");
    /* Counts come from the dataset rather than being written into the copy, so the
       About text cannot drift away from what is actually loaded. Older dataset
       files predate the two-tier split; fall back to counting the records. */
    function tier() {
      const t = data.verification_tier || {};
      const all = YS.store.all();
      return {
        curated_count: t.curated_count != null ? t.curated_count
          : all.filter(s => s.verification !== "unverified").length,
        unverified_count: t.unverified_count != null ? t.unverified_count
          : all.filter(s => s.verification === "unverified").length
      };
    }
    const bodies = {
      about:
        "<p>Yojana Setu is an informational aggregator. It reads a single dataset of " +
        esc(String(YS.store.all().length)) + " Government of India education, scholarship and " +
        "skill-development schemes and makes it searchable.</p>" +
        "<p>The records are not all equally trustworthy. " +
        esc(String(tier().curated_count)) + " are curated from a reviewed source compilation; " +
        esc(String(tier().unverified_count)) + " were added from an unverified compilation " +
        "and are badged <strong>Unverified</strong> wherever they appear. Their amounts, " +
        "eligibility and dates may be wrong or out of date.</p>" +
        '<p class="fs-sm subtle mt-4">Dataset last compiled ' + esc(YS.store.meta().last_compiled || "—") +
        (YS.store.meta().enriched_on ? " · filter fields added " + esc(YS.store.meta().enriched_on) : "") + ".</p>",
      disclaimer:
        '<div class="notice notice-amber">' + icon("alert") +
        "<span>" + esc(t("d.changing")) + "</span></div>" +
        '<p class="mt-4">Not available in this dataset: <code class="fs-xs">' + esc(missing || "—") + "</code></p>" +
        "<p class=\"fs-sm subtle mt-4\">We do not publish estimated amounts, guessed deadlines, or " +
        "inferred eligibility. Where a rule is missing, the interface says so instead of filling the gap.</p>",
      privacy:
        "<p>Saved schemes, comparison picks, theme and language live in this browser's " +
        "<code class=\"fs-xs\">localStorage</code> only. Nothing is uploaded, there is no account, " +
        "and no analytics are collected in this build.</p>" +
        '<p class="fs-sm subtle mt-4">Clearing your browser data removes all of it.</p>',
      accessibility:
        "<p>Targets WCAG 2.1 AA. Includes:</p><ul class=\"mt-3 stack g-2 fs-sm\">" +
        "<li>• Keyboard navigation with visible focus rings and a skip link</li>" +
        "<li>• Light and dark themes, plus a high-contrast mode and three text sizes</li>" +
        "<li>• Screen-reader labels on every icon control, live regions for results</li>" +
        "<li>• <code class=\"fs-xs\">prefers-reduced-motion</code> support</li>" +
        "<li>• 44px minimum touch targets, 320px-wide layout</li>" +
        "</ul><p class=\"fs-sm subtle mt-4\">The interface is translated to Hindi. Scheme content " +
        "stays in English so wording matches the government portal.</p>",
      language:
        "<p>" + esc(t("set.langNoteBody")) + "</p>"
    };
    modal({
      title: { about: "About Yojana Setu", disclaimer: "Disclaimer", privacy: "Privacy",
               accessibility: "Accessibility", language: t("set.language") }[topic] || "Information",
      body: bodies[topic] || bodies.about
    });
  }

  /* ---------- boot ------------------------------------------------------------------ */

  /**
   * @param {string} active  nav key
   * @param {function} ready  called after data loads (or after error)
   */
  function boot(active, ready) {
    YS.store.init();
    mountHeader(active);
    wireGlobal();
    compareBar();
    YS.store.on("lang", () => {
      YS.store.applyLang();
      mountHeader(active);
      wireGlobal();
      paintFooterMeta();
    });
    return YS.store.load()
      .then(() => { YS.store.applyLang(); paintFooterMeta(); if (ready) ready(); })
      .catch((err) => { if (ready) ready(err); });
  }

  return {
    el: el, esc: esc, clear: clear, $: $, $$: $$, icon: icon, LOGO_IMG: LOGO_IMG,
    rupees: rupees, rupeesLabel: rupeesLabel, levelLabel: levelLabel, titleCase: titleCase,
    isGovHost: isGovHost,
    eligibilityLines: eligibilityLines, cardHighlights: cardHighlights,
    statusBadge: statusBadge, categoryBadge: categoryBadge, noAppBadge: noAppBadge,
    sourceBadge: sourceBadge, unstatedBadge: unstatedBadge,
    unverifiedBadge: unverifiedBadge, scopeBadge: scopeBadge, isUnverified: isUnverified,
    schemeCard: schemeCard,
    skeletonCards: skeletonCards, loadingBlock: loadingBlock,
    emptyState: emptyState, errorBox: errorBox,
    toast: toast, modal: modal, closeModal: closeModal, infoModal: infoModal,
    header: header, footer: footer, mountHeader: mountHeader, bottomNav: bottomNav,
    paintFooterMeta: paintFooterMeta, compareBar: compareBar, updateCounts: updateCounts,
    searchBar: searchBar, wireSearchBar: wireSearchBar,
    setRepaint: setRepaint,
    boot: boot
  };
})();
