# Yojana Setu

A browser that helps you find central government education schemes you may
qualify for. Every fact on every page comes from one JSON file. Where the data
is silent, the interface says so instead of filling the gap.

## Run it

The pages load their data with `fetch()`, which browsers refuse to do over
`file://`. You need a local server, not a double-clicked HTML file.

```bash
cd site
python -m http.server 8000
```

Then open <http://localhost:8000>. Any static server works —
`npx serve`, `php -S localhost:8000`, the VS Code Live Server extension.

If you skip this and open `index.html` directly, the app shows an error box
that names this cause and repeats the command.

## Pages

| File | What it does |
|---|---|
| `index.html` | Home. Search bar with its two CTAs on one row, six featured schemes, and the data-gap notice. |
| `explore.html` | Full explorer. Eight facet groups, income bands, sort, shareable URLs. |
| `scheme.html` | One scheme in detail. Requires `?id=…`. |
| `quick-match.html` | Five-step wizard that filters the dataset by your answers. |
| `compare.html` | Two or three schemes side by side. No scores, no winner. |
| `saved.html` | Your saved schemes. Browser-local only. |
| `deadlines.html` | Explains why there are no dates here, and says where the real ones live. |

## How it is put together

No build step, no framework, no bundler. Open `index.html` and it runs.

```
site/
  index.html  explore.html  scheme.html  quick-match.html
  compare.html  saved.html  deadlines.html

  data/
    schemes.enriched.json      the single source of truth

  assets/
    css/
      theme.css                design tokens — colours, type scale, spacing
      app.css                  component styles
    js/
      config.js                data URL, limits, language list, aid-type chip list
      i18n.js                  English + Hindi interface strings
      store.js                 data loading, filtering, saved/compare state
      ui.js                    shared components and boot()
      home.js  explore.js  scheme.js  quick-match.js
      compare.js  saved.js  deadlines.js
```

Scripts always load in that order: `config.js` → `i18n.js` → `store.js` →
`ui.js` → the page's own script. They attach to a single global, `YS`.

### Changing the design

`theme.css` holds every colour, size and spacing value as a CSS custom
property. Change it there and the whole site follows; the component files in
`app.css` never hardcode a colour.

Dark mode, high contrast, and the three text sizes are all attribute-driven on
`<html>` (`data-theme`, `data-contrast`, `data-textsize`). Every page sets
those attributes in a small inline script before first paint, reading from
`localStorage`, so a returning visitor never sees a white flash before a dark
page loads.

## Where the data came from

`data/schemes.enriched.json` holds 24 central government education schemes. It
is the same 24 records as the `education_schemes.json` in the project root,
with the original 17 fields carried through verbatim, plus a `filter` object of
machine-readable fields and a `_review` array of analyst notes.

Three additions worth knowing about:

- **`filter.income_criterion`** is one of `limit-known`, `no-limit`, `unstated`,
  or `not-applicable`. The income filter keys off this, so a scheme whose
  ceiling the dataset never states is never presented as if you qualify for it.
- **`filter.benefits_individual`** is `false` for programmes and policies you
  benefit from but cannot apply to individually. These get no Apply affordance
  anywhere.
- **`_review`** holds open questions found while building this. They surface on
  each scheme's detail page under "Data notes".

### Things the dataset does not contain

These are absent from the source, and this app does not invent them:

`documents_required` · `application_deadline` · `application_link` ·
`helpline` · `state` · `renewal_conditions` · `last_verified_date`

Wherever a page would naturally show one of these, it states plainly that the
dataset does not have it. That is why there is no Apply button anywhere in the
app: `application_link` does not exist, so the only outbound action offered is
the scheme's own official website, taken from the record.

The dataset is also central-scheme only. State schemes are out of scope by
design, which the quick-match wizard says when it asks about your state.

## Tests

```bash
npm install jsdom     # dev dependency only; not needed to run the site
npm test
```

Five files, run in this order:

- **`_links.cjs`** — static checks that need no DOM. Verifies every i18n key
  the code asks for exists in both `en` and `hi` (and that no key is dead),
  every local `href`/`src` resolves to a real file, no scheme id is hard-coded
  in a link, every popular search returns results, and the dataset's own
  invariants hold — the fields listed as unavailable are absent, required
  fields are present, and `income_criterion` agrees with `max_income`. It also
  resolves the image paths configured in `config.js` and flags any file sitting
  in `assets/img` that nothing points at, because the header and footer are
  built in JS where an `href`/`src` scan of the pages would never see them.
- **`_css.cjs`** — parses both stylesheets and checks braces, that every
  `var(--x)` is defined, and that the restyle's load-bearing rules are still
  present. It also asserts the precedence decisions the navy theme depends on:
  on a navy field the chip paint beats the base `.chip`, the band eyebrow
  out-specifies the generic `.eyebrow`, an active chip on a band is gold rather
  than navy-on-navy, and the card's category badge out-specifies the base
  `.badge` for `white-space`. Those are the ones that actually broke while the
  theme was being matched to the startup project's look.
- **`_imgdims.cjs`** — reads the intrinsic dimensions out of each WebP header
  without an image library, and prints the aspect ratio. It exists because the
  two image slots are fixed squares: if a replacement logo arrives in a
  different aspect ratio, `object-fit: contain` will letterbox it and this
  says so before anyone opens the page. It also reports the chunk type, which is
  how you tell whether a file has an alpha channel (only `VP8L` and `VP8X` do).
- **`_smoke.cjs`** — boots every page in a headless DOM against the real
  dataset and asserts what actually rendered. Exercises the filter engine
  against the documented matching rule, checks the honesty copy on each page,
  verifies every remaining chip opens a non-empty explorer, checks the five inner
  page heads and the scheme card's structure, and runs accessibility spot checks
  (accessible names, landmarks, no positive tabindex, no inline handlers, one
  `h1` per page).
- **`_dark.cjs`** — inlines both stylesheets as one `<style>`, switches to dark,
  and measures the WCAG contrast that actually results. It exists because of a
  bug the other suites structurally could not see: `_css.cjs` parses the
  stylesheets but never runs a cascade, and `_smoke.cjs` boots the DOM with no
  stylesheets at all. It asserts contrast ratios and luminance bands rather than
  exact colours, so it keeps holding if a colour is re-picked for a good reason —
  but a fix that leaves the text unreadable still fails. Verified to fail on the
  original bug: it reports the navbar and the gold CTA collapsing to `#A9BEDC` and
  "Find My Schemes" at 1.01:1.
- **`_data.cjs`** — prints every `_review` note grouped by problem type, for
  triaging outstanding data work.

`npm run audit` runs the last one on its own.

## Branding

The site mark is a real image file, `assets/img/logo.webp` (256×256, opaque),
referenced from `config.js` rather than hard-coded in the markup. It replaces
an inline SVG that used to carry a drawn glyph. The gradient behind
`.logo-mark` is now only a placeholder for the moment before the file decodes —
lossy WebP has no alpha channel, so the artwork covers the square completely.
The gold bar that used to run under the mark was removed: it was sized for a
24px line-art glyph and over real artwork it just cuts across the bottom of the
mark. The header's own 2px gold rule carries that accent instead.

The mark is circular — `border-radius: 50%`, not a length. A fixed `20px` radius
is only round on a 40px tile and becomes a lozenge the moment the mark is
resized; `50%` follows whatever size the box ends up. `_css.cjs` asserts that
exact value rather than just that a `border-radius` exists, because a rounded
square and a circle both "have" one and the shape would regress silently.

Both images use `alt=""`. Everywhere they appear, the name is already in the
markup as visible text, so naming the image as well makes a screen reader say
it twice. An empty `alt` is the correct answer here; a *missing* one is not,
and that is the distinction the test makes.

The footer's last block is an institution strip — the mark and name of
Modern Education Society's College of Engineering, Pune. It is a rule-separated
flex row, not a fourth navigation column, because it is attribution rather than
a place to go: the strip contains no links. The college is named there and
nowhere else, and nothing in the dataset is attributed to it. The label
("Our institution" / "हमारा संस्थान") is an i18n key; the name is a registered
proper noun and is deliberately left untranslated.

## Look and feel

The visual design is matched to the sibling startup-scheme project
(`../Karan_Start_up_webpage`) so the two sites read as one brand: navy `#09264A`
with gold `#D8A52C`, a navy header bar closed by a 2px gold rule, a navy hero
with a gold bloom, a dotted wash and a slowly turning gold ring, and light /
navy bands alternating down the home page.

Three rules keep that theme honest, and all three are enforced by `_css.cjs`:

- **The navy header is navy in both themes.** The brand bar is part of the
  identity, not a surface that follows the page, so every control inside it is
  painted for navy explicitly rather than inheriting page tokens.
- **Fixed-navy surfaces use literal hex, not `--navy-600`/`--navy-700`.** Those
  two tokens are remapped on dark (`#A9BEDC`/`#C6D6EB`) because they mean "a
  blue that reads as *text* on the page background". A bar is not that. The
  header once followed them, so on dark it turned pale blue while everything
  inside it stayed painted white for navy — white text on a near-white bar. That
  is a bug that shipped, which is why `_css.cjs` now fails if any of
  `.site-header`, `.hero`, `.band-navy` or `.site-footer` names one of those
  tokens in its background.
- **Only the type on a navy band changes.** Cards stay white, so each card that
  appears on a band sets its own ink — otherwise a card's own `<strong>` would
  inherit the band's white and vanish. The recolour rules are scoped to
  `.sec-head` for the same reason: a blanket `h3` rule would have put a white
  card's heading at white-on-white.

Neither band follows the theme. Inverting them on dark mode would undo the
alternation the layout depends on.

### Why the dark link rule is wrapped in `:where()`

The second half of the same bug was specificity. Written plainly,
`[data-theme="dark"] a` scores 0-1-1, which out-specifies every single-class
component colour in `app.css` (`.nav-link`, `.btn-accent`, `.btn-secondary`,
`.skip-link`, all 0-1-0). In dark mode those silently lost their own paint and
fell back to the bare link colour — a *light* blue, legible on the dark page
background and effectively invisible on the navy bar and on gold. "Find My
Schemes" measured 1.01:1.

The rule is now `:where([data-theme="dark"]) a`, which is specificity 0-0-1 —
level with the light-theme `a` rule beside it, so components win by default. The
rules that genuinely do need to beat a component are written at 0-2-0 and still
do. When adding a theme-level override for a component, wrap the theme part in
`:where()` or give the whole selector 0-2-0; a bare attribute selector will beat
the component and you will not notice until someone switches themes.

The five inner pages open with a shared `.page-head`: a small gold `.eyebrow`
over the title over the subtitle, centred. `.eyebrow` is a standalone class
rather than nested inside `.sec-head`, because these pages use the label
without the rest of the section-head block. `scheme.html` is deliberately left
out — its `h1` is a scheme's own name, which is a document title, and giving it
a marketing eyebrow above it would misrepresent the record.

The hero's search bar and its two CTAs sit on one row (`.hero-row`). The bar
takes all the slack via `flex: 1`; the buttons keep their intrinsic width. The
bar comes first in the DOM, not just in the visual order, because the
suggestion list is absolutely positioned against it and the tab order follows
the DOM. Below 920px the CTAs wrap to their own full-width row, and below
480px they stack — two long button labels need more room than a phone has.
That is why `.hero-inner` is 940px rather than the 840px it was when the CTAs
sat underneath the bar.

## The site never links to the National Scholarship Portal

The portal (`scholarships.gov.in`) appeared in three places over the build and
is now in none of them: a gold CTA card at the foot of the deadlines page, then
the footer's Info column as a text link, then gone. Two reasons, and they are
the same one.

That page exists *because* the dataset has no application dates. A bright button
to a third-party site at the foot of it pulled focus off the point the page was
making. And the footer is a list of things this site is — about it, how it
treats accessibility, what it claims, what it stores. A government portal
sitting in that column beside our own privacy policy implies we speak for it.
We do not.

What survived is the prose. The deadlines page still says the National
Scholarship Portal lists current application dates and that each scheme's own
site carries its timetable, in a plain paragraph with no link attached. The
reader can find the portal; the site is just not presenting itself as a gateway
to it. The one remaining route is a scheme record's own `official_website`
field, which is the dataset's data — five records point at the portal, and each
renders as that scheme's own outbound link with `rel="noopener noreferrer"`.

`_smoke.cjs` asserts all four halves of that: no page's header or footer links
the portal, no page's footer text even names it, the deadlines page still names
it in prose while carrying no link, and the `official_website` route is still
live. Asserting only "some link exists" would pass even after the link was
removed, which is the failure that matters.

The suites are the guard rail for the rule that matters most here: no screen may
imply knowledge the dataset does not have. Several of them exist because they
caught a real defect during the build — the category facet once rendered empty
because `filter_vocabulary.category` held social categories while
`record.category` held the thematic area, and two home chips pointed at the
same result set under different names.

## The scheme card

Three fixes, all in `.scheme-card`.

**The category badge overflowed its row.** `.badge` sets `white-space: nowrap`
so the status pill and the flags row stay on one line. The category strings in
this dataset are long — "Scholarship - Social Category (SC/ST/OBC/Minority)" is
50 characters, about 390px at the badge's uppercase 11.5px, in a column that is
roughly 220px wide once the save button and card padding are taken out. The
badge rendered ~170px wider than its box and ran over the save button and out
past the card edge, which is what made the save button look small: it wasn't
shrinking, it was being painted over. The category badge now wraps, clamped to
two lines, scoped to `.badge-navy` inside `.scheme-card__badges` — the only
badge in that row with no icon child, so it can be a block. The status badge
keeps its `inline-flex` for its dot, and the scheme detail page has the room to
keep the single line. `min-width: 0` on the badge is load-bearing: a flex item
defaults to `min-width: auto` and would refuse to shrink below its longest word.
`.save-btn` also got `position: relative; z-index: 1` as a backstop, so a
category that grows again cannot silently cover it.

**View Details is now the card's primary action, not a text link.** It is a
bordered pill that keeps its label on one line (`white-space: nowrap`), takes
the slack in the foot (`flex: 1 1 auto`), and the arrow icon is gone from the
markup — a border does the job an arrow was doing. `.compare-check` got
`flex: 0 0 auto` so the label does not squeeze when the pill grows.

**The foot is a bar, not more content.** A `border-top` separates the action
row from the body, and `margin-top: auto` pins it to the bottom of the card,
which is what makes the feet of cards in a row line up.

`_smoke.cjs` has a `scheme card structure` section (13 checks: the top row is
exactly badges + save button and nothing nests them, the category badge is the
one the wrapping rule targets, View Details has no SVG, the foot is the card's
last element, the save button keeps its accessible name and pressed state).
`_css.cjs` asserts the CSS side, including that
`.scheme-card__badges .badge-navy` out-specifies `.badge` for `white-space` —
without that precedence the overlap comes straight back.

## The home page has no category chips

The hero used to carry a row of six area chips (Scholarships, SC / ST / OBC,
College & University, School Education, Hostel & Residential, School Meals).
It does not any more. `config.homeChips`, the `#heroChips` nav, `paintChips()`
and the CSS that painted those chips for the navy field were all removed, and
`_css.cjs` fails if any of those selectors reappear in the stylesheets.

Nothing became unreachable. Every thematic area in the dataset is offered by
the Explorer's own category facet — including the four niche areas
(Digital Education, Girl Child Education, Higher Education - Institutional
Excellence, Skill Development & Vocational Training) that were never on the
home page — and `_smoke.cjs` asserts that facet covers all ten areas. The
aid-type row below the hero is the one remaining chip shelf, and it is still
checked for duplicate filters, zero counts, dead aid types and empty result
pages.

## Wiring in a real backend

The app reads one URL. Point `dataUrl` in `assets/js/config.js` at an API
endpoint and it will work, as long as the response keeps the shape of
`schemes.enriched.json` — a `schemes` array, plus `meta` and
`filter_vocabulary` at the top level. `store.js` normalises what it can and
copes with a missing optional field, but it does not guess at a different
schema.

To add a language, add an entry to `languages` in `config.js` and a matching
string table in `i18n.js`. Mark it `ready: false` until the strings are
reviewed; the selector shows a "translation in progress" notice for those,
because unreviewed translations of a government service are worse than none.
Scheme data itself stays in English — translating scheme names, benefits and
eligibility rules is a sourcing job, not a UI job.

## Outstanding data work

Found while building this, unresolved, all recorded in each record's `_review`:

1. **CSIS is a component of PM-USP.** They appear as two separate cards with
   overlapping income ceilings. One of them should probably be a sub-record.
2. **Two misnamed ids.** `PMMVY-EDU-NOTE` and `PM-YOUNG-ACHIEVERS-ST` do not
   match their contents; the latter's `short_name` is NFST.
3. **PM Vidyalaxmi's `max_income` of 800000 covers only the 3% interest
   subvention**, not the Rs. 7.5 lakh loan it is named for. Anyone reading the
   filter will draw the wrong conclusion.
4. **Top Class EBC and OBC ceilings differ** in the source text and the
   difference is not modelled.
5. **PM-YASASVI, POST-MATRIC-SC and NFST have no income ceiling recorded**, so
   they are filtered out of every specific income band until a figure is
   sourced. The explorer counts them and offers to show them.

These need a decision from someone who can check the source documents. The app
is built so that each one degrades to an honest "not recorded" rather than a
confident wrong answer.
