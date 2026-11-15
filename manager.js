"use strict";

(() => {
  const HTML_NS = "http://www.w3.org/1999/xhtml";
  const $ = id => document.getElementById(id);
  let P, C;
  let initialized = false;

  function message(text) { $("message").textContent = text; }
  function fail(error) {
    message("ZotFields: " + (error.message || String(error)));
    console.error("ZotFields field manager", error);
  }
  function node(tag, text) {
    // In XML, createElement() creates unnamespaced, inactive controls.
    const element = document.createElementNS(HTML_NS, tag);
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function button(parent, label, handler) {
    const element = node("button", label);
    element.type = "button";
    element.addEventListener("click", () => Promise.resolve().then(handler).catch(fail));
    parent.append(element);
  }
  async function update(schema) {
    await P.setSchema(schema);
    render();
    message("Saved. Open item panels have been updated.");
  }
  function render() {
    const root = $("fields");
    root.replaceChildren();
    for (const field of P.schema()) {
      const box = node("fieldset");
      box.append(node("legend", field.label + " (" + field.type + ")"));
      button(box, "Rename field…", async () => {
        const label = P.ask(window, "Field label", field.label);
        if (!label) return;
        const schema = P.schema();
        schema.find(value => value.id === field.id).label = label;
        await update(schema);
      });
      const label = node("label");
      const check = node("input");
      check.type = "checkbox";
      check.checked = !!field.column;
      check.addEventListener("change", async () => {
        try {
          const schema = P.schema();
          schema.find(value => value.id === field.id).column = check.checked;
          await update(schema);
        } catch (error) { fail(error); }
      });
      label.append(check, document.createTextNode(" Available as a library column"));
      box.append(label);
      if (field.options) {
        const select = node("select");
        select.setAttribute("aria-label", field.label + " options");
        for (const option of field.options) {
          const element = node("option", option.label);
          element.value = option.id;
          select.append(element);
        }
        box.append(select);
        button(box, "Add option…", async () => {
          const name = P.ask(window, "New option", "");
          if (!name) return;
          const schema = P.schema();
          const current = schema.find(value => value.id === field.id);
          if (current.options.some(option => option.label.toLowerCase() === name.toLowerCase())) {
            throw Error("Option already exists");
          }
          current.options.push({ id: P.uid(), label: name });
          await update(schema);
        });
        button(box, "Rename option…", async () => {
          const old = field.options.find(option => option.id === select.value);
          if (!old) return;
          const name = P.ask(window, "New option label", old.label);
          if (!name) return;
          if (field.options.some(option => option.id !== old.id && option.label.toLowerCase() === name.toLowerCase())) {
            throw Error("Use Merge to combine duplicate options");
          }
          const schema = P.schema();
          schema.find(value => value.id === field.id).options.find(option => option.id === old.id).label = name;
          await update(schema);
        });
        button(box, "Merge / reassign option…", async () => {
          const old = field.options.find(option => option.id === select.value);
          if (!old) return;
          const name = P.ask(window, "Enter the existing destination option label. The selected option will be reassigned on display and on future saves.", "");
          if (!name) return;
          const target = field.options.find(option => option.label.toLowerCase() === name.toLowerCase());
          if (!target || target.id === old.id) throw Error("Choose a different existing option");
          const schema = P.schema();
          const current = schema.find(value => value.id === field.id);
          current.aliases = { ...current.aliases, [old.id]: target.id };
          current.options = current.options.filter(option => option.id !== old.id);
          await update(schema);
        });
      }
      root.append(box);
    }
  }
  function showAddForm() {
    $("new-field-form").hidden = false;
    message("");
    $("field-label").focus();
    $("field-label").scrollIntoView({ block: "nearest" });
  }
  function hideAddForm() {
    $("new-field-form").hidden = true;
    $("new-field-form").reset();
    $("add").focus();
  }
  async function addField(event) {
    event.preventDefault();
    const saveButton = $("save-field");
    if (saveButton.disabled) return;
    try {
      const label = $("field-label").value.trim();
      const type = $("field-type").value;
      if (!label) {
        $("field-label").focus();
        throw Error("Enter a field name.");
      }
      const schema = P.schema();
      if (schema.some(field => field.label.toLowerCase() === label.toLowerCase())) {
        throw Error("Field label already exists.");
      }
      schema.push({
        id: P.uid(), label, type, column: false,
        ...(["choice", "multi"].includes(type) ? { options: [] } : {})
      });
      saveButton.disabled = true;
      await update(schema);
      hideAddForm();
    } catch (error) { fail(error); }
    finally { saveButton.disabled = false; }
  }
  function initialize() {
    if (initialized) return;
    initialized = true;
    try {
      const argument = window.arguments?.[0];
      const api = argument?.wrappedJSObject || argument;
      if (!api?.plugin || !api?.core) throw Error("The field manager could not connect to ZotFields. Close this window and open it again from Tools.");
      P = api.plugin;
      C = api.core;
      P.managers.add(window);
      window.addEventListener("unload", () => P.managers.delete(window), { once: true });
      $("add").addEventListener("click", showAddForm);
      $("cancel-field").addEventListener("click", hideAddForm);
      $("new-field-form").addEventListener("submit", addField);
      $("export").addEventListener("click", () => {
        try {
          $("json").value = JSON.stringify(P.schema(), null, 2);
          message("Field definitions are ready to copy.");
        } catch (error) { fail(error); }
      });
      $("import").addEventListener("click", async () => {
        try {
          const schema = C.validate(JSON.parse($("json").value));
          if (!window.confirm("Replace field definitions? Export the current definitions first if you need to restore them.")) return;
          await update(schema);
        } catch (error) { fail(error); }
      });
      render();
      message("");
    } catch (error) { fail(error); }
  }

  // Gecko chrome XHTML may execute scripts immediately despite defer.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
