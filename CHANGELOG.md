# Changelog

## 0.1.3

Include DeskThing’s generic `mac` platform identifier alongside `macarm`, avoiding a false incompatibility warning on supported Apple Silicon Macs.

## 0.1.2

- Add DeskThing store discovery via a separate `latest.json` release asset, embedded icon, size, and SHA-512 checksum.
- Use an app-ID runtime filename to keep automatic updates from selecting source archives.
- Package a declared, dependency-free post-install client integration with local backups and all-bundle validation.
- Upload JSON metadata automatically in the release workflow.

## 0.1.1

Use ControlThing consistently in the app label, shade, settings, documentation, and release metadata.

## 0.1.0

First standalone public release under the ControlThing name. Setup guide, source, license, local-data notes, and reproducible build instructions included.
