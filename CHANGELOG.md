# Changelog

## 1.0.1

- Fix installation rejection caused by the missing required `applications.zotero.update_url`.
- Use an explicitly non-hosted `.invalid` update URL; manual installation only until a real update feed is available.
- Add required-manifest preflight to the build.
- Correct Fluent loading to use `MozXULElement.insertFTLIfNeeded`.
- Load plugin scripts into an explicit shared scope.
- Target maximum Zotero version 10.0.*.

Installation and activation verified in an isolated Zotero 10.0.8 Linux profile. Windows UI testing remains outstanding.

## 1.0.0

Initial build with configurable research metadata and branded icons. This build was rejected at installation due to the missing update URL.
