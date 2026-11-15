# ZotFields

![ZotFields logo](assets/zotfields-logo.png)

**Custom research metadata for your Zotero library.**

Custom research metadata for Zotero desktop. Version 1.1.0 targets Zotero 7.0.10–10.0.x. Exports research metadata alongside all columns provided by Zotero's standard CSV exporter.

## Features
- Research metadata section in the right item pane.
- Read status dropdown; foundational paper checkbox; editable multi-select Methods.
- Add method options directly in the item pane.
- Tools → ZotFields: Edit selected item's metadata… opens a separate editor for the selected reference.
- Tools → ZotFields: Manage custom fields, or the panel button, edits field definitions for the whole profile.
- Add text, boolean, single-choice and multiple-choice fields. Rename field/option labels. Merge options into an existing option without losing stored assignments.
- Optional library columns (enable through the column-header menu).
- Copy/paste JSON export/import of field definitions.
- Combined CSV export with Zotero bibliographic data and a column for every custom research field.
- Export selected references, the current collection (with optional subcollections), or the current library. Optionally include child notes.

## Install and use
Install the XPI through Zotero Tools → Plugins → Install Plugin From File. Select a bibliographic item and open Research metadata. Changes save immediately; text fields save on leaving the input. Read-only libraries cannot be edited. Open item panels refresh when definitions change.

To add a field, open Tools → ZotFields: Manage custom fields… and click Add field…. Enter its name in the form, choose Text, Checkbox (yes/no), Single choice or Multiple choice, then click Save field. Choice fields start without options: use their Add option… button to add them. Cancel closes the form without saving.

Install version 1.1.0 over the existing ZotFields plugin to update it. The plugin ID and metadata storage format are unchanged; existing field definitions and item values are retained.

## Export bibliographic data and research metadata

1. Select references in Zotero, or select the collection or library you want to export.
2. Choose **Tools → ZotFields: Export CSV with research metadata…**. The same command appears when you right-click references, and **Export this item…** is available in the Research metadata panel.
3. Choose Selected references, Collection or Library. For a collection, choose whether to include subcollections. Child notes are optional.
4. Click **Export CSV…** and choose the file location.

The file contains Zotero's standard CSV columns, including title, authors, year, journal, DOI, abstract, tags and attachment references, followed by columns such as `ZotFields: Read status`, `ZotFields: Foundational paper` and `ZotFields: Methods`. All custom fields are included, even if their library columns are hidden. Single-choice and multiple-choice values use their current labels; methods are separated by `; `. Yes/no fields export as `Yes` or `No`, while unset values stay blank. Duplicate custom headings are disambiguated with field IDs.

The standard columns come from the installed Zotero CSV translator. This avoids maintaining a separate, incomplete list of bibliographic fields. The export includes references only; notes may be included in their parent's Notes column, and attachment metadata remains in the native attachment columns. Attachment files are not copied. Deleted references are excluded.

CSV files use UTF-8 with a BOM for spreadsheet compatibility. Multiline custom text, commas, quotation marks and Unicode are preserved. Formula-like cell contents are exported with a leading apostrophe so a spreadsheet treats them as text. Zotero's stored values are unchanged. If a ZotFields record is malformed or duplicated, the export reports the affected reference and leaves any existing destination file untouched. Cancelling the save picker also leaves existing files untouched.

The JSON controls in the field manager continue to transfer field definitions between profiles. The CSV command exports item values together with bibliographic data.

## Storage and portability
Values are stored in one `ZotFields: {JSON}` line in Extra, using stable field/option identifiers. Other Extra content is preserved. Values therefore remain after uninstall and travel with Zotero item sync. Definitions and option-merge aliases are stored in a local preference, not synced automatically: export/import definitions on every computer that edits the same library. Import replaces definitions and does not delete stored values. Keep exported definitions with library backups. Renaming a label changes its display globally without rewriting item values. Merging creates an alias; historical raw IDs remain until a field is saved again. An absent boolean displays unchecked but has no value until edited.

## Limits
No custom bulk editor, ordering controls, destructive field deletion, automatic inference or evidence matrix in this version. Use Zotero Advanced Search on Extra for raw content; custom columns do not add native typed search operators. Unknown option IDs remain visible, and malformed/duplicate ZotFields records block edits rather than overwrite data. Do not change field types or IDs in JSON after use. Export is a text area for copying, not a file-picker export.

## Validation
Run `node tests.cjs`, `node csv-tests.cjs`, `node package-tests.cjs` and `node --check` on JavaScript files. Tests cover Extra preservation and refusal of malformed records, option aliases, schema validation and serialized edits using mocked Zotero items. The additional native UI tests cover the manager, item-pane translation, controls and independent values on two real items, custom fields, direct editing and add-on cleanup in Zotero 10.0.8 Linux. See docs/TESTING.md.

## Build
Run `python3 build.py` from the repository root. The XPI is written to `dist/ZotFields_v1.1.0.xpi`. Building requires Python 3 only; unit tests require Node.js. The generated package includes the branded Plugins manager icons and item-pane icons.

Source is supplied for review; no distribution license has been selected. See [LICENSE-STATUS.md](LICENSE-STATUS.md).


## Included downloads

- [Installable ZotFields 1.1.0](dist/ZotFields_v1.1.0.xpi)
- [Changelog](CHANGELOG.md)
- [Testing and manual validation](docs/TESTING.md)
- [Publishing this repository](docs/PUBLISHING.md)
- [Contributing](CONTRIBUTING.md)

ZotFields is an independent plugin and is not affiliated with or endorsed by Zotero. Brand artwork was generated with AI assistance.
