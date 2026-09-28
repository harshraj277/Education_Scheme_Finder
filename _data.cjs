/* Prints every _review note, grouped by the kind of problem it describes, so
   the outstanding data work can be triaged without opening the JSON by hand.
     node _data.mjs            */
const d = require("./data/schemes.enriched.json");

const groups = [
  ["Duplicate / overlapping records", /component of|overlap|duplicate|same scheme|sub-record/i],
  ["Id or name does not match content", /misnamed|does not match|short_name|wrong id|renam/i],
  ["A stored figure has a narrower meaning than its label", /only covers|interest subvention|not the full|labelled|narrower/i],
  ["Two figures conflict, or one is missing", /differs|no ceiling|not recorded|unstated|missing|no figure|not stated/i],
  ["Non-obvious eligibility condition not modelled", /only.child|rural|employer|priority|competition|block|availability|not expressible|entrance/i]
];

const assigned = new Map();

groups.forEach(([title, re]) => {
  const hits = [];
  d.schemes.forEach(s => (s._review || []).forEach((n, i) => {
    if (re.test(n)) { hits.push([s.id, n]); assigned.set(s.id + "::" + i, true); }
  }));
  if (hits.length) {
    console.log("\n" + title.toUpperCase());
    console.log("-".repeat(title.length));
    hits.forEach(([id, n]) => console.log("  " + id.padEnd(26) + n));
  }
});

const rest = [];
d.schemes.forEach(s => (s._review || []).forEach((n, i) => {
  if (!assigned.has(s.id + "::" + i)) rest.push([s.id, n]);
}));
if (rest.length) {
  console.log("\nOTHER");
  console.log("------");
  rest.forEach(([id, n]) => console.log("  " + id.padEnd(26) + n));
}

console.log("\n" + d.schemes.reduce((a, s) => a + s._review.length, 0) + " notes across " +
  d.schemes.filter(s => s._review.length).length + " of " + d.schemes.length + " records");
