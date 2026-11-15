"use strict";
async function runZotFieldsUISmoke(P, C) {
  const results = [];
  const check = (condition, label) => {
    if (!condition) throw Error(label);
    results.push(label);
  };
  const main = Zotero.getMainWindow();
  const pause = () => new Promise(resolve => main.setTimeout(resolve, 30));
  async function until(condition, label) {
    for (let attempt = 0; attempt < 160; attempt++) {
      if (condition()) return;
      await pause();
    }
    throw Error("Timed out: " + label);
  }
  await until(() => main.document.getElementById("zotfields-manage"), "Tools menu");
  main.document.getElementById("zotfields-manage").doCommand();
  let win;
  await until(() => {
    win = Array.from(Services.wm.getEnumerator(null)).find(value => value.location.href === "chrome://zotfields/content/manager.xhtml");
    return win?.document.readyState === "complete";
  }, "manager window");
  const doc = win.document;
  const $ = id => doc.getElementById(id);
  try {
    check($("fields").children.length === 3, "manager initializes all default fields");
    check(doc.querySelector("#fields button") instanceof win.HTMLButtonElement, "dynamic controls are native HTML controls");
    $("add").click();
    check(!$("new-field-form").hidden, "Add field opens the form");
    $("save-field").click();
    await pause();
    check($("message").textContent.includes("Enter a field name"), "empty field name reports a visible error");
    const original = P.schema();
    for (const type of ["text", "boolean", "choice", "multi"]) {
      $("add").click();
      $("field-label").value = "Smoke " + type;
      $("field-type").value = type;
      $("save-field").click();
      await until(() => P.schema().some(field => field.label === "Smoke " + type) && $("new-field-form").hidden, "save " + type);
      check(P.schema().find(field => field.label === "Smoke " + type).type === type, "creates " + type + " field");
    }
    check(JSON.stringify(P.schema().slice(0, 3)) === JSON.stringify(original), "adding fields preserves existing definitions");
    $("add").click();
    $("field-label").value = "  SMOKE text  ";
    $("save-field").click();
    await pause();
    check(P.schema().length === 7 && $("message").textContent.includes("already exists"), "duplicate names are rejected without changing definitions");
    $("cancel-field").click();
    check($("new-field-form").hidden && P.schema().length === 7, "Cancel closes the form without saving");
    let field = P.schema().find(field => field.type === "text");
    let box = Array.from($("fields").children).find(box => box.querySelector("legend").textContent === "Smoke text (text)");
    box.querySelector("input").click();
    await until(() => P.schema().find(value => value.id === field.id).column, "column enable");
    check(true, "library column checkbox saves");
    const ask = P.ask;
    try {
      P.ask = () => "Renamed text";
      box = Array.from($("fields").children).find(box => box.querySelector("legend").textContent === "Smoke text (text)");
      box.querySelector("button").click();
      await until(() => P.schema().some(value => value.label === "Renamed text"), "rename field");
      check(true, "Rename field button saves");
      const multiBox = () => Array.from($("fields").children).find(box => box.querySelector("legend").textContent === "Smoke multi (multi)");
      const clickButton = (label) => Array.from(multiBox().querySelectorAll("button")).find(button => button.textContent === label).click();
      P.ask = () => "Sample method";
      clickButton("Add option…");
      await until(() => P.schema().find(value => value.label === "Smoke multi").options.length === 1, "add option");
      P.ask = () => "Renamed method";
      clickButton("Rename option…");
      await until(() => P.schema().find(value => value.label === "Smoke multi").options[0].label === "Renamed method", "rename option");
      P.ask = () => "Destination method";
      clickButton("Add option…");
      await until(() => P.schema().find(value => value.label === "Smoke multi").options.length === 2, "add destination");
      const oldID = P.schema().find(value => value.label === "Smoke multi").options[0].id;
      multiBox().querySelector("select").value = oldID;
      clickButton("Merge / reassign option…");
      await until(() => P.schema().find(value => value.label === "Smoke multi").options.length === 1, "merge option");
      const multi = P.schema().find(value => value.label === "Smoke multi");
      check(multi.aliases[oldID] === multi.options[0].id, "add, rename and merge option buttons work");
    } finally { P.ask = ask; }
    $("export").click();
    check(JSON.stringify(JSON.parse($("json").value)) === JSON.stringify(P.schema()), "Export definitions copies current schema");
    const imported = P.schema();
    imported.push({id:"smoke_import",label:"Imported field",type:"text",column:false});
    $("json").value = JSON.stringify(imported);
    const confirm = win.confirm;
    win.confirm = () => true;
    try {
      $("import").click();
      await until(() => P.schema().some(value => value.id === "smoke_import"), "import definitions");
    } finally { win.confirm = confirm; }
    check(true, "Import definitions saves");
    const item = new Zotero.Item("journalArticle");
    item.libraryID = Zotero.Libraries.userLibraryID;
    item.setField("title", "ZotFields isolated UI smoke test");
    item.setField("extra", "Unrelated metadata remains.");
    await item.saveTx();
    const body = doc.createElementNS("http://www.w3.org/1999/xhtml", "div");
    P.render({body, item, editable:true});
    const text = body.querySelector('textarea[aria-label="Renamed text"]');
    text.value = "Saved through the item panel";
    text.dispatchEvent(new win.Event("change"));
    await P.queue;
    check(C.read(item.getField("extra"))[field.id] === text.value && item.getField("extra").includes("Unrelated metadata remains."), "new field values save while preserving unrelated Extra");
    win.close();
    P.manage(main);
    await until(() => {
      win = Array.from(Services.wm.getEnumerator(null)).find(value => value.location.href === "chrome://zotfields/content/manager.xhtml" && !value.closed);
      return win?.document.getElementById("fields")?.children.length === 8;
    }, "reopen manager");
    check(true, "definitions persist after closing and reopening manager");
    return {passed:results.length,checks:results,version:Zotero.version,platform:"Linux x86_64 headless"};
  } finally {
    if (win && !win.closed) win.close();
  }
}
