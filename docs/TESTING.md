# Validation

## Automated checks

From the repository root:

```sh
node tests.cjs
node package-tests.cjs
node --check bootstrap.js
node --check core.js
node --check plugin.js
node --check manager.js
python3 build.py
```

The 15 tests cover Extra preservation, malformed or duplicate record refusal, schema validation, merge aliases, unknown options, boolean state and queued saves. Icon packaging is checked independently during this delivery.

## Manual checklist — not yet completed

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

Record Zotero version, OS and observed results. Windows UI and end-to-end editing remain untested.

## 1.0.1 live installation validation

Used the official Zotero 10.0.8 Linux build (BuildID 20261106171756) in an isolated headless profile and separate empty data directory. The extension manager reported version 1.0.1, active=true, appDisabled=false, userDisabled=false, with target range 7.0.10 to 10.0.*. Startup invoked the plugin and registered its section and columns. This validates installation and initial activation; it is not a visual Windows UI test.

The package checks verify required manifest entries and confirm that removing update_url makes the build fail before packaging.
