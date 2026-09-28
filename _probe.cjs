const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");
const SITE = __dirname;
const DATA = JSON.parse(fs.readFileSync(path.join(SITE, "data/schemes.enriched.json"), "utf8"));

const dom = new JSDOM(fs.readFileSync(path.join(SITE, "index.html"), "utf8"), {
  url: "http://localhost/index.html", runScripts: "dangerously",
  pretendToBeVisual: true, virtualConsole: new VirtualConsole()
});
const w = dom.window;
w.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(DATA) });
w.matchMedia = w.matchMedia || ((q) => ({ matches: false, media: q,
  addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
for (const src of [...w.document.querySelectorAll("script[src]")].map((s) => s.getAttribute("src"))) {
  w.eval(fs.readFileSync(path.join(SITE, src), "utf8"));
}
setTimeout(() => {
  const css = ["assets/css/theme.css", "assets/css/app.css"]
    .map((f) => fs.readFileSync(path.join(SITE, f), "utf8")).join("\n");
  const s = w.document.createElement("style");
  s.textContent = css;
  w.document.head.appendChild(s);
  w.document.documentElement.setAttribute("data-theme", "dark");

  const h = w.document.querySelector(".site-header");
  const cs = w.getComputedStyle(h);
  console.log("HEADER background      :", JSON.stringify(cs.background));
  console.log("HEADER backgroundColor :", JSON.stringify(cs.backgroundColor));
  console.log("HEADER backgroundImage :", JSON.stringify(cs.backgroundImage));

  const bare = [...w.document.querySelectorAll("main a")].find((a) => !a.className);
  console.log("\nBARE LINK outerHTML    :", bare ? bare.outerHTML.slice(0, 160) : "none");
  console.log("BARE LINK parent chain :", bare ? (() => {
    const out = []; let n = bare;
    while (n && n.tagName !== "BODY") { out.push(n.tagName + (n.className ? "." + String(n.className).split(" ").join(".") : "")); n = n.parentElement; }
    return out.join(" < ");
  })() : "");
  console.log("BARE LINK color        :", JSON.stringify(w.getComputedStyle(bare).color));
  w.close();
}, 250);
