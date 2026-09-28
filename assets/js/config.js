/* ==========================================================================
   Yojana Setu — config.js
   Site constants. No logic, no data. The dataset is the single source of truth
   for scheme facts; this file only holds UI configuration.
   ========================================================================== */

window.YS = window.YS || {};

YS.config = {
  brand: {
    name: "Yojana Setu",
    tagline: "Your bridge to government education schemes",
    taglineHi: "सरकारी शिक्षा योजनाओं तक आपका सेतु",
    year: 2026,

    /* The site's own mark. 256x256 square, opaque WebP — lossy WebP has no alpha
       channel, so the file carries its own background and needs no colour
       behind it. The tile background in CSS is a load placeholder only. */
    logo: "assets/img/logo.webp",

    /* The institution this site was built for. Shown in the footer as an "Our
       institution" strip: a statement of who publishes the site, not a claim
       about any scheme in the dataset. */
    institution: {
      logo: "assets/img/institution.webp",   /* 224x224 square, opaque */
      name: "Modern Education Society's College of Engineering, Pune"
    }
  },

  /* Swap this for a real API endpoint later — the shape is identical. */
  dataUrl: "data/schemes.enriched.json",

  /* Hard ceiling per the comparison spec: 2–3 schemes, no winner scoring. */
  compareLimit: 3,
  compareMin: 2,

  storage: {
    saved: "ys.saved",
    compare: "ys.compare",
    theme: "ys.theme",
    lang: "ys.lang",
    prefs: "ys.prefs",
    filters: "ys.filters"
  },

  langs: [
    { code: "en", label: "English", native: "English", ready: true },
    { code: "hi", label: "Hindi", native: "हिन्दी", ready: true },
    { code: "mr", label: "Marathi", native: "मराठी", ready: false },
    { code: "ta", label: "Tamil", native: "தமிழ்", ready: false },
    { code: "te", label: "Telugu", native: "తెలుగు", ready: false },
    { code: "bn", label: "Bengali", native: "বাংলা", ready: false }
  ],

  /* The hero no longer carries a category chip row — the two hero CTAs and the
     search bar cover it, and the same areas are reachable from the Explorer
     filters and the aid-type row below. `homeChips` was removed with it. */

  /* Sort options. `relevant` = dataset order, which is hand-curated. */
  sorts: [
    { id: "relevant", label: "Most relevant" },
    { id: "name",     label: "Name (A–Z)" },
    { id: "recent",   label: "Newest scheme" },
    { id: "oldest",   label: "Oldest scheme" }
  ],

  /* Categorical chip -> aid_type mapping for the home page. */
  aidChips: [
    { label: "Scholarships",      aid: "scholarship" },
    { label: "Fee Support",       aid: "fee-waiver" },
    { label: "Education Loan",    aid: "loan-subsidy" },
    { label: "Hostel Support",    aid: "hostel" },
    { label: "Device / Laptop",   aid: "device" },
    { label: "Skill Training",    aid: "skill-training" },
    { label: "Digital Education", aid: "digital-content" }
  ]
};
