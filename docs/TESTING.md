# Validation

## Automated checks

From the repository root:

```sh
node tests.cjs
node csv-tests.cjs
node package-tests.cjs
node --check bootstrap.js
node --check core.js
node --check plugin.js
node --check manager.js
node --check editor.js
node --check csv.js
node --check export.js
node --check export-ui.js
python3 build.py
```

The 15 tests cover Extra preservation, malformed or duplicate record refusal, schema validation, merge aliases, unknown options, boolean state and queued saves. Icon packaging is checked independently during this delivery.

## 1.1.0 combined CSV export checks

The export tests use the actual official Zotero CSV translator (ID `25f4c5e2-d790-4daa-a667-797619c7e2f2`) in an isolated Zotero 10.0.8 Linux profile. They compare the combined file's native headings and values against a direct native CSV export, then verify research metadata columns, all export scopes, child notes, linked attachment metadata, tags, Unicode, multiline text, merged options, unset and false values, the export window, file saving, cancellation, malformed-data handling and cleanup.

The test initializes Zotero's native FilePicker. For file-save and cancellation checks, it substitutes only the chosen path or cancellation result; the actual CSV generation and atomic file writes run in Zotero. Operating-system picker interaction and Windows visual behavior have not been tested.

Copy `CSV.js` from an installed Zotero translators directory to seed the empty test profile, then run:

```sh
python3 tests/run-zotero-ui-smoke.py \
  --binary /path/to/Zotero/zotero \
  --xpi dist/ZotFields_v1.1.0.xpi \
  --workspace /path/to/new-empty-test-directory \
  --smoke tests/export-ui-smoke.js \
  --csv-translator /path/to/CSV.js
```

`node csv-tests.cjs` checks CSV escaping, multiline content, merged and unknown options, blank and false values, duplicate headings, reference matching, malformed CSV refusal and formula protection. Export results are recorded in export-validation-1.1.0.json (35 checks). The existing item-pane and manager suites also passed against 1.1.0 (31 and 18 checks), recorded in item-pane-validation-1.1.0.json and manager-validation-1.1.0.json. The installed standard CSV translator supplied 87 native columns in this run; custom fields were appended after them.

## 1.0.3 native item-pane regression checks

The official Zotero 10.0.8 Linux build passed 31 checks in headless mode with an isolated profile and empty data directory. The tests translate the actual registered section with Fluent, operate the status dropdown, boolean and multiple-choice controls, switch between two items, save independent values, preserve unrelated Extra text, use the separate item editor, add fields through the manager and check live definition refresh. They also verify read-only controls, malformed-data refusal and cleanup when the add-on stops.

The same translation step against the supplied 1.0.2 XPI removed the section body and left zero fieldsets. This reproduces the reported failure. The fixed resource uses attribute-only messages for the section header and sidebar button.

Run the item-pane suite against the built package:

```sh
python3 tests/run-zotero-ui-smoke.py \
  --binary /path/to/Zotero/zotero \
  --xpi dist/ZotFields_v1.0.3.xpi \
  --workspace /path/to/new-empty-test-directory \
  --smoke tests/item-pane-ui-smoke.js
```

See item-pane-validation-1.0.3.json for the recorded result. The packaged 1.0.3 XPI also passed the existing 18 manager checks (manager-validation-1.0.3.json). A second application session passed six persistence checks on the saved items and schema (restart-validation-1.0.3.json). The existing manager suite below can also be run against 1.0.3. Windows visual behavior, actual group-permission changes and two-computer synchronization have not been tested.

## 1.0.2 native UI regression checks

The official Zotero 10.0.8 Linux build passed 18 checks in headless mode with an isolated profile and empty data directory. The test opened the manager through the Tools menu, clicked its controls, created every supported field type, renamed and merged options, exported and imported definitions, and saved a new field value on a real test item while preserving unrelated Extra text. Definitions remained available after reopening the manager. See ui-validation-1.0.2.json for the recorded checks.

The same test against 1.0.1 failed at manager initialization, reproducing the inactive controls before this fix. Windows visual behavior and two-computer synchronization have not been tested.

The runner requires Python 3 and a Zotero binary. Supply a new empty workspace; it creates a separate profile and data directory. It adds a test hook to an isolated copy of the extension, leaving the release XPI unchanged.

```sh
python3 tests/run-zotero-ui-smoke.py \
  --binary /path/to/Zotero/zotero \
  --xpi dist/ZotFields_v1.0.2.xpi \
  --workspace /path/to/new-empty-test-directory \
  --smoke tests/manager-ui-smoke.js
```

## Remaining manual checklist

Use a separate Zotero profile and a small test library.

1. Install the XPI; verify the Plugins manager icon and Research metadata section.
2. Set each default field, change selection, restart, and check persistence.
3. Add a method from the item panel; select several methods.
4. Rename and merge options in the manager; check display across multiple papers.
5. Add a field of every supported type and enable its library column.
6. Export/import definitions into a second profile. Confirm matching item IDs retain meaning.
7. Confirm read-only group items cannot be edited.
8. Put unrelated text in Extra and confirm it survives edits.
9. Disable/uninstall the plugin; confirm menus and sections disappear and Extra data remains.
10. Test sync on two computers with identical imported definitions.

Record Zotero version, OS and observed results. Windows visual behavior and two-computer synchronization remain untested; end-to-end item editing has been checked in the isolated Linux profile.

## 1.0.1 live installation validation

Used the official Zotero 10.0.8 Linux build (BuildID 20261106171756) in an isolated headless profile and separate empty data directory. The extension manager reported version 1.0.1, active=true, appDisabled=false, userDisabled=false, with target range 7.0.10 to 10.0.*. Startup invoked the plugin and registered its section and columns. This validates installation and initial activation; it is not a visual Windows UI test.

The package checks verify required manifest entries and confirm that removing update_url makes the build fail before packaging.
