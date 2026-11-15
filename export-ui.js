"use strict";

(() => {
  const $ = id => document.getElementById(id);
  let plugin, exporter, context;
  function scopeChanged() { $("recursive-label").hidden = $("scope").value !== "collection"; }
  async function exportCSV(event) {
    event.preventDefault();
    const button = $("save-csv");
    if (button.disabled) return;
    button.disabled = true;
    $("status").textContent = "Preparing export…";
    try {
      await plugin.queue;
      const items = await exporter.items(context, $("scope").value, $("recursive").checked);
      const output = await exporter.buildCSV(items, plugin.schema(), { includeNotes: $("include-notes").checked });
      const path = await exporter.saveCSV(window, output.csv);
      $("status").textContent = path ? "Exported " + output.count + " reference" + (output.count === 1 ? "" : "s") + " with " + output.fieldCount + " research fields.\n" + path : "Export cancelled.";
    } catch (error) {
      $("status").textContent = "Export failed: " + (error.message || String(error));
      console.error("ZotFields CSV export", error);
    } finally { button.disabled = false; }
  }
  function initialize() {
    try {
      const argument = window.arguments?.[0];
      const api = argument?.wrappedJSObject || argument;
      if (!api?.plugin || !api?.exporter || !api?.context) throw Error("Close this window and reopen export from Zotero's Tools menu.");
      plugin = api.plugin; exporter = api.exporter; context = api.context;
      plugin.exportWindows.add(window);
      window.addEventListener("unload", () => plugin.exportWindows.delete(window), { once: true });
      $("scope-selected").textContent = "Selected references (" + context.selected.length + ")";
      $("scope-selected").disabled = !context.selected.length;
      $("scope-collection").textContent = context.collectionID == null ? "Current collection (none selected)" : "Collection: " + context.collectionName;
      $("scope-collection").disabled = context.collectionID == null;
      $("scope-library").textContent = context.libraryID == null ? "Current library (none selected)" : "Library: " + context.libraryName;
      $("scope-library").disabled = context.libraryID == null;
      $("scope").value = context.selected.length ? "selected" : context.collectionID != null ? "collection" : "library";
      $("field-summary").textContent = "Custom columns use the prefix “ZotFields:”, including fields that are hidden in the library table.";
      $("scope").addEventListener("change", scopeChanged);
      $("export-form").addEventListener("submit", exportCSV);
      $("close-export").addEventListener("click", () => window.close());
      scopeChanged();
    } catch (error) {
      $("save-csv").disabled = true;
      $("status").textContent = "ZotFields: " + (error.message || String(error));
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
