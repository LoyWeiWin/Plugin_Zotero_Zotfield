# Changelog

## 1.1.0

- Add a combined CSV export that runs Zotero's standard CSV translator and appends a column for every research metadata field.
- Add export commands to Tools, the item context menu and the Research metadata panel.
- Support selected references, the current collection (with optional subcollections) and the current library. Child notes can be included.
- Export readable choice labels, resolved merged options, Yes/No booleans and hidden custom fields. Unset values remain blank.
- Preserve Unicode and multiline custom text, escape CSV cells and prevent spreadsheet formula evaluation.
- Refuse malformed research records before opening the save picker. Cancelled or failed exports leave existing destination files untouched.

## 1.0.3

- Fix the empty Research metadata section: Fluent now translates the header label and sidebar tooltip as attributes, preserving the panel body, inputs and navigation icon.
- Add Tools → ZotFields: Edit selected item's metadata… to open the selected reference in a separate editor.
- Refresh open item panels and editors after field definitions change.
- Avoid rebuilding unchanged library columns when adding or editing fields that are not columns.
- Close the manager and item editors when the add-on is disabled or updated.

## 1.0.2

- Fix the unresponsive Add field button by waiting for the manager document to load before attaching its handlers.
- Create dynamic controls in the HTML namespace so buttons, checkboxes and option selectors work in Zotero's XHTML window.
- Replace the Add field prompts with an inline form containing a field name, type dropdown, Save field and Cancel.
- Show validation and startup errors inside the manager window.
- Add an isolated Zotero UI smoke test covering field creation, option management, definition transfer and item-value saving.

## 1.0.1

- Fix installation rejection caused by the missing required `applications.zotero.update_url`.
- Use an explicitly non-hosted `.invalid` update URL; manual installation only until a real update feed is available.
- Add required-manifest preflight to the build.
- Correct Fluent loading to use `MozXULElement.insertFTLIfNeeded`.
- Load plugin scripts into an explicit shared scope.
- Target maximum Zotero version 10.0.*.

## 1.0.0

Initial build with configurable research metadata and branded icons. This build was rejected at installation due to the missing update URL.
