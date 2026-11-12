# Publish the repository

Suggested repository name: `ZotFields`

Suggested description: Editable research metadata for Zotero: read status, foundational papers, multi-select methods and custom fields.

This archive contains the repository files, not an existing hosted GitHub repository. Extract it before uploading; uploading the ZIP itself will not create a browsable source tree.

## GitHub website

1. Create a repository named ZotFields in your chosen account. Choose its visibility.
2. Upload the extracted contents, including the assets, icons, locale, docs and dist folders.
3. Select a distribution license when ready. The current license-status notice does not grant an open-source license.
4. After live validation, create a `v1.0.1` release and attach `dist/ZotFields_v1.0.1.xpi`.

## Command line

After authenticating the GitHub CLI, run from the extracted repository folder:

```sh
git init -b main
git add .
git commit -m "Add ZotFields 1.0.1 with branded icons"
gh repo create ZotFields --private --source=. --remote=origin --push
```

This example creates a private repository. Change visibility deliberately when you are ready. No workflow publishes releases automatically.
