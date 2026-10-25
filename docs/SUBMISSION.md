# DeskThing submission notes

This is an independent HyperXcess community project, not an official release. The upstream website lists community projects from GitHub repositories with releases. The upstream app README points developers to the DeskThing Discord for help getting started; the app wiki describes the app format.

- Catalog source: https://github.com/ItsRiprod/Deskthing-Website/blob/main/services/fetchCommunityAppReleases.ts
- App docs: https://github.com/ItsRiprod/Deskthing-Apps/wiki
- Developer community: https://deskthing.app/discord
- Maintainer discussions: https://github.com/ItsRiprod/DeskThing/discussions

Ask maintainers to review compatibility and the appropriate listing/integration path. Client extensions should be identified as extensions, not submitted as ordinary Upload App ZIPs. A submission is a request for review; inclusion is decided by DeskThing maintainers.

The current release has a standard app `latest.json` and app-ID runtime ZIP. LaunchThing now includes a utility installer app, and all three packages declare the supported post-install client integration. The extension remains client-0.11.2-specific; pushing the staged client is a separate user step.
