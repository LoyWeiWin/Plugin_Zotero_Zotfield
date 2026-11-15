"use strict";

var ZFExporter = {
  csvTranslatorID: "25f4c5e2-d790-4daa-a667-797619c7e2f2",

  regularItems(items) {
    const seen = new Set();
    return items.filter(item => {
      if (!item.isRegularItem() || item.deleted) return false;
      const id = item.libraryID + "/" + item.key;
      if (seen.has(id)) return false;
      seen.add(id); return true;
    });
  },

  context(win) {
    const pane = win.ZoteroPane;
    const selected = this.regularItems(pane.getSelectedItems());
    const collections = pane.getSelectedCollections();
    const libraryIDs = pane.getSelectedLibraryIDs();
    const selectedLibraries = [...new Set(selected.map(item => item.libraryID))];
    const libraryID = libraryIDs.length === 1 ? libraryIDs[0] : selectedLibraries.length === 1 ? selectedLibraries[0] : null;
    return {
      selected,
      collectionID: collections.length === 1 ? collections[0].id : null,
      collectionName: collections.length === 1 ? collections[0].name : "",
      libraryID,
      libraryName: libraryID == null ? "" : Zotero.Libraries.getName(libraryID)
    };
  },

  async items(context, scope, recursive) {
    let items;
    if (scope === "selected") items = context.selected;
    else if (scope === "library" && context.libraryID != null) {
      items = await Zotero.Items.getAll(context.libraryID, true, false);
    } else if (scope === "collection" && context.collectionID != null) {
      const search = new Zotero.Search();
      search.libraryID = context.libraryID;
      search.addCondition("collectionID", "is", context.collectionID);
      if (recursive) search.addCondition("recursive", "true");
      items = await Zotero.Items.getAsync(await search.search());
    } else throw Error("Choose a selected set of references, a collection or a single library.");
    const references = this.regularItems(items);
    if (!references.length) throw Error("There are no bibliographic references to export in this selection.");
    return references;
  },

  async buildCSV(items, schema, options = {}) {
    const fields = ZFCore.validate(JSON.parse(JSON.stringify(schema)));
    const references = this.regularItems(items);
    if (!references.length) throw Error("There are no bibliographic references to export.");
    const translators = await Zotero.Translators.getAllForType("export");
    const translator = translators.find(value => value.translatorID === this.csvTranslatorID);
    if (!translator) throw Error("Zotero's standard CSV exporter is not available in this profile.");
    const translation = new Zotero.Translate.Export();
    translation.setItems(references.slice());
    translation.setTranslator(translator);
    translation.setDisplayOptions({ exportNotes: !!options.includeNotes, exportFileData: false, exportCharset: "UTF-8" });
    await translation.translate();
    const valuesByKey = new Map();
    for (const item of references) {
      if (valuesByKey.has(item.key)) throw Error("Export one Zotero library at a time so reference keys remain unique.");
      try { valuesByKey.set(item.key, ZFCore.read(item.getField("extra"))); }
      catch (error) { throw Error("Cannot export research metadata for “" + item.getField("title") + "” (" + item.key + "): " + error.message); }
    }
    return { csv: ZFCSV.append(translation.string, fields, valuesByKey), count: references.length, fieldCount: fields.length };
  },

  async pickFile(win) {
    const { FilePicker } = ChromeUtils.importESModule("chrome://zotero/content/modules/filePicker.mjs");
    const picker = new FilePicker();
    picker.init(win, "Export Zotero data and research metadata", picker.modeSave);
    picker.defaultString = "ZotFields-export.csv";
    picker.defaultExtension = "csv";
    picker.appendFilter("CSV", "*.csv");
    const result = await picker.show();
    return result === picker.returnOK || result === picker.returnReplace ? picker.file : null;
  },

  async saveCSV(win, csv) {
    const path = await this.pickFile(win);
    if (!path) return null;
    await Zotero.File.putContentsAsync(path, csv);
    return path;
  }
};
