"use strict";

(() => {
  function initialize() {
    const body = document.getElementById("item-fields");
    try {
      const argument = window.arguments?.[0];
      const api = argument?.wrappedJSObject || argument;
      if (!api?.plugin || !api?.item) throw Error("Close this window and open the editor again from Tools.");
      document.getElementById("item-title").textContent = api.item.getField("title") || "Untitled item";
      const context = { body, item: api.item, editable: api.editable };
      api.plugin.panels.set(body, () => api.plugin.render(context));
      api.plugin.editors.add(window);
      window.addEventListener("unload", () => {
        api.plugin.panels.delete(body);
        api.plugin.editors.delete(window);
      }, { once: true });
      api.plugin.render(context);
    } catch (error) {
      body.textContent = "ZotFields: " + (error.message || String(error));
      console.error("ZotFields item editor", error);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
