/* ==========================================================================
   Yojana Setu — i18n.js
   --------------------------------------------------------------------------
   Deliberate scope limit: this file translates the INTERFACE CHROME only
   (buttons, labels, headings, empty states).

   It does NOT translate scheme data. Scheme names, ministry names, eligibility
   text and benefit amounts come from the dataset in English only. Inventing
   translations of government scheme content would be a correctness risk, so
   the UI surfaces an explicit notice instead when a non-English language is
   active.

   English and Hindi are marked ready:true. The other four languages ship as
   selector entries with ready:false so the structure is in place and the gap
   is visible, rather than shipping low-confidence machine translations of a
   government service.
   ========================================================================== */

window.YS = window.YS || {};

YS.i18n = (function () {
  "use strict";

  const STRINGS = {
    en: {
      /* nav */
      "nav.explore": "Explore",
      "nav.quickmatch": "Quick Match",
      "nav.compare": "Compare",
      "nav.saved": "Saved",
      "nav.home": "Home",
      "nav.menu": "Menu",
      "nav.search": "Search",

      /* hero */
      "hero.eyebrow": "Aggregator",
      "hero.eyebrow.text": "24 central schemes, one place",
      "hero.h1a": "Find education schemes",
      "hero.h1b": "you may qualify for",
      "hero.sub": "Discover scholarships, education loans, skill programs and other government education benefits in one place.",
      "hero.cta1": "Find My Schemes",
      "hero.cta2": "Browse All Schemes",
      "hero.search.ph": "Search scholarships, schemes, loans, education...",
      "hero.search.btn": "Search",
      "hero.popular": "Popular searches",

      /* trust */
      "trust.schemes": "Central Schemes",
      "trust.cats": "Categories",
      "trust.sources": "Official Sources",
      "trust.sources.sub": "every record links to a .gov.in site",

      /* generic */
      "btn.apply": "Apply Filters",
      "btn.clear": "Clear all",
      "btn.clearFilters": "Clear",
      "btn.viewDetails": "View Details",
      "btn.continue": "Continue",
      "btn.back": "Back",
      "btn.finish": "See my results",
      "btn.retry": "Try Again",
      "btn.explore": "Explore Schemes",
      "btn.quickMatch": "Use Quick Match",
      "btn.close": "Close",
      "btn.save": "Save",
      "btn.saved": "Saved",
      "btn.remove": "Remove",
      "btn.visit": "Visit Official Government Website",
      "btn.compare": "Compare",
      "btn.addCompare": "Add to compare",
      "btn.viewCompare": "View comparison",

      /* cards */
      "card.benefit": "Benefit",
      "card.ministry": "Ministry",
      "card.save": "Save {name}",
      "card.unsave": "Remove {name} from saved",
      "card.noApplication": "No application needed",
      "card.officialSource": "Official Source",
      "card.openToAll": "Open to everyone",
      "card.incomeUnstated": "Income criteria not in dataset",
      "card.seeDetailA11y": "View details for {name}",

      /* badges */
      "badge.active": "Active",
      "badge.noApp": "No Application",
      "badge.inst": "Institutional",
      "badge.verifiedSource": "Official source",
      "badge.needsCheck": "Verify income",

      /* explorer */
      "explore.eyebrow": "Explore",
      "explore.h1": "Find government education schemes",
      "explore.sub": "Filter the dataset by education level, benefit type and income ceiling. Counts update live.",
      "explore.search.ph": "Search schemes...",
      "explore.found": "schemes found",
      "explore.foundOne": "scheme found",
      "explore.filters": "Filters",
      "explore.sort": "Sort",
      "explore.clearAll": "Clear all",
      "explore.activeFilters": "Active filters",

      /* filter groups */
      "f.level": "Education Level",
      "f.category": "Category",
      "f.schemeType": "Scheme Type",
      "f.beneficiary": "Beneficiary Category",
      "f.gender": "Gender",
      "f.disability": "Disability Provision",
      "f.income": "Family Income",
      "f.aid": "Aid Required",
      "f.application": "How to Apply",
      "f.inst": "Programme & Policy Records",
      "f.inst.note": "Programmes and policies you benefit from but cannot apply to individually.",

      "f.income.any": "Any income",
      "f.income.upto": "Up to {amt}",
      "f.income.includeUnstated": "Include schemes whose income limit isn't in the dataset",
      "f.income.note": "The dataset records an income ceiling for only some schemes. Where it's missing we can't tell you whether you qualify.",

      "f.disability.eligible": "Names a disability provision",
      "f.disability.unstated": "Not mentioned in dataset",
      "f.disability.note": "\"Not mentioned\" means the dataset is silent, not that the scheme excludes anyone.",

      "g.all": "All",
      "g.female": "Female",
      "g.male": "Male",
      "g.maleOrFemale": "Any gender",

      /* scheme type */
      "t.centralSector": "Central Sector Scheme",
      "t.centrallySponsored": "Centrally Sponsored Scheme",
      "t.scholarship": "Scholarship",
      "t.loanSubsidy": "Loan / Interest Subsidy",
      "t.digital": "Digital Education",
      "t.skill": "Skill Development",
      "t.residential": "Residential School",
      "t.smallSavings": "Small Savings Scheme",
      "t.policy": "Policy Framework",
      "t.board": "Board-administered",
      "t.mixed": "Mixed / multiple components",

      /* scheme type filter labels */
      "sf.centralSector": "Central Sector Scheme",
      "sf.centrallySponsored": "Centrally Sponsored Scheme",
      "sf.scholarship": "Scholarship",
      "sf.loanSubsidy": "Loan / Interest Subsidy",
      "sf.digital": "Digital Education",
      "sf.skill": "Skill Development",

      /* quick match */
      "qm.eyebrow": "Quick Match",
      "qm.h1": "Let's find schemes for you",
      "qm.sub": "Answer a few simple questions. No complicated forms.",
      "qm.s1": "Education",
      "qm.s2": "Profile",
      "qm.s3": "Income",
      "qm.s4": "Preferences",
      "qm.s5": "Results",

      "qm.q1": "What are you currently studying?",
      "qm.q1h": "Pick the closest match — you can change it later.",
      "qm.q2g": "Gender",
      "qm.q2c": "Social category",
      "qm.q2d": "Disability status",
      "qm.q2s": "State / UT",
      "qm.q3": "Annual family income",
      "qm.q3h": "Used to match income ceilings. Only some schemes in our dataset have a recorded limit.",
      "qm.q4": "What type of support are you looking for?",
      "qm.q4h": "Choose as many as you like. You can also leave this blank to see everything.",

      "qm.gender": "Girl / Female",
      "qm.genderM": "Boy / Male",
      "qm.genderX": "Prefer to self-describe",
      "qm.catGeneral": "General",
      "qm.catSC": "Scheduled Caste (SC)",
      "qm.catST": "Scheduled Tribe (ST)",
      "qm.catOBC": "Other Backward Class (OBC)",
      "qm.catEBC": "Economically Backward Class (EBC)",
      "qm.catDNT": "DNT / NT / SNT",
      "qm.catMinority": "Minority community",
      "qm.disYes": "Yes",
      "qm.disNo": "No",
      "qm.stateNote": "This dataset covers central schemes only, so State doesn't change your results. State schemes aren't included yet.",
      "qm.noAnswer": "Not sure / skip",

      "qm.resultHead": "You may qualify for {n} schemes",
      "qm.resultHeadOne": "You may qualify for {n} scheme",
      "qm.resultSub": "Based on your answers, these records match. Always confirm on the official portal before applying.",
      "qm.explain": "How we matched these",
      "qm.incomeUnknown": "{n} more scheme(s) have an income test we don't have a figure for.",
      "qm.showUnknown": "Show those too",
      "qm.instHidden": "{n} institutional or policy record(s) are hidden because you can't apply to them individually.",

      /* detail */
      "d.overview": "Overview",
      "d.benefits": "Benefits",
      "d.eligibility": "Eligibility",
      "d.beneficiaries": "Who this is for",
      "d.features": "Key features",
      "d.howToApply": "How to apply",
      "d.important": "Important information",
      "d.facts": "Quick facts",
      "d.quickFacts": "At a glance",
      "d.source": "Source",
      "d.lastVerified": "Last verified",
      "d.notRecorded": "Not recorded in dataset",
      "d.changing": "Scheme rules, benefit amounts and eligibility may change. Always verify the latest information on the official government website before applying.",
      "d.noSteps": "The dataset does not contain scheme-specific application steps for this record. Follow the process on the official portal below.",
      "d.step1": "Read the eligibility above",
      "d.step1d": "Check every condition, including ones this page cannot verify for you.",
      "d.step2": "Open the official portal",
      "d.step3": "Complete the portal's own process",
      "d.step3d": "Documents, deadlines and forms are all set on the official portal — this dataset does not record them.",
      "d.step4": "Track verification",
      "d.step4d": "Scholarships are usually verified against government records before payment.",
      "d.step5": "Receive the benefit",
      "d.step5d": "Most schemes pay directly into a bank account via DBT.",
      "d.noDocs": "Required documents aren't in the dataset. The official portal lists them.",
      "d.deadline": "Application dates aren't in the dataset. Check the official portal.",
      "d.helpline": "Helpline numbers aren't in the dataset. Check the official portal.",
      "d.incomeKnown": "Family income up to {amt} per year",
      "d.incomeNoLimit": "No income condition",
      "d.incomeUnstated": "An income condition applies but no figure is recorded",
      "d.incomeNA": "Not an individual scheme",
      "d.minMarks": "Minimum {pct}% marks",
      "d.onlyChild": "Must be an only child",
      "d.firstTime": "First-time borrower only",
      "d.ageRange": "Age {min}–{max}",
      "d.notIndividual": "This is a programme, institution or policy record. You don't apply to it — you benefit from it being in place.",
      "d.unverifiedWarn": "This record was compiled without live verification. Confirm amounts and dates on the official portal.",
      "d.reviewNotes": "Data notes for this record",
      "d.related": "Related schemes",
      "d.official": "Official website",

      /* compare */
      "c.eyebrow": "Side by side",
      "c.h1": "Compare schemes",
      "c.sub": "Side by side, factual differences only. We don't score or rank — you decide what fits.",
      "c.empty": "Nothing to compare yet",
      "c.emptyP": "Select 2 or 3 schemes from Explore or any scheme page, then come back here.",
      "c.tooFew": "Add {n} more scheme(s) to compare.",
      "c.row.category": "Category",
      "c.row.ministry": "Ministry",
      "c.row.body": "Implementing body",
      "c.row.level": "Education level",
      "c.row.aid": "Benefit type",
      "c.row.benefit": "Benefit",
      "c.row.eligibility": "Eligibility",
      "c.row.beneficiary": "Who it's for",
      "c.row.income": "Income ceiling",
      "c.row.type": "Scheme type",
      "c.row.year": "Launch year",
      "c.row.status": "Status",
      "c.row.apply": "How to apply",
      "c.row.source": "Official website",
      "c.remove": "Remove {name} from comparison",

      /* saved */
      "sv.eyebrow": "Your list",
      "sv.h1": "Saved schemes",
      "sv.sub": "Keep useful schemes in one place.",
      "sv.empty": "No saved schemes yet",
      "sv.emptyP": "Save a scheme while browsing to find it quickly later.",
      "sv.count": "scheme saved",
      "sv.countPlural": "schemes saved",
      "sv.stored": "Saved in this browser only — nothing is uploaded.",
      "sv.cleared": "Saved list cleared.",

      /* deadlines */
      "dl.eyebrow": "Deadlines",
      "dl.h1": "Application dates",
      "dl.sub": "Deadline tracking for Yojana Setu schemes.",
      "dl.none": "No deadlines available",
      "dl.noneH": "Our dataset does not contain application dates for any of these schemes, so there is nothing to put on a calendar.",
      "dl.noneP": "Scholarship deadlines are published by the National Scholarship Portal (scholarships.gov.in) and by each scheme's own portal. Those dates change every cycle, which is exactly why we won't hardcode them here.",
      "dl.perScheme": "Dates are not available for this scheme. Please check the official portal.",
      "dl.upcoming": "Upcoming",
      "dl.closing": "Closing soon",
      "dl.all": "All dates",
      "dl.dated": "schemes with a recorded date",
      "dl.ctaP": "The National Scholarship Portal lists current application dates for central scholarships, and each scheme's own site carries its timetable. This page will fill in automatically once application dates are added to the dataset.",
      "dl.noFake": "We don't show estimated or guessed dates.",

      /* search */
      "se.suggestions": "Suggestions",
      "se.schemes": "Schemes",
      "se.categories": "Categories",
      "se.recent": "Recent",
      "se.resultsFor": "Results for",
      "se.noResults": "We couldn't find a matching scheme.",
      "se.noResultsP": "The dataset has 24 central schemes, so a narrow combination of filters can return nothing.",
      "se.t1": "Try a broader keyword",
      "se.t2": "Browse categories instead",
      "se.t3": "Use Quick Match",
      "se.noResultsQuery": "Nothing matches “{q}”.",
      "se.noFilters": "No schemes match these filters.",
      "se.hint1": "Remove one or two filters",
      "se.hint2": "Try a shorter keyword",
      "se.cleared": "Filters cleared",
      "se.countOne": "1 scheme",

      /* states */
      "st.loading": "Loading schemes…",
      "st.error": "Something went wrong",
      "st.errorP": "The scheme dataset could not be loaded. This is almost always because the page was opened directly from the file system — browsers block reading a local JSON file that way.",
      "st.errorFix": "Run this in the folder that contains index.html, then open the printed address:",
      "st.errorFix2": "If that fails, check that data/schemes.enriched.json exists and the path in config.js matches.",

      /* a11y / settings */
      "set.menu": "Display & language",
      "set.language": "Language",
      "set.textSize": "Text size",
      "set.textNormal": "Default",
      "set.textLarge": "Large",
      "set.textXLarge": "Largest",
      "set.contrast": "High contrast",
      "set.theme": "Theme",
      "set.themeLight": "Light",
      "set.themeDark": "Dark",
      "set.themeAuto": "System",
      "set.langNote": "Scheme data stays in English",
      "set.langNoteBody": "We've translated the interface, not the scheme content. Official scheme names, eligibility rules and amounts remain in English so you always match the wording on the government portal.",
      "set.langSoon": "Translation in progress",
      "set.langSoonBody": "This language is listed but its interface translation isn't ready. We won't ship an unreviewed translation of a government service.",
      "set.contrastOn": "High contrast on",

      /* toasts */
      "toast.saved": "Saved {name}",
      "toast.unsaved": "Removed {name}",
      "toast.addedCmp": "Added to comparison ({n}/{max})",
      "toast.removedCmp": "Removed from comparison",
      "toast.cmpFull": "Comparison holds {max} schemes. Remove one to add another.",
      "toast.cmpMin": "Pick at least {n} schemes to compare.",

      /* misc */
      "m.notice": "Information changes periodically • Verify on official government portal",
      "m.skip": "Skip to main content",
      "m.languageInProgress": "Interface translation for this language is still in progress — showing English.",
      "m.aggregator": "Yojana Setu is an informational aggregator, not an official government portal.",
      "m.required": "Required",
      "m.filters": "Filters",
      "m.activeCount": "{n} active",
      "m.allCategories": "All categories",
      "m.resultsPerPage": "results",

      /* footer */
      "footer.explore": "Explore",
      "footer.info": "Information",
      "footer.about": "About",
      "footer.a11y": "Accessibility",
      "footer.privacy": "Privacy",
      "footer.disclaimer": "Disclaimer",
      "footer.institution": "Our institution",
      "footer.compiled": "Dataset compiled {d}",
      "footer.enriched": "Filter fields added {d}"
    },

    hi: {
      "nav.explore": "एक्सप्लोर",
      "nav.quickmatch": "क्विक मैच",
      "nav.compare": "तुलना",
      "nav.saved": "सहेजे गए",
      "nav.home": "होम",
      "nav.menu": "मेन्यू",
      "nav.search": "खोजें",

      "hero.eyebrow": "एग्रीगेटर",
      "hero.eyebrow.text": "24 केंद्रीय योजनाएँ, एक जगह",
      "hero.h1a": "वे शिक्षा योजनाएँ खोजें",
      "hero.h1b": "जिनके आप पात्र हो सकते हैं",
      "hero.sub": "छात्रवृत्ति, शिक्षा ऋण, कौशल कार्यक्रम और अन्य सरकारी शिक्षा लाभ — सब एक जगह।",
      "hero.cta1": "मेरी योजनाएँ खोजें",
      "hero.cta2": "सभी योजनाएँ देखें",
      "hero.search.ph": "छात्रवृत्ति, योजना, ऋण, शिक्षा खोजें...",
      "hero.search.btn": "खोजें",
      "hero.popular": "लोकप्रिय खोजें",

      "trust.schemes": "केंद्रीय योजनाएँ",
      "trust.cats": "श्रेणियाँ",
      "trust.sources": "आधिकारिक स्रोत",
      "trust.sources.sub": "हर रिकॉर्ड .gov.in वेबसाइट से जुड़ा है",

      "btn.apply": "फ़िल्टर लागू करें",
      "btn.clear": "सब हटाएँ",
      "btn.clearFilters": "हटाएँ",
      "btn.viewDetails": "विवरण देखें",
      "btn.continue": "आगे बढ़ें",
      "btn.back": "पीछे",
      "btn.finish": "मेरे परिणाम देखें",
      "btn.retry": "पुनः प्रयास करें",
      "btn.explore": "योजनाएँ देखें",
      "btn.quickMatch": "क्विक मैच उपयोग करें",
      "btn.close": "बंद करें",
      "btn.save": "सहेजें",
      "btn.saved": "सहेजा गया",
      "btn.remove": "हटाएँ",
      "btn.visit": "आधिकारिक सरकारी वेबसाइट देखें",
      "btn.compare": "तुलना करें",
      "btn.addCompare": "तुलना में जोड़ें",
      "btn.viewCompare": "तुलना देखें",

      "card.benefit": "लाभ",
      "card.ministry": "मंत्रालय",
      "card.save": "{name} सहेजें",
      "card.unsave": "{name} सहेजे गए से हटाएँ",
      "card.noApplication": "आवेदन आवश्यक नहीं",
      "card.officialSource": "आधिकारिक स्रोत",
      "card.openToAll": "सभी के लिए खुला",
      "card.incomeUnstated": "आय सीमा डेटा में नहीं",
      "card.seeDetailA11y": "{name} का विवरण देखें",

      "badge.active": "सक्रिय",
      "badge.noApp": "बिना आवेदन",
      "badge.inst": "संस्थागत",
      "badge.verifiedSource": "आधिकारिक स्रोत",
      "badge.needsCheck": "आय जाँचें",

      "explore.eyebrow": "एक्सप्लोर",
      "explore.h1": "सरकारी शिक्षा योजनाएँ खोजें",
      "explore.sub": "शिक्षा स्तर, लाभ प्रकार और आय सीमा से डेटा छाँटें। संख्या तुरंत बदलती है।",
      "explore.search.ph": "योजनाएँ खोजें...",
      "explore.found": "योजनाएँ मिलीं",
      "explore.foundOne": "योजना मिली",
      "explore.filters": "फ़िल्टर",
      "explore.sort": "क्रम",
      "explore.clearAll": "सब हटाएँ",
      "explore.activeFilters": "सक्रिय फ़िल्टर",

      "f.level": "शिक्षा स्तर",
      "f.category": "श्रेणी",
      "f.schemeType": "योजना प्रकार",
      "f.beneficiary": "लाभार्थी श्रेणी",
      "f.gender": "लिंग",
      "f.disability": "दिव्यांगजन सुविधा",
      "f.income": "वार्षिक पारिवारिक आय",
      "f.aid": "आवश्यक सहायता",
      "f.application": "आवेदन का तरीका",
      "f.inst": "कार्यक्रम और नीति रिकॉर्ड",
      "f.inst.note": "वे कार्यक्रम और नीतियाँ जिनसे आप लाभान्वित होते हैं, पर व्यक्तिगत रूप से आवेदन नहीं करते।",

      "f.income.any": "कोई भी आय",
      "f.income.upto": "{amt} तक",
      "f.income.includeUnstated": "उन योजनाओं को भी शामिल करें जिनकी आय सीमा डेटा में नहीं है",
      "f.income.note": "केवल कुछ योजनाओं की आय सीमा हमारे डेटा में दर्ज है। जहाँ नहीं है, वहाँ हम आपको पात्रता की पुष्टि नहीं कर सकते।",

      "f.disability.eligible": "दिव्यांगजन सुविधा का उल्लेख",
      "f.disability.unstated": "डेटा में उल्लेख नहीं",
      "f.disability.note": "\"उल्लेख नहीं\" का अर्थ है डेटा चुप है, यह नहीं कि योजना किसी को शामिल नहीं करती।",

      "g.all": "सभी",
      "g.female": "महिला",
      "g.male": "पुरुष",
      "g.maleOrFemale": "कोई भी लिंग",

      "t.centralSector": "केंद्रीय क्षेत्र योजना",
      "t.centrallySponsored": "केंद्रीय राज्य-सम्मोहित योजना",
      "t.scholarship": "छात्रवृत्ति",
      "t.loanSubsidy": "ऋण / ब्याज सब्सिडी",
      "t.digital": "डिजिटल शिक्षा",
      "t.skill": "कौशल विकास",
      "t.residential": "आवासीय विद्यालय",
      "t.smallSavings": "लघु बचत योजना",
      "t.policy": "नीति ढाँचा",
      "t.board": "बोर्ड द्वारा संचालित",
      "t.mixed": "मिश्रित / कई घटक",

      "sf.centralSector": "केंद्रीय क्षेत्र योजना",
      "sf.centrallySponsored": "केंद्रीय राज्य-सम्मोहित योजना",
      "sf.scholarship": "छात्रवृत्ति",
      "sf.loanSubsidy": "ऋण / ब्याज सब्सिडी",
      "sf.digital": "डिजिटल शिक्षा",
      "sf.skill": "कौशल विकास",

      "qm.eyebrow": "क्विक मैच",
      "qm.h1": "आइए आपके लिए योजनाएँ खोजते हैं",
      "qm.sub": "कुछ सरल प्रश्नों के उत्तर दें। कोई जटिल फ़ॉर्म नहीं।",
      "qm.s1": "शिक्षा",
      "qm.s2": "प्रोफ़ाइल",
      "qm.s3": "आय",
      "qm.s4": "पसंद",
      "qm.s5": "परिणाम",

      "qm.q1": "आप अभी क्या पढ़ रहे हैं?",
      "qm.q1h": "सबसे करीब विकल्प चुनें — आप बाद में बदल सकते हैं।",
      "qm.q2g": "लिंग",
      "qm.q2c": "सामाजिक श्रेणी",
      "qm.q2d": "दिव्यांगजन स्थिति",
      "qm.q2s": "राज्य / केंद्र शासित प्रदेश",
      "qm.q3": "वार्षिक पारिवारिक आय",
      "qm.q3h": "आय सीमा से मिलान के लिए। हमारे डेटा में केवल कुछ योजनाओं की सीमा दर्ज है।",
      "qm.q4": "आप किस प्रकार की सहायता चाहते हैं?",
      "qm.q4h": "जितनी चाहें चुनें। सब देखने के लिए खाली भी छोड़ सकते हैं।",

      "qm.gender": "लड़की / महिला",
      "qm.genderM": "लड़का / पुरुष",
      "qm.genderX": "स्वयं बताना पसंद है",
      "qm.catGeneral": "सामान्य",
      "qm.catSC": "अनुसूचित जाति (SC)",
      "qm.catST": "अनुसूचित जनजाति (ST)",
      "qm.catOBC": "अन्य पिछड़ा वर्ग (OBC)",
      "qm.catEBC": "आर्थिक रूप से पिछड़ा वर्ग (EBC)",
      "qm.catDNT": "DNT / NT / SNT",
      "qm.catMinority": "अल्पसंख्यक समुदाय",
      "qm.disYes": "हाँ",
      "qm.disNo": "नहीं",
      "qm.stateNote": "यह डेटा केवल केंद्रीय योजनाओं का है, इसलिए राज्य से परिणाम नहीं बदलते। राज्य योजनाएँ अभी शामिल नहीं हैं।",
      "qm.noAnswer": "पता नहीं / छोड़ें",

      "qm.resultHead": "आप {n} योजनाओं के पात्र हो सकते हैं",
      "qm.resultHeadOne": "आप {n} योजना के पात्र हो सकते हैं",
      "qm.resultSub": "आपके उत्तरों के आधार पर ये रिकॉर्ड मिले। आवेदन से पहले आधिकारिक पोर्टल पर पुष्टि अवश्य करें।",
      "qm.explain": "हमने इनसे कैसे मिलान किया",
      "qm.incomeUnknown": "{n} और योजनाओं का आय जाँच है जिसका आंकड़ा हमारे पास नहीं है।",
      "qm.showUnknown": "उन्हें भी दिखाएँ",
      "qm.instHidden": "{n} संस्थागत या नीति रिकॉर्ड छिपाए गए हैं क्योंकि इनके लिए व्यक्तिगत आवेदन नहीं होता।",

      "d.overview": "परिचय",
      "d.benefits": "लाभ",
      "d.eligibility": "पात्रता",
      "d.beneficiaries": "किसके लिए",
      "d.features": "मुख्य विशेषताएँ",
      "d.howToApply": "आवेदन कैसे करें",
      "d.important": "महत्वपूर्ण जानकारी",
      "d.facts": "त्वरित तथ्य",
      "d.quickFacts": "एक नज़र में",
      "d.source": "स्रोत",
      "d.lastVerified": "अंतिम सत्यापन",
      "d.notRecorded": "डेटा में दर्ज नहीं",
      "d.changing": "योजना के नियम, लाभ राशि और पात्रता बदल सकती हैं। आवेदन से पहले हमेशा आधिकारिक सरकारी वेबसाइट पर नवीनतम जानकारी जाँचें।",
      "d.noSteps": "इस रिकॉर्ड में योजना-विशिष्ट आवेदन चरण नहीं हैं। नीचे दिए आधिकारिक पोर्टल की प्रक्रिया अपनाएँ।",
      "d.step1": "ऊपर दी गई पात्रता पढ़ें",
      "d.step1d": "हर शर्त जाँचें, जिसमें वे भी शामिल हैं जिनकी यह पेज पुष्टि नहीं कर सकता।",
      "d.step2": "आधिकारिक पोर्टल खोलें",
      "d.step3": "पोर्टल की अपनी प्रक्रिया पूरी करें",
      "d.step3d": "दस्तावेज़, तिथियाँ और फ़ॉर्म सभी आधिकारिक पोर्टल पर हैं — यह डेटा उन्हें दर्ज नहीं करता।",
      "d.step4": "सत्यापन की स्थिति देखें",
      "d.step4d": "भुगतान से पहले छात्रवृत्ति की सामान्यतः सरकारी रिकॉर्ड से सत्यापन होता है।",
      "d.step5": "लाभ प्राप्त करें",
      "d.step5d": "अधिकांश योजनाएँ DBT द्वारा सीधे बैंक खाते में भुगतान करती हैं।",
      "d.noDocs": "आवश्यक दस्तावेज़ डेटा में नहीं हैं। आधिकारिक पोर्टल उन्हें बताता है।",
      "d.deadline": "आवेदन तिथियाँ डेटा में नहीं हैं। आधिकारिक पोर्टल देखें।",
      "d.helpline": "हेल्पलाइन नंबर डेटा में नहीं हैं। आधिकारिक पोर्टल देखें।",
      "d.incomeKnown": "वार्षिक पारिवारिक आय {amt} तक",
      "d.incomeNoLimit": "कोई आय शर्त नहीं",
      "d.incomeUnstated": "आय शर्त लागू है, पर राशि दर्ज नहीं",
      "d.incomeNA": "व्यक्तिगत योजना नहीं",
      "d.minMarks": "कम से कम {pct}% अंक",
      "d.onlyChild": "केवल इकलौता बच्चा होना आवश्यक",
      "d.firstTime": "केवल पहली बार ऋण लेने वाले",
      "d.ageRange": "आयु {min}–{max}",
      "d.notIndividual": "यह एक कार्यक्रम, संस्था या नीति रिकॉर्ड है। इसके लिए आवेदन नहीं होता — आप इसके लागू होने से लाभान्वित होते हैं।",
      "d.unverifiedWarn": "यह रिकॉर्ड लाइव सत्यापन के बिना तैयार किया गया था। राशि और तिथियाँ आधिकारिक पोर्टल पर पुष्ट करें।",
      "d.reviewNotes": "इस रिकॉर्ड के लिए डेटा टिप्पणियाँ",
      "d.related": "संबंधित योजनाएँ",
      "d.official": "आधिकारिक वेबसाइट",

      "c.eyebrow": "साथ-साथ",
      "c.h1": "योजनाओं की तुलना",
      "c.sub": "साथ-साथ, केवल तथ्यात्मक अंतर। हम कोई अंक या रैंकिंग नहीं देते — आप तय करें।",
      "c.empty": "तुलना के लिए कुछ नहीं",
      "c.emptyP": "एक्सप्लोर या किसी योजना पेज से 2 या 3 योजनाएँ चुनें, फिर यहाँ लौटें।",
      "c.tooFew": "तुलना के लिए {n} और योजना चुनें।",
      "c.row.category": "श्रेणी",
      "c.row.ministry": "मंत्रालय",
      "c.row.body": "कार्यान्वयन निकाय",
      "c.row.level": "शिक्षा स्तर",
      "c.row.aid": "लाभ प्रकार",
      "c.row.benefit": "लाभ",
      "c.row.eligibility": "पात्रता",
      "c.row.beneficiary": "किसके लिए",
      "c.row.income": "आय सीमा",
      "c.row.type": "योजना प्रकार",
      "c.row.year": "आरंभ वर्ष",
      "c.row.status": "स्थिति",
      "c.row.apply": "आवेदन का तरीका",
      "c.row.source": "आधिकारिक वेबसाइट",
      "c.remove": "{name} तुलना से हटाएँ",

      "sv.eyebrow": "आपकी सूची",
      "sv.h1": "सहेजी गई योजनाएँ",
      "sv.sub": "उपयोगी योजनाओं को एक जगह रखें।",
      "sv.empty": "अभी कोई योजना सहेजी नहीं",
      "sv.emptyP": "ब्राउज़ करते समय योजना सहेजें ताकि बाद में जल्दी मिल जाए।",
      "sv.count": "योजना सहेजी",
      "sv.countPlural": "योजनाएँ सहेजी",
      "sv.stored": "केवल इसी ब्राउज़र में सहेजा गया — कुछ भी अपलोड नहीं होता।",
      "sv.cleared": "सहेजी सूची खाली कर दी गई।",

      "dl.eyebrow": "deadlines",
      "dl.h1": "आवेदन तिथियाँ",
      "dl.sub": "योजना सेतु योजनाओं की डेडलाइन ट्रैकिंग।",
      "dl.none": "कोई तिथि उपलब्ध नहीं",
      "dl.noneH": "हमारे डेटा में इनमें से किसी भी योजना की आवेदन तिथियाँ नहीं हैं, इसलिए कैलेंडर पर कुछ नहीं है।",
      "dl.noneP": "छात्रवृत्ति की तिथियाँ राष्ट्रीय छात्रवृत्ति पोर्टल (scholarships.gov.in) और हर योजना के अपने पोर्टल पर प्रकाशित होती हैं। ये तिथियाँ हर चक्र में बदलती हैं, इसीलिए हम यहाँ अनुमानित तिथियाँ नहीं दिखाते।",
      "dl.perScheme": "इस योजना की तिथियाँ उपलब्ध नहीं हैं। कृपया आधिकारिक पोर्टल देखें।",
      "dl.upcoming": "आगामी",
      "dl.closing": "जल्द बंद",
      "dl.all": "सभी तिथियाँ",
      "dl.dated": "योजनाएँ जिनकी तिथि दर्ज है",
      "dl.ctaP": "राष्ट्रीय छात्रवृत्ति पोर्टल पर केंद्रीय छात्रवृत्तियों की वर्तमान आवेदन तिथियाँ दी गई हैं, और हर योजना के अपने साइट पर उसका समय-सारणी होता है। डेटा में आवेदन तिथियाँ जुड़ने के बाद यह पेज अपने आप भर जाएगा।",
      "dl.noFake": "हम अनुमानित या काल्पनिक तिथियाँ नहीं दिखाते।",

      "se.suggestions": "सुझाव",
      "se.schemes": "योजनाएँ",
      "se.categories": "श्रेणियाँ",
      "se.recent": "हाल के",
      "se.resultsFor": "परिणाम",
      "se.noResults": "कोई मिलती-जुलती योजना नहीं मिली।",
      "se.noResultsP": "डेटा में 24 केंद्रीय योजनाएँ हैं, इसलिए फ़िल्टर का संयोजन सीमित होने पर कुछ नहीं मिल सकता।",
      "se.t1": "कोई व्यापक शब्द आज़माएँ",
      "se.t2": "इसके बजाय श्रेणियाँ देखें",
      "se.t3": "क्विक मैच उपयोग करें",
      "se.noResultsQuery": "“{q}” से कुछ नहीं मिलता।",
      "se.noFilters": "इन फ़िल्टर से कोई योजना मेल नहीं खाती।",
      "se.hint1": "एक या दो फ़िल्टर हटाएँ",
      "se.hint2": "छोटा शब्द आज़माएँ",
      "se.cleared": "फ़िल्टर हटा दिए गए",
      "se.countOne": "1 योजना",

      "st.loading": "योजनाएँ लोड हो रही हैं…",
      "st.error": "कुछ गड़बड़ हो गई",
      "st.errorP": "योजना डेटा लोड नहीं हो सका। यह लगभग हमेशा इसलिए होता है कि पेज सीधे फ़ाइल सिस्टम से खोला गया — ब्राउज़र ऐसी स्थिति में स्थानीय JSON फ़ाइल पढ़ने से रोकते हैं।",
      "st.errorFix": "index.html वाले फ़ोल्डर में यह चलाएँ, फिर छपा पता खोलें:",
      "st.errorFix2": "यह भी न जाए तो जाँचें कि data/schemes.enriched.json मौजूद है और config.js में पता सही है।",

      "set.menu": "प्रदर्शन और भाषा",
      "set.language": "भाषा",
      "set.textSize": "अक्षर आकार",
      "set.textNormal": "सामान्य",
      "set.textLarge": "बड़ा",
      "set.textXLarge": "सबसे बड़ा",
      "set.contrast": "उच्च कंट्रास्ट",
      "set.theme": "थीम",
      "set.themeLight": "हल्का",
      "set.themeDark": "गहरा",
      "set.themeAuto": "सिस्टम",
      "set.langNote": "योजना डेटा अंग्रेज़ी में ही रहेगा",
      "set.langNoteBody": "हमने इंटरफ़ेस अनूदित किया है, योजना सामग्री नहीं। आधिकारिक योजना नाम, पात्रता नियम और राशियाँ अंग्रेज़ी में ही रहती हैं ताकि आप सरकारी पोर्टल के शब्दों से मेल खा सकें।",
      "set.langSoon": "अनुवाद प्रगति पर है",
      "set.langSoonBody": "यह भाषा सूचीबद्ध है पर इसका इंटरफ़ेस अनुवाद तैयार नहीं है। हम सरकारी सेवा का बिना समीक्षा किए अनुवाद प्रकाशित नहीं करते।",
      "set.contrastOn": "उच्च कंट्रास्ट चालू",

      "toast.saved": "{name} सहेजी गई",
      "toast.unsaved": "{name} हटाई गई",
      "toast.addedCmp": "तुलना में जोड़ा ({n}/{max})",
      "toast.removedCmp": "तुलना से हटाया गया",
      "toast.cmpFull": "तुलना में {max} योजनाएँ हैं। कोई और जोड़ने के लिए एक हटाएँ।",
      "toast.cmpMin": "तुलना के लिए कम से कम {n} योजनाएँ चुनें।",

      "m.notice": "जानकारी समय-समय पर बदलती है • आधिकारिक सरकारी पोर्टल पर जाँचें",
      "m.skip": "मुख्य सामग्री पर जाएँ",
      "m.languageInProgress": "इस भाषा का इंटरफ़ेस अनुवाद अभी प्रगति पर है — अंग्रेज़ी दिखाई जा रही है।",
      "m.aggregator": "योजना सेतु एक सूचनात्मक एग्रीगेटर है, आधिकारिक सरकारी पोर्टल नहीं।",
      "m.required": "आवश्यक",
      "m.filters": "फ़िल्टर",
      "m.activeCount": "{n} सक्रिय",
      "m.allCategories": "सभी श्रेणियाँ",
      "m.resultsPerPage": "परिणाम",

      /* footer */
      "footer.explore": "एक्सप्लोर",
      "footer.info": "जानकारी",
      "footer.about": "परिचय",
      "footer.a11y": "सुगम्यता",
      "footer.privacy": "गोपनीयता",
      "footer.disclaimer": "अस्वीकरण",
      "footer.institution": "हमारा संस्थान",
      "footer.compiled": "डेटा तैयार {d}",
      "footer.enriched": "फ़िल्टर फ़ील्ड जोड़े गए {d}"
    }
  };

  let current = "en";
  const listeners = [];

  function t(key, vars) {
    let s = (STRINGS[current] && STRINGS[current][key]) || STRINGS.en[key];
    if (s === undefined) return key;
    if (vars) {
      s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
    }
    return s;
  }

  return {
    t: t,
    get lang() { return current; },

    /* The raw string tables. Nothing in the app reads these; they are exposed
       so the static checker in _links.cjs can verify that every key the code
       asks for actually exists, rather than trusting a grep. */
    tables: STRINGS,

    set(code) {
      const def = (window.YS.config.langs || []).find((l) => l.code === code);
      current = def && def.ready ? code : "en";
      document.documentElement.lang = current;
      listeners.forEach((fn) => fn(current, def));
      return { active: current, requested: code, ready: !!(def && def.ready) };
    },

    onChange(fn) { listeners.push(fn); },

    /** True when a language was requested but we fell back to English. */
    isFallback(code) {
      const def = (window.YS.config.langs || []).find((l) => l.code === code);
      return !!(def && !def.ready);
    },

    /** Re-render every [data-i18n] node in a subtree. */
    apply(root) {
      (root || document).querySelectorAll("[data-i18n]").forEach((el) => {
        el.textContent = t(el.getAttribute("data-i18n"));
      });
      (root || document).querySelectorAll("[data-i18n-ph]").forEach((el) => {
        el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph")));
      });
      (root || document).querySelectorAll("[data-i18n-aria]").forEach((el) => {
        el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
      });
    }
  };
})();
