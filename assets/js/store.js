/* ==========================================================================
   Yojana Setu — store.js
   --------------------------------------------------------------------------
   Owns: dataset loading, the faceted filter engine, saved + compare state,
   theme / language / accessibility prefs, URL sync, and a tiny event bus.

   Data honesty rules enforced here (not in the UI):
   1. A scheme is only ever shown as "you may qualify" when the dataset has a
      recorded rule. Where income_criterion is "unstated", the scheme is EXCLUDED
      from income-specific matching rather than guessed at.
   2. Nothing is ever inferred for a field the dataset omits.
   3. Institutional / policy records (benefits_individual:false) are excluded
      from student-facing results unless explicitly opted in.
   ========================================================================== */

window.YS = window.YS || {};

YS.store = (function () {
  "use strict";

  const CFG = YS.config;
  const KEY = CFG.storage;

  let DATA = null;          // parsed dataset
  let schemes = [];         // convenience alias
  let loadError = null;

  /* ---------- state ------------------------------------------------------ */

  const state = {
    saved: [],
    compare: [],
    theme: "auto",        // auto | light | dark
    lang: "en",
    prefs: { textSize: "normal", contrast: false },
    filters: blankFilters()
  };

  const listeners = {};

  function blankFilters() {
    return {
      q: "",
      levels: [],
      categories: [],
      schemeTypes: [],
      beneficiaries: [],
      genders: [],
      disability: "",
      incomeMax: null,        // number, the top of the user's income band
      incomeBandId: "",
      includeUnstatedIncome: false,
      includeInstitutional: false,
      aids: [],
      applications: [],
      sort: "relevant"
    };
  }

  /* ---------- tiny event bus --------------------------------------------- */

  function on(evt, fn) {
    (listeners[evt] = listeners[evt] || []).push(fn);
    return function off() {
      listeners[evt] = (listeners[evt] || []).filter((f) => f !== fn);
    };
  }
  function emit(evt, payload) {
    (listeners[evt] || []).forEach((fn) => {
      try { fn(payload); } catch (e) { console.error("[YS] listener error on " + evt, e); }
    });
  }

  /* ---------- storage ----------------------------------------------------- */

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode */ }
  }

  function hydrateState() {
    const saved = read(KEY.saved, []);
    const cmp = read(KEY.compare, []);
    const theme = read(KEY.theme, "auto");
    const lang = read(KEY.lang, "en");
    const prefs = read(KEY.prefs, null);

    state.saved = Array.isArray(saved) ? saved.filter(isStr) : [];
    state.compare = Array.isArray(cmp) ? cmp.filter(isStr).slice(0, CFG.compareLimit) : [];
    state.theme = ["auto", "light", "dark"].includes(theme) ? theme : "auto";
    state.lang = isStr(lang) ? lang : "en";
    state.prefs = prefs && typeof prefs === "object"
      ? { textSize: prefs.textSize || "normal", contrast: !!prefs.contrast }
      : { textSize: "normal", contrast: false };
  }

  function isStr(v) { return typeof v === "string" && v.length > 0; }

  /* ---------- dataset ----------------------------------------------------- */

  function load() {
    if (DATA) return Promise.resolve(DATA);
    return fetch(CFG.dataUrl, { cache: "no-cache" })
      .then((res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then((json) => {
        if (!json || !Array.isArray(json.schemes)) throw new Error("Malformed dataset: no schemes array");
        DATA = json;
        schemes = json.schemes;
        // Guard against localStorage pointing at ids that no longer exist.
        const ids = new Set(schemes.map((s) => s.id));
        state.saved = state.saved.filter((id) => ids.has(id));
        state.compare = state.compare.filter((id) => ids.has(id));
        write(KEY.saved, state.saved);
        write(KEY.compare, state.compare);
        emit("data", DATA);
        return DATA;
      })
      .catch((err) => {
        loadError = err;
        emit("error", err);
        throw err;
      });
  }

  function get(id) { return schemes.find((s) => s.id === id) || null; }
  function all() { return schemes; }
  function meta() { return (DATA && DATA.meta) || {}; }
  function vocab() { return (DATA && DATA.filter_vocabulary) || {}; }
  function error() { return loadError; }

  /* ---------- derivations -------------------------------------------------- */

  const TYPE_MAP = [
    { key: "centrallySponsored", test: /centrally sponsored/i },
    { key: "centralSector",      test: /central sector/i },
    { key: "smallSavings",       test: /small savings/i },
    { key: "policy",             test: /policy framework/i },
    { key: "board",              test: /board-administered/i },
    { key: "digital",            test: /digital platform/i }
  ];

  function typeKey(s) {
    const raw = s.scheme_type || "";
    for (const t of TYPE_MAP) if (t.test.test(raw)) return t.key;
    if (/centrally sponsored.*central sector/i.test(raw)) return "centrallySponsored";
    return "other";
  }

  function labelForType(key) {
    const map = {
      centrallySponsored: "t.centrallySponsored",
      centralSector: "t.centralSector",
      smallSavings: "t.smallSavings",
      policy: "t.policy",
      board: "t.board",
      digital: "t.digital"
    };
    return map[key] ? YS.i18n.t(map[key]) : (YS.i18n.t("t.mixed"));
  }

  /* ---------- human labels for vocabulary ids ------------------------------ */
  /* education_level / aid_type / category ship as bare ids. The application
     route ships with labels already, so those are read from data, not here. */

  const LEVEL_LABEL = {
    "pre-primary": "Pre-primary",
    "school": "School",
    "undergraduate": "Undergraduate",
    "postgraduate": "Postgraduate",
    "doctoral": "Doctoral (PhD)",
    "diploma/vocational": "Diploma / Vocational",
    "not-applicable": "Not level-specific"
  };

  const AID_LABEL = {
    "scholarship": "Scholarship",
    "fee-waiver": "Fee support",
    "loan-subsidy": "Education loan / interest subsidy",
    "hostel": "Hostel support",
    "device": "Device / laptop",
    "nutrition": "Nutrition (meal)",
    "digital-content": "Digital learning",
    "skill-training": "Skill training",
    "residential-school": "Residential school",
    "school-education": "School education",
    "savings-account": "Savings account",
    "infrastructure": "Infrastructure (not an individual benefit)",
    "policy": "Policy framework",
    "advocacy": "Advocacy programme"
  };

  const BENEFICIARY_LABEL = {
    all: "Open to all categories",
    SC: "SC", ST: "ST", OBC: "OBC", EBC: "EBC",
    DNT: "DNT / NT / SNT",
    minority: "Minority community"
  };

  const GENDER_LABEL = { all: "Any gender", female: "Female", male: "Male" };

  function titleCase(s) {
    return String(s === null || s === undefined ? "" : s)
      .replace(/[-/]/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase());
  }

  /**
   * @param {string} facet  levels | aids | beneficiaries | genders | applications
   * @param {string} value  a vocabulary id
   */
  function label(facet, value) {
    switch (facet) {
      case "levels":        return LEVEL_LABEL[value] || titleCase(value);
      case "aids":          return AID_LABEL[value] || titleCase(value);
      case "beneficiaries": return BENEFICIARY_LABEL[value] || titleCase(value);
      case "genders":       return GENDER_LABEL[value] || titleCase(value);
      case "applications": {
        const m = (vocab().application_required_labels || {})[value];
        return m || titleCase(value);
      }
      default:              return titleCase(value);
    }
  }

  /* ---------- areas (the thematic axis of record.category) ----------------
     Derived from the records themselves, not from a declared list, so a count
     is never wrong. Social categories live on the other axis
     (filter.category) and are handled by facet("beneficiaries"). */
  function areaCounts() {
    const counts = new Map();
    schemes.forEach((s) => counts.set(s.category, (counts.get(s.category) || 0) + 1));
    return counts;
  }
  function areasInUse() {
    const counts = areaCounts();
    return [...counts.entries()]
      .map(([name, count]) => ({ name: name, label: areaLabel(name), count: count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }
  function areaLabel(name) {
    const m = vocab().area_labels || {};
    return m[name] || name;
  }
  /** Names the dataset declares as areas but which carry zero records. */
  function declaredButEmpty() {
    const counts = areaCounts();
    return (vocab().area || []).filter((a) => !counts.get(a));
  }

  function facet(key) {
    const out = new Map();
    schemes.forEach((s) => {
      const f = s.filter || {};
      let vals = [];
      if (key === "levels") vals = f.education_level || [];
      else if (key === "aids") vals = f.aid_type || [];
      else if (key === "categories") vals = [s.category];
      else if (key === "schemeTypes") vals = [typeKey(s)];
      else if (key === "beneficiaries") vals = f.category || [];
      else if (key === "genders") vals = [f.gender || "all"];
      else if (key === "applications") vals = [f.application_required || "varies"];
      else if (key === "disability") vals = [f.disability || "unstated"];
      vals.forEach((v) => out.set(v, (out.get(v) || 0) + 1));
    });
    return out;
  }

  /* ---------- income matching (the important bit) -------------------------- */

  /**
   * @returns {"match"|"fail"|"unstated"|"na"}
   */
  function incomeVerdict(s, userMax) {
    const f = s.filter || {};
    const crit = f.income_criterion;
    if (crit === "not-applicable") return "na";
    if (crit === "no-limit") return "match";
    if (crit === "unstated" || f.max_income === null || f.max_income === undefined) return "unstated";
    if (userMax === null || userMax === undefined) return "match";
    return f.max_income >= userMax ? "match" : "fail";
  }

  /* ---------- search ------------------------------------------------------- */

  const POPULAR = [
    "scholarship", "PM Vidyalaxmi", "NMMS", "PM-YASASVI",
    "SC scholarship", "girl child", "education loan", "skill"
  ];

  function normalise(str) {
    return String(str || "").toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9₹\s-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function scoreScheme(s, rawQuery) {
    const q = normalise(rawQuery);
    if (!q) return 1;
    const terms = q.split(" ").filter(Boolean);

    const short = normalise(s.short_name);
    const name = normalise(s.name);
    const cat = normalise(s.category);
    const min = normalise(s.ministry);
    const desc = normalise(s.description);
    const feats = normalise((s.key_features || []).join(" "));

    let total = 0;
    let matchedAll = true;

    for (const t of terms) {
      let best = 0;
      if (short === t) best = 120;
      else if (short.indexOf(t) === 0) best = 95;
      else if (name.indexOf(t) === 0) best = 85;
      else if (short.indexOf(t) !== -1) best = 70;
      else if (name.indexOf(t) !== -1) best = 60;
      else if (cat.indexOf(t) !== -1) best = 32;
      else if (min.indexOf(t) !== -1) best = 26;
      else if (feats.indexOf(t) !== -1) best = 14;
      else if (desc.indexOf(t) !== -1) best = 10;
      else if (subsequence(short + " " + name, t)) best = 6;
      if (best === 0) { matchedAll = false; break; }
      total += best;
    }
    return matchedAll ? total : 0;
  }

  function subsequence(haystack, needle) {
    let i = 0;
    for (let j = 0; j < haystack.length && i < needle.length; j++) {
      if (haystack[j] === needle[i]) i++;
    }
    return i === needle.length;
  }

  function search(query, limit) {
    if (!query || !String(query).trim()) {
      return limit ? schemes.slice(0, limit) : schemes.slice();
    }
    const scored = schemes
      .map((s) => ({ s, score: scoreScheme(s, query) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);
    return limit ? scored.slice(0, limit).map((r) => r.s) : scored.map((r) => r.s);
  }

  /** Grouped suggestions for the search dropdown. */
  function suggest(query) {
    const q = String(query || "").trim();
    if (!q) {
      return {
        popular: POPULAR,
        schemes: schemes.slice(0, 5)
      };
    }
    const n = normalise(q);
    return {
      schemes: search(q, 6),
      categories: areasInUse()
        .filter((c) => normalise(c.name).indexOf(n) !== -1)
        .slice(0, 3)
        .map((c) => c.name),
      aidTypes: (vocab().aid_type || []).filter((a) => normalise(a).indexOf(n) !== -1).slice(0, 3)
    };
  }

  /* ---------- the filter engine -------------------------------------------- */

  function passes(s, f, opts) {
    const o = opts || {};

    if (f.q && scoreScheme(s, f.q) === 0) return false;

    if (!o.skipIndividual && f.includeInstitutional !== true) {
      if ((s.filter && s.filter.benefits_individual) === false) return false;
    }

    if (f.levels && f.levels.length) {
      const lv = (s.filter.education_level || []);
      if (!f.levels.some((x) => lv.indexOf(x) !== -1)) return false;
    }
    if (f.categories && f.categories.length) {
      if (f.categories.indexOf(s.category) === -1) return false;
    }
    if (f.schemeTypes && f.schemeTypes.length) {
      if (f.schemeTypes.indexOf(typeKey(s)) === -1) return false;
    }
    if (f.beneficiaries && f.beneficiaries.length) {
      const bcat = s.filter.category || ["all"];
      // "all" in the scheme's list means it is open to every category.
      const open = bcat.indexOf("all") !== -1;
      const hit = f.beneficiaries.some((b) => bcat.indexOf(b) !== -1);
      if (!open && !hit) return false;
    }
    if (f.genders && f.genders.length) {
      const g = s.filter.gender || "all";
      if (g !== "all" && f.genders.indexOf(g) === -1) return false;
    }
    if (f.disability) {
      const d = s.filter.disability || "unstated";
      if (d !== f.disability) return false;
    }
    if (f.aids && f.aids.length) {
      const av = s.filter.aid_type || [];
      if (!f.aids.some((a) => av.indexOf(a) !== -1)) return false;
    }
    if (f.applications && f.applications.length) {
      const ap = s.filter.application_required || "varies";
      if (f.applications.indexOf(ap) === -1) return false;
    }
    if (f.incomeMax !== null && f.incomeMax !== undefined && f.incomeBandId !== "prefer-not") {
      const v = incomeVerdict(s, f.incomeMax);
      if (v === "fail") return false;
      /* o.skipIncomeGate lets the diagnostics count the schemes that WOULD match
         except that the dataset records no income figure for them. Without it
         this branch is unreachable for those records and the "show them"
         offer never appears. */
      if (!o.skipIncomeGate) {
        if (v === "unstated" && !f.includeUnstatedIncome) return false;
        if (v === "na" && !f.includeUnstatedIncome && !f.includeInstitutional) return false;
      }
    }
    return true;
  }

  function sortList(list, sortId) {
    const arr = list.slice();
    switch (sortId) {
      case "name":   return arr.sort((a, b) => a.name.localeCompare(b.name));
      case "recent": return arr.sort((a, b) => (b.launch_year || 0) - (a.launch_year || 0));
      case "oldest": return arr.sort((a, b) => (a.launch_year || 9999) - (b.launch_year || 9999));
      default:       return arr;   // dataset order
    }
  }

  /**
   * @param {object} overrides  filter object (defaults to state.filters)
   * @param {object} opts       { facets:true } to also compute facet counts
   * @returns {{results, hiddenUnstated, hiddenInstitutional, total, facets}}
   */
  function query(overrides, opts) {
    const f = Object.assign(blankFilters(), state.filters, overrides || {});
    const o = opts || {};

    const all_ = schemes;
    const results = sortList(all_.filter((s) => passes(s, f)), f.sort);

    // "Why is my scheme missing?" diagnostics.
    let hiddenUnstated = 0;
    let hiddenInstitutional = 0;
    if (f.incomeMax !== null && f.incomeMax !== undefined && f.incomeBandId !== "prefer-not") {
      all_.forEach((s) => {
        if (s.filter.benefits_individual === false) return;
        if (!passes(s, f, { skipIndividual: true, skipIncomeGate: true })) return;
        if (incomeVerdict(s, f.incomeMax) === "unstated" && !f.includeUnstatedIncome) {
          hiddenUnstated++;
        }
      });
    }
    if (!f.includeInstitutional) {
      all_.forEach((s) => {
        if (s.filter.benefits_individual === false &&
            passes(s, f, { skipIndividual: true })) hiddenInstitutional++;
      });
    }

    let facets = null;
    if (o.facets) {
      facets = {};
      // Standard faceted search: count each facet with the OTHER filters applied.
      ["levels", "categories", "schemeTypes", "beneficiaries", "genders", "aids", "applications"].forEach((key) => {
        const base = Object.assign({}, f);
        base[key] = [];
        const pool = all_.filter((s) => passes(s, base));
        const m = new Map();
        pool.forEach((s) => {
          let vals = [];
          if (key === "levels") vals = s.filter.education_level || [];
          else if (key === "aids") vals = s.filter.aid_type || [];
          else if (key === "categories") vals = [s.category];
          else if (key === "schemeTypes") vals = [typeKey(s)];
          else if (key === "beneficiaries") vals = s.filter.category || [];
          else if (key === "genders") vals = [s.filter.gender || "all"];
          else if (key === "applications") vals = [s.filter.application_required || "varies"];
          vals.forEach((v) => m.set(v, (m.get(v) || 0) + 1));
        });
        facets[key] = m;
      });
    }

    return {
      results: results,
      total: results.length,
      hiddenUnstated: hiddenUnstated,
      hiddenInstitutional: hiddenInstitutional,
      facets: facets,
      filters: f
    };
  }

  /* ---------- filter state + URL ------------------------------------------- */

  function setFilters(patch, opts) {
    state.filters = Object.assign({}, state.filters, patch || {});
    write(KEY.filters, state.filters);
    if (!opts || opts.syncUrl !== false) syncUrl();
    emit("filters", state.filters);
  }
  function resetFilters() {
    const keepSort = state.filters.sort;
    state.filters = blankFilters();
    state.filters.sort = keepSort;
    write(KEY.filters, state.filters);
    syncUrl();
    emit("filters", state.filters);
  }
  function activeFilterCount(f) {
    const g = f || state.filters;
    let n = 0;
    if (g.q) n++;
    ["levels", "categories", "schemeTypes", "beneficiaries", "genders", "aids", "applications"]
      .forEach((k) => { n += (g[k] || []).length; });
    if (g.disability) n++;
    if (g.incomeMax !== null && g.incomeMax !== undefined && g.incomeBandId !== "any" &&
        g.incomeBandId !== "prefer-not") n++;
    if (g.includeUnstatedIncome) n++;
    if (g.includeInstitutional) n++;
    return n;
  }

  function filtersToParams(f) {
    const p = new URLSearchParams();
    const g = f || state.filters;
    if (g.q) p.set("q", g.q);
    if (g.levels.length) p.set("level", g.levels.join(","));
    if (g.categories.length) p.set("cat", g.categories.join(","));
    if (g.schemeTypes.length) p.set("type", g.schemeTypes.join(","));
    if (g.beneficiaries.length) p.set("ben", g.beneficiaries.join(","));
    if (g.genders.length) p.set("gender", g.genders.join(","));
    if (g.aids.length) p.set("aid", g.aids.join(","));
    if (g.applications.length) p.set("apply", g.applications.join(","));
    if (g.disability) p.set("dis", g.disability);
    if (g.incomeBandId) p.set("inc", g.incomeBandId);
    if (g.includeUnstatedIncome) p.set("incUnstated", "1");
    if (g.includeInstitutional) p.set("inst", "1");
    if (g.sort && g.sort !== "relevant") p.set("sort", g.sort);
    return p;
  }

  function paramsToFilters(p) {
    const f = blankFilters();
    const arr = (k) => (p.get(k) ? p.get(k).split(",").filter(Boolean) : []);
    f.q = p.get("q") || "";
    f.levels = arr("level");
    f.categories = arr("cat");
    f.schemeTypes = arr("type");
    f.beneficiaries = arr("ben");
    f.genders = arr("gender");
    f.aids = arr("aid");
    f.applications = arr("apply");
    f.disability = p.get("dis") || "";
    f.incomeBandId = p.get("inc") || "";
    f.includeUnstatedIncome = p.get("incUnstated") === "1";
    f.includeInstitutional = p.get("inst") === "1";
    f.sort = p.get("sort") || "relevant";
    const band = (vocab().income_bands || []).find((b) => b.id === f.incomeBandId);
    f.incomeMax = band ? band.max : null;
    return f;
  }

  let syncing = false;
  function syncUrl() {
    if (syncing) return;
    syncing = true;
    const p = filtersToParams();
    const url = p.toString()
      ? location.pathname + "?" + p.toString()
      : location.pathname;
    history.replaceState(null, "", url);
    syncing = false;
  }
  function readUrl() {
    const p = new URLSearchParams(location.search);
    if ([...p.keys()].length === 0) return null;
    return paramsToFilters(p);
  }

  /* ---------- saved -------------------------------------------------------- */

  function isSaved(id) { return state.saved.indexOf(id) !== -1; }
  function toggleSave(id) {
    const s = get(id);
    const name = s ? s.short_name || s.name : id;
    let on;
    if (isSaved(id)) {
      state.saved = state.saved.filter((x) => x !== id);
      on = false;
    } else {
      state.saved.push(id);
      on = true;
    }
    write(KEY.saved, state.saved);
    emit("saved", { id: id, on: on, count: state.saved.length });
    return { on: on, name: name };
  }
  function removeSaved(id) {
    state.saved = state.saved.filter((x) => x !== id);
    write(KEY.saved, state.saved);
    emit("saved", { id: id, on: false, count: state.saved.length });
  }
  function clearSaved() {
    state.saved = [];
    write(KEY.saved, state.saved);
    emit("saved", { id: null, on: false, count: 0 });
  }
  function savedSchemes() { return state.saved.map(get).filter(Boolean); }

  /* ---------- compare ------------------------------------------------------ */

  function isCompared(id) { return state.compare.indexOf(id) !== -1; }
  function toggleCompare(id) {
    const s = get(id);
    const name = s ? s.short_name || s.name : id;
    if (isCompared(id)) {
      state.compare = state.compare.filter((x) => x !== id);
      write(KEY.compare, state.compare);
      emit("compare", { id: id, on: false, list: state.compare.slice() });
      return { on: false, name: name, list: state.compare.slice() };
    }
    if (state.compare.length >= CFG.compareLimit) {
      emit("compareFull", { name: name, max: CFG.compareLimit });
      return { on: false, full: true, name: name, max: CFG.compareLimit };
    }
    state.compare.push(id);
    write(KEY.compare, state.compare);
    emit("compare", { id: id, on: true, list: state.compare.slice() });
    return { on: true, name: name, list: state.compare.slice() };
  }
  function removeCompare(id) {
    state.compare = state.compare.filter((x) => x !== id);
    write(KEY.compare, state.compare);
    emit("compare", { id: id, on: false, list: state.compare.slice() });
  }
  function clearCompare() {
    state.compare = [];
    write(KEY.compare, state.compare);
    emit("compare", { id: null, on: false, list: [] });
  }
  function comparedSchemes() { return state.compare.map(get).filter(Boolean); }

  /* ---------- theme / prefs / lang ------------------------------------------ */

  function systemPrefersDark() {
    return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }
  function effectiveTheme() {
    return state.theme === "auto" ? (systemPrefersDark() ? "dark" : "light") : state.theme;
  }
  function applyTheme() {
    const t = effectiveTheme();
    document.documentElement.setAttribute("data-theme", t);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t === "dark" ? "#0B1424" : "#FFFFFF");
    emit("theme", t);
  }
  function setTheme(mode) {
    state.theme = mode;
    write(KEY.theme, mode);
    applyTheme();
  }
  function cycleTheme() {
    const order = ["auto", "light", "dark"];
    const next = order[(order.indexOf(state.theme) + 1) % order.length];
    setTheme(next);
    return next;
  }

  function applyPrefs() {
    document.documentElement.setAttribute("data-textsize", state.prefs.textSize || "normal");
    if (state.prefs.contrast) document.documentElement.setAttribute("data-contrast", "high");
    else document.documentElement.removeAttribute("data-contrast");
  }
  function setPref(key, value) {
    state.prefs[key] = value;
    write(KEY.prefs, state.prefs);
    applyPrefs();
    emit("prefs", state.prefs);
  }

  function setLang(code) {
    const res = YS.i18n.set(code);
    state.lang = res.active;
    write(KEY.lang, code);           // remember the REQUEST, not the fallback
    emit("lang", res);
    return res;
  }
  function applyLang() {
    YS.i18n.apply(document);
    document.documentElement.setAttribute("lang", YS.i18n.lang);
  }

  function init() {
    hydrateState();
    applyTheme();
    applyPrefs();
    setLang(state.lang);
    if (window.matchMedia) {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => { if (state.theme === "auto") applyTheme(); };
      if (mq.addEventListener) mq.addEventListener("change", handler);
      else if (mq.addListener) mq.addListener(handler);
    }
  }

  return {
    /* data */
    load: load, get: get, all: all, meta: meta, vocab: vocab, error: error,
    isLoaded: () => !!DATA,
    /* derivations */
    areasInUse: areasInUse, areaLabel: areaLabel, declaredButEmpty: declaredButEmpty,
    typeKey: typeKey, labelForType: labelForType, facet: facet,
    label: label, titleCase: titleCase,
    LEVEL_LABEL: LEVEL_LABEL, AID_LABEL: AID_LABEL, BENEFICIARY_LABEL: BENEFICIARY_LABEL,
    incomeVerdict: incomeVerdict,
    /* search */
    search: search, suggest: suggest, scoreScheme: scoreScheme, POPULAR: POPULAR,
    /* filters */
    blankFilters: blankFilters, setFilters: setFilters, resetFilters: resetFilters,
    activeFilterCount: activeFilterCount, query: query,
    filtersToParams: filtersToParams, paramsToFilters: paramsToFilters,
    readUrl: readUrl, syncUrl: syncUrl,
    /* saved */
    isSaved: isSaved, toggleSave: toggleSave, removeSaved: removeSaved,
    clearSaved: clearSaved, savedSchemes: savedSchemes,
    savedCount: () => state.saved.length,
    /* compare */
    isCompared: isCompared, toggleCompare: toggleCompare, removeCompare: removeCompare,
    clearCompare: clearCompare, comparedSchemes: comparedSchemes,
    compareCount: () => state.compare.length,
    /* prefs */
    setTheme: setTheme, cycleTheme: cycleTheme, effectiveTheme: effectiveTheme,
    setPref: setPref, setLang: setLang, applyLang: applyLang, applyTheme: applyTheme,
    get state() { return state; },
    /* bus */
    on: on, emit: emit,
    init: init
  };
})();
