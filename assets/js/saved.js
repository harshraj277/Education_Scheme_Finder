/* ==========================================================================
   Yojana Setu — saved.js

   SavedSchemeCard. Storage is localStorage only. The page says so, because a
   user who saves something and comes back to an empty list needs to know it
   never left their browser.
   ========================================================================== */

(function () {
  "use strict";

  const t = (k, v) => YS.i18n.t(k, v);
  const $ = YS.ui.$;
  const esc = YS.ui.esc;

  function render() {
    const host = $("#savedRoot");
    host.removeAttribute("aria-busy");
    const list = YS.store.savedSchemes();
    const n = list.length;

    $("#savedCount").textContent = n
      ? n + " " + (n === 1 ? t("sv.count") : t("sv.countPlural"))
      : "";

    $("#clearSaved").style.display = n ? "" : "none";

    if (n === 0) {
      host.innerHTML = YS.ui.emptyState({
        icon: "bookmark",
        title: t("sv.empty"),
        body: t("sv.emptyP"),
        actions: [
          { label: t("nav.explore"), href: "explore.html", cls: "btn-primary" },
          { label: t("btn.quickMatch"), href: "quick-match.html", cls: "btn-secondary" }
        ]
      });
      return;
    }

    host.innerHTML = '<div class="card-grid">' +
      list.map((s) => YS.ui.schemeCard(s)).join("") + "</div>";

    YS.ui.setRepaint(() => {
      const fresh = YS.store.savedSchemes();
      host.innerHTML = fresh.length
        ? '<div class="card-grid">' + fresh.map((s) => YS.ui.schemeCard(s)).join("") + "</div>"
        : YS.ui.emptyState({
            icon: "bookmark",
            title: t("sv.empty"),
            body: t("sv.emptyP"),
            actions: [{ label: t("nav.explore"), href: "explore.html", cls: "btn-primary" }]
          });
      $("#savedCount").textContent = fresh.length
        ? fresh.length + " " + (fresh.length === 1 ? t("sv.count") : t("sv.countPlural"))
        : "";
    });
  }

  function ready(err) {
    if (err) {
      $("#savedRoot").innerHTML = YS.ui.errorBox(err);
      $("#savedRoot").removeAttribute("aria-busy");
      return;
    }
    YS.store.applyLang();

    $("#storageNote").innerHTML = YS.ui.icon("info") +
      "<span>" + esc(t("sv.stored")) + "</span>";

    render();

    $("#clearSaved").addEventListener("click", () => {
      if (!YS.store.savedCount()) return;
      YS.ui.modal({
        title: t("btn.clear"),
        subtitle: t("sv.stored"),
        body: "<p>" + esc(t("sv.cleared")) + "</p>",
        onAction: (act) => {
          if (act !== "clear-saved") return;
          YS.store.clearSaved();
          render();
          YS.ui.toast(esc(t("sv.cleared")), { icon: "bookmark", duration: 2400 });
        },
        actions:
          '<button type="button" class="btn btn-secondary" data-close>' + esc(t("btn.close")) + "</button>" +
          '<button type="button" class="btn btn-primary" data-modal-action="clear-saved">' +
            esc(t("btn.clear")) + "</button>"
      });
    });

    YS.store.on("saved", render);
  }

  YS.ui.boot("saved", ready);

  YS.onLangChange = function () {
    YS.store.applyLang();
    if (!YS.store.isLoaded()) return;
    $("#storageNote").innerHTML = YS.ui.icon("info") +
      "<span>" + esc(t("sv.stored")) + "</span>";
    render();
  };
})();
