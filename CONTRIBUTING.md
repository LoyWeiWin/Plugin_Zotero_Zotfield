# Contributing

Please discuss proposed contributions with the repository owner while licensing is pending.

Keep changes focused. Preserve existing Extra text, stable identifiers, queued saves, and read-only-library behavior. Do not write directly to Zotero SQLite tables. Include a meaningful regression check for data-handling changes and describe which Zotero version and operating system you tested.

Run `node tests.cjs`, syntax-check the JavaScript files, and run `python3 build.py` before submitting a change. Do not claim live compatibility from unit tests alone.
