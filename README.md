# ZotFields

![ZotFields logo](assets/zotfields-logo.png)

**Custom research metadata for your Zotero library.**

Custom research metadata for Zotero desktop. Initial build targeting Zotero 7.0.10–10.0.x; installation and activation verified on Zotero 10.0.8 for Linux in an isolated headless profile. Windows UI and end-to-end editing remain unverified.

## Features
- Research metadata section in the right item pane.
- Read status dropdown; foundational paper checkbox; editable multi-select Methods.
- Add method options directly in the item pane.
- Tools → ZotFields: Manage custom fields, or the panel button.
- Add text, boolean, single-choice and multiple-choice fields. Rename field/option labels. Merge options into an existing option without losing stored assignments.
- Optional library columns (enable through the column-header menu).
- Copy/paste JSON export/import of field definitions.

## Install and use
Install the XPI through Zotero Tools → Plugins → Install Plugin From File. Select a bibliographic item and open Research metadata. Changes save immediately; text fields save on leaving the input. Read-only libraries cannot be edited. Re-select an item after changing definitions.

## Storage and portability
Values are stored in one `ZotFields: {JSON}` line in Extra, using stable field/option identifiers. Other Extra content is preserved. Values therefore remain after uninstall and travel with Zotero item sync. Definitions and option-merge aliases are stored in a local preference, not synced automatically: export/import definitions on every computer that edits the same library. Import replaces definitions and does not delete stored values. Keep exported definitions with library backups. Renaming a label changes its display globally without rewriting item values. Merging creates an alias; historical raw IDs remain until a field is saved again. An absent boolean displays unchecked but has no value until edited.

## Limits
No custom filter window, bulk editor, ordering controls, destructive field deletion, automatic inference or evidence matrix in this version. Use Zotero Advanced Search on Extra for raw content; custom columns do not add native typed search operators. Unknown option IDs remain visible, and malformed/duplicate ZotFields records block edits rather than overwrite data. Do not change field types or IDs in JSON after use. Export is a text area for copying, not a file-picker export.

## Validation
Run `node tests.cjs` and `node package-tests.cjs` and `node --check` on JavaScript files. Tests cover Extra preservation and refusal of malformed records, option aliases, schema validation and serialized edits using mocked Zotero items. The 1.0.1 XPI was accepted and activated by Zotero 10.0.8 on Linux. Windows UI and end-to-end editing remain untested.

## Build
Run `python3 build.py` from the repository root. The XPI is written to `dist/ZotFields_v1.0.1.xpi`. Building requires Python 3 only; tests require Node.js. The generated package includes the branded Plugins manager icons and item-pane icons.

Source is supplied for review; no distribution license has been selected. See [LICENSE-STATUS.md](LICENSE-STATUS.md).


## Included downloads

- [Installable ZotFields 1.0.1](dist/ZotFields_v1.0.1.xpi)
- [Changelog](CHANGELOG.md)
- [Testing and manual validation](docs/TESTING.md)
- [Publishing this repository](docs/PUBLISHING.md)
- [Contributing](CONTRIBUTING.md)

ZotFields is an independent plugin and is not affiliated with or endorsed by Zotero. Brand artwork was generated with AI assistance.


## 1.0.1 installation fix

Adds the required `applications.zotero.update_url` manifest entry. The reserved `.invalid` URL is intentionally not a hosted update service: updates must be installed manually until a repository and update feed are published. Also uses Zotero's documented Fluent resource registration and isolates the bootstrap script-loading scope. No library data is changed by installation.
