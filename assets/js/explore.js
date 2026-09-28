/* ==========================================================================
   Yojana Setu — explore.js
   Filter sidebar + results. Desktop sticky sidebar, mobile bottom sheet.
   ========================================================================== */

(function () {
  "use strict";

  const t = (k, v) => YS.i18n.t(k, v);
  const $ = YS.ui.$;
  const $$ = YS.ui.$$;
  const esc = YS.ui.esc;

  const FACET_ORDER = [
    "levels", "categories", "schemeTypes", "beneficiaries", "genders",
    "disability", "aids", "applications"
  ];

  /* ---------- labels for facet values ------------------------------------- */
  /* Single source of truth lives in store.js; the ORDER arrays below only
     decide the sequence the options appear in. */

  const LEVEL_ORDER = ["pre-primary", "school", "undergraduate", "postgraduate", "doctoral",
                       "diploma/vocational", "not-applicable"];
  const AID_ORDER = ["scholarship", "fee-waiver", "loan-subsidy", "hostel", "device", "nutrition",
                     "digital-content", "skill-training", "residential-school", "school-education",
                     "savings-account", "infrastructure", "advocacy", "policy"];
  const TYPE_LABEL = {
    centrallySponsored: "sf.centrallySponsored", centralSector: "sf.centralSector",
    scholarship: "sf.scholarship", loanSubsidy: "sf.loanSubsidy", digital: "sf.digital",
    skill: "sf.skill", smallSavings: "t.smallSavings", policy: "t.policy", board: "t.board",
    other: "t.mixed"
  };
  const TYPE_ORDER = ["centralSector", "centrallySponsored", "scholarship", "loanSubsidy",
                      "digital", "skill", "smallSavings", "board", "policy", "other"];
  const BEN_ORDER = ["all", "SC", "ST", "OBC", "EBC", "DNT", "minority"];
  const APP_ORDER = ["online", "none", "school", "entrance-test", "in-person", "via-employer", "varies"];

  const FACET_TITLE = {
    levels: "f.level", categories: "f.category", schemeTypes: "f.schemeType",
    beneficiaries: "f.beneficiary", genders: "f.gender", disability: "f.disability",
    aids: "f.aid", applications: "f.application",
    /* not real facets — pseudo-groups, but they still need a heading */
    "__income": "f.income", "__inst": "f.inst"
  };

  function labelFor(facetKey, value) {
    if (facetKey === "schemeTypes") {
      return TYPE_LABEL[value] ? t(TYPE_LABEL[value]) : YS.store.titleCase(value);
    }
    if (facetKey === "categories") return YS.store.areaLabel(value);
    return YS.store.label(facetKey, value);
  }

  function orderFor(facetKey, values) {
    const order = facetKey === "levels" ? LEVEL_ORDER
      : facetKey === "aids" ? AID_ORDER
      : facetKey === "schemeTypes" ? TYPE_ORDER
      : facetKey === "beneficiaries" ? BEN_ORDER
      : null;
    if (!order) return values;
    return values.slice().sort((a, b) => {
      const ia = order.indexOf(a), ib = order.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  }

  /* ---------- filter panel -------------------------------------------------- */

  function group(key, bodyHtml, opts) {
    const o = opts || {};
    return '<div class="fgroup" data-open="' + (o.open === false ? "false" : "true") + '">' +
      '<button type="button" class="fgroup__title" aria-expanded="' + (o.open === false ? "false" : "true") + '">' +
        "<span>" + esc(t(FACET_TITLE[key])) + "</span>" + YS.ui.icon("chevronDown") +
      "</button>" +
      '<div class="fgroup__body">' + bodyHtml + "</div></div>";
  }

  function checkRow(facetKey, value, count, checked) {
    return '<label class="check' + (checked ? " is-on" : "") + '">' +
      '<input type="checkbox" data-facet="' + facetKey + '" value="' + esc(value) + '"' +
        (checked ? " checked" : "") + ">" +
      '<span class="check__box">' + YS.ui.icon("check") + "</span>" +
      '<span class="check__label">' + esc(labelFor(facetKey, value)) + "</span>" +
      '<span class="check__count">' + count + "</span></label>";
  }

  function paintFilters(res) {
    const f = res.filters;
    const fac = res.facets || {};
    let html = "";

    /* Education level */
    const lv = orderFor("levels", [...(fac.levels || new Map()).keys()]);
    if (lv.length) {
      html += group("levels",
        lv.map((v) => checkRow("levels", v, fac.levels.get(v), f.levels.indexOf(v) !== -1)).join(""));
    }

    /* Thematic area */
    const areas = YS.store.areasInUse();
    if (areas.length) {
      html += group("categories",
        areas.map((c) => checkRow("categories", c.name, fac.categories ?
          (fac.categories.get(c.name) || 0) : c.count, f.categories.indexOf(c.name) !== -1)).join(""),
        { open: true });
    }

    /* Scheme type — derived from the dataset's own scheme_type values */
    const stKeys = orderFor("schemeTypes", [...(fac.schemeTypes || new Map()).keys()]);
    if (stKeys.length) {
      html += group("schemeTypes",
        stKeys.map((v) => checkRow("schemeTypes", v, fac.schemeTypes.get(v),
          f.schemeTypes.indexOf(v) !== -1)).join(""), { open: false });
    }

    /* Beneficiary category */
    const bens = orderFor("beneficiaries", [...(fac.beneficiaries || new Map()).keys()]);
    if (bens.length) {
      html += group("beneficiaries",
        bens.map((v) => checkRow("beneficiaries", v, fac.beneficiaries.get(v),
          f.beneficiaries.indexOf(v) !== -1)).join(""));
    }

    /* Gender */
    const gs = orderFor("genders", [...(fac.genders || new Map()).keys()]);
    html += group("genders",
      gs.map((v) => checkRow("genders", v, fac.genders.get(v), f.genders.indexOf(v) !== -1)).join(""),
      { open: false });

    /* Disability */
    const disCount = YS.store.facet("disability");
    html += group("disability",
      [["eligible", disCount.get("eligible") || 0], ["unstated", disCount.get("unstated") || 0]]
        .map((p) =>
          '<label class="check' + (f.disability === p[0] ? " is-on" : "") + '">' +
          '<input type="radio" name="fDis" data-facet-radio="disability" value="' + p[0] + '"' +
            (f.disability === p[0] ? " checked" : "") + ">" +
          '<span class="check__box">' + YS.ui.icon("check") + "</span>" +
          '<span class="check__label">' + esc(t(p[0] === "eligible" ? "f.disability.eligible" : "f.disability.unstated")) + "</span>" +
          '<span class="check__count">' + p[1] + "</span></label>").join("") +
      (f.disability ? '<label class="check' + (f.disability === "" ? " is-on" : "") + '">' +
        '<input type="radio" name="fDis" data-facet-radio="disability" value=""' + (f.disability === "" ? " checked" : "") + ">" +
        '<span class="check__box">' + YS.ui.icon("check") + "</span>" +
        '<span class="check__label">' + esc(t("g.all")) + "</span></label>" : "") +
      '<p class="fs-xs subtle mt-2" style="line-height:1.5">' + esc(t("f.disability.note")) + "</p>",
      { open: false });

    /* Aid type */
    const aids = orderFor("aids", [...(fac.aids || new Map()).keys()]);
    if (aids.length) {
      html += group("aids",
        aids.map((v) => checkRow("aids", v, fac.aids.get(v), f.aids.indexOf(v) !== -1)).join(""));
    }

    /* How to apply */
    const apps = [...(fac.applications || new Map()).keys()];
    apps.sort((a, b) => APP_ORDER.indexOf(a) - APP_ORDER.indexOf(b));
    if (apps.length) {
      html += group("applications",
        apps.map((v) => checkRow("applications", v, fac.applications.get(v),
          f.applications.indexOf(v) !== -1)).join(""), { open: false });
    }

    /* Family income — the honest one */
    const bands = YS.store.vocab().income_bands || [];
    const bandChecks = bands.map((b) =>
      '<label class="check' + (f.incomeBandId === b.id ? " is-on" : "") + '">' +
      '<input type="radio" name="fInc" data-band="' + b.id + '"' + (f.incomeBandId === b.id ? " checked" : "") + ">" +
      '<span class="check__box">' + YS.ui.icon("check") + "</span>" +
      '<span class="check__label">' + esc(b.label) + "</span></label>").join("");
    const unstatedCount = YS.store.all().filter((s) =>
      (s.filter || {}).income_criterion === "unstated" && s.filter.benefits_individual !== false).length;

    html += group("__income",
      bandChecks +
      '<label class="check' + (f.includeUnstatedIncome ? " is-on" : "") + '" style="align-items:flex-start">' +
        '<input type="checkbox" data-toggle="includeUnstatedIncome"' + (f.includeUnstatedIncome ? " checked" : "") + ">" +
        '<span class="check__box">' + YS.ui.icon("check") + "</span>" +
        '<span class="check__label">' + esc(t("f.income.includeUnstated")) +
          '<br><span class="fs-xs subtle">' + esc(t("f.income.note")) + "</span></span>" +
        '<span class="check__count">' + unstatedCount + "</span></label>",
      { open: true });

    /* Institutional / policy toggle */
    const instCount = YS.store.all().filter((s) => s.filter && s.filter.benefits_individual === false).length;
    html += group("__inst",
      '<label class="check' + (f.includeInstitutional ? " is-on" : "") + '">' +
        '<input type="checkbox" data-toggle="includeInstitutional"' + (f.includeInstitutional ? " checked" : "") + ">" +
        '<span class="check__box">' + YS.ui.icon("check") + "</span>" +
        '<span class="check__label">' + esc(t("badge.inst")) +
          '<br><span class="fs-xs subtle">' + esc(t("f.inst.note")) + "</span></span>" +
        '<span class="check__count">' + instCount + "</span></label>",
      { open: true });

    $("#filterBody").innerHTML = html;
  }

  /* ---------- active filter chips ------------------------------------------- */

  function paintActive(res) {
    const f = res.filters;
    const host = $("#activeFilters");
    const items = [];

    if (f.q) items.push({ k: "q", label: '“' + f.q + '”' });
    FACET_ORDER.forEach((key) => {
      if (key === "disability") return;
      (f[key] || []).forEach((v) => items.push({ facet: key, value: v, label: labelFor(key, v) }));
    });
    if (f.disability) items.push({ facet: "disability", value: f.disability,
      label: t(f.disability === "eligible" ? "f.disability.eligible" : "f.disability.unstated") });
    if (f.incomeBandId && f.incomeBandId !== "any") {
      const b = (YS.store.vocab().income_bands || []).find((x) => x.id === f.incomeBandId);
      items.push({ k: "income", label: b ? b.label : f.incomeBandId });
    }
    if (f.includeUnstatedIncome) items.push({ k: "unstated", label: "Income unstated included" });
    if (f.includeInstitutional) items.push({ k: "inst", label: t("badge.inst") });

    if (!items.length) { host.innerHTML = ""; return; }

    host.innerHTML = items.map((it, i) =>
      '<span class="active-filter">' + esc(it.label) +
      '<button type="button" data-remove="' + i + '" aria-label="Remove filter">' +
      YS.ui.icon("x") + "</button></span>").join("");

    host._items = items;
  }

  /* ---------- diagnostics banner -------------------------------------------- */

  function paintDiag(res) {
    const host = $("#diagBanner");
    const bits = [];
    if (res.hiddenUnstated > 0) {
      bits.push('<span>' + esc(t("qm.incomeUnknown", { n: res.hiddenUnstated })) + "</span>" +
        '<button type="button" class="btn btn-ghost btn-sm" data-act="show-unstated">' +
        esc(t("qm.showUnknown")) + "</button>");
    }
    if (res.hiddenInstitutional > 0) {
      bits.push("<span>" + esc(t("qm.instHidden", { n: res.hiddenInstitutional })) + "</span>" +
        '<button type="button" class="btn btn-ghost btn-sm" data-act="show-inst">Show them</button>');
    }
    if (!bits.length) { host.innerHTML = ""; return; }
    host.innerHTML = '<div class="notice notice-amber mb-4">' + YS.ui.icon("info") +
      '<span class="row wrapf g-2">' + bits.join("") + "</span></div>";
  }

  /* ---------- results -------------------------------------------------------- */

  function paintResults(res) {
    const host = $("#results");
    host.removeAttribute("aria-busy");

    const n = res.total;
    $("#resultCount").innerHTML = n === 0
      ? '<strong>' + esc(t("se.noFilters")) + "</strong>"
      : "<strong>" + n + "</strong> " + esc(n === 1 ? t("explore.foundOne") : t("explore.found"));

    if (n === 0) {
      const hasFilters = YS.store.activeFilterCount(res.filters) > 0;
      host.innerHTML = YS.ui.emptyState({
        icon: "search",
        title: hasFilters && res.filters.q ? t("se.noResultsQuery", { q: res.filters.q }) : t("se.noResults"),
        body: t("se.noResultsP"),
        actions: [
          { label: t("se.t1"), href: "explore.html", cls: "btn-primary" },
          { label: t("btn.quickMatch"), href: "quick-match.html", cls: "btn-secondary" }
        ]
      });
      return;
    }
    host.innerHTML = '<div class="card-grid">' +
      res.results.map((s) => YS.ui.schemeCard(s)).join("") + "</div>";
  }

  function repaintAll() {
    const res = YS.store.query(null, { facets: true });
    paintFilters(res);
    paintActive(res);
    paintDiag(res);
    paintResults(res);
    const c = YS.store.activeFilterCount(res.filters);
    const badge = $("#filterCountMobile");
    if (badge) {
      if (c > 0) { badge.textContent = c; badge.style.display = ""; }
      else { badge.style.display = "none"; }
    }
    const fbtn = $("#filterOpen");
    if (fbtn) fbtn.classList.toggle("has-filters", c > 0);
  }

  /* ---------- sort select ---------------------------------------------------- */

  function paintSort() {
    const sel = $("#sortSel");
    sel.innerHTML = YS.config.sorts.map((s) =>
      '<option value="' + s.id + '">' + esc(s.label) + "</option>").join("");
    sel.value = YS.store.state.filters.sort || "relevant";
  }

  /* ---------- filter drawer (mobile) ------------------------------------------ */

  function openDrawer(open) {
    const panel = $("#filters");
    const scrim = $("#filterScrim");
    panel.classList.toggle("is-open", open);
    scrim.classList.toggle("is-open", open);
    document.body.style.overflow = open ? "hidden" : "";
    const btn = $("#filterOpen");
    if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      const first = panel.querySelector("input, button");
      if (first) first.focus();
    }
  }

  /* ---------- filter sidebar collapse / expand (desktop) ----------------------- */

  function syncCollapsed(collapsed) {
    const ex = $(".explorer");
    const btn = $("#filterOpen");
    if (ex) ex.classList.toggle("is-collapsed", collapsed);
    if (btn) {
      btn.classList.toggle("is-collapsed", collapsed);
      btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
    }
  }

  function toggleCollapsed() {
    const ex = $(".explorer");
    if (!ex) return;
    const collapsed = !ex.classList.contains("is-collapsed");
    syncCollapsed(collapsed);
    try { localStorage.setItem("ys.explore.collapsed", collapsed ? "1" : "0"); } catch (e) {}
  }

  /* ---------- wiring ------------------------------------------------------------ */

  function wire() {
    const filters = $("#filters");

    /* Collapsible groups */
    filters.addEventListener("click", (e) => {
      const head = e.target.closest(".fgroup__title");
      if (head) {
        const g = head.closest(".fgroup");
        const open = g.getAttribute("data-open") === "true";
        g.setAttribute("data-open", open ? "false" : "true");
        head.setAttribute("aria-expanded", open ? "false" : "true");
        return;
      }
    });

    /* Facet checkboxes */
    filters.addEventListener("change", (e) => {
      const box = e.target.closest("[data-facet]");
      if (box) {
        const facet = box.getAttribute("data-facet");
        const val = box.getAttribute("value");
        const cur = YS.store.state.filters[facet].slice();
        const i = cur.indexOf(val);
        if (box.checked && i === -1) cur.push(val);
        if (!box.checked && i !== -1) cur.splice(i, 1);
        const patch = {}; patch[facet] = cur;
        YS.store.setFilters(patch);
        repaintAll();
        return;
      }

      const radio = e.target.closest("[data-facet-radio]");
      if (radio) {
        YS.store.setFilters({ disability: radio.getAttribute("value") });
        repaintAll();
        return;
      }

      const band = e.target.closest("[data-band]");
      if (band) {
        const id = band.getAttribute("data-band");
        const def = (YS.store.vocab().income_bands || []).find((b) => b.id === id);
        YS.store.setFilters({
          incomeBandId: YS.store.state.filters.incomeBandId === id ? "" : id,
          incomeMax: def ? def.max : null
        });
        repaintAll();
        return;
      }

      const tog = e.target.closest("[data-toggle]");
      if (tog) {
        const key = tog.getAttribute("data-toggle");
        const patch = {};
        patch[key] = tog.checked;
        YS.store.setFilters(patch);
        repaintAll();
      }
    });

    /* Clear */
    ["#clearAllBtn", "#clearAllBtn2"].forEach((sel) => {
      const b = $(sel);
      if (b) b.addEventListener("click", () => {
        YS.store.resetFilters();
        $("#q") ? ($("#q").value = "") : null;
        repaintAll();
        YS.ui.toast(esc(t("se.cleared")), { icon: "filter", duration: 2000 });
      });
    });

    /* Drawer (mobile) / collapse (desktop) */
    const mqDesktop = window.matchMedia("(min-width: 1100px)");
    $("#filterOpen").addEventListener("click", () => {
      if (mqDesktop.matches) toggleCollapsed();
      else openDrawer(true);
    });
    $("#applyBtn").addEventListener("click", () => openDrawer(false));
    $("#filterScrim").addEventListener("click", () => openDrawer(false));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && $("#filters").classList.contains("is-open")) openDrawer(false);
    });

    /* Active filter removal */
    $("#activeFilters").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-remove]");
      if (!btn) return;
      const host = $("#activeFilters");
      const it = (host._items || [])[Number(btn.getAttribute("data-remove"))];
      if (!it) return;
      if (it.k === "q") {
        YS.store.setFilters({ q: "" });
        if ($("#q")) $("#q").value = "";
      } else if (it.k === "income") {
        YS.store.setFilters({ incomeBandId: "", incomeMax: null });
      } else if (it.k === "unstated") {
        YS.store.setFilters({ includeUnstatedIncome: false });
      } else if (it.k === "inst") {
        YS.store.setFilters({ includeInstitutional: false });
      } else if (it.facet === "disability") {
        YS.store.setFilters({ disability: "" });
      } else {
        const cur = YS.store.state.filters[it.facet].slice();
        const i = cur.indexOf(it.value);
        if (i !== -1) cur.splice(i, 1);
        const patch = {}; patch[it.facet] = cur;
        YS.store.setFilters(patch);
      }
      repaintAll();
    });

    /* Diagnostic banner actions */
    $("#diagBanner").addEventListener("click", (e) => {
      if (e.target.closest('[data-act="show-unstated"]')) {
        YS.store.setFilters({ includeUnstatedIncome: true });
        repaintAll();
      } else if (e.target.closest('[data-act="show-inst"]')) {
        YS.store.setFilters({ includeInstitutional: true });
        repaintAll();
      }
    });

    /* Sort */
    $("#sortSel").addEventListener("change", (e) => {
      YS.store.setFilters({ sort: e.target.value });
      repaintAll();
    });

    /* Search */
    $("#exploreSearch").innerHTML = YS.ui.searchBar({
      id: "q",
      placeholder: t("explore.search.ph"),
      button: t("hero.search.btn"),
      value: YS.store.state.filters.q
    });
    YS.ui.wireSearchBar($("#exploreSearch"), (q, cat) => {
      const patch = {};
      if (q !== undefined) patch.q = q;
      if (cat) patch.categories = [cat];
      YS.store.setFilters(patch);
      repaintAll();
    });

    YS.ui.setRepaint(() => {
      const host = $("#results");
      const res = YS.store.query(null, { facets: true });
      if (res.total === 0) return;
      host.innerHTML = '<div class="card-grid">' +
        res.results.map((s) => YS.ui.schemeCard(s)).join("") + "</div>";
    });
  }

  /* ---------- boot --------------------------------------------------------------- */

  function ready(err) {
    if (err) {
      $("#results").innerHTML = YS.ui.errorBox(err);
      $("#results").removeAttribute("aria-busy");
      return;
    }
    YS.store.applyLang();
    paintSort();

    /* URL wins over stored state so shared links work. */
    const fromUrl = YS.store.readUrl();
    if (fromUrl) YS.store.state.filters = fromUrl;

    wire();
    let storedCollapsed = false;
    try { storedCollapsed = localStorage.getItem("ys.explore.collapsed") === "1"; } catch (e) {}
    syncCollapsed(storedCollapsed);
    repaintAll();
  }

  YS.ui.boot("explore", ready);

  YS.onLangChange = function () {
    YS.store.applyLang();
    if (!YS.store.isLoaded()) return;
    paintSort();
    if ($("#q")) $("#q").value = YS.store.state.filters.q;
    YS.ui.wireSearchBar($("#exploreSearch"), (q, cat) => {
      const patch = {};
      if (q !== undefined) patch.q = q;
      if (cat) patch.categories = [cat];
      YS.store.setFilters(patch);
      repaintAll();
    });
    repaintAll();
  };
})();
