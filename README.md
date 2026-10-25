# ControlThing

[Download releases](https://github.com/HyperXcess/ControlThing/releases) · [Report a problem](https://github.com/HyperXcess/ControlThing/issues)

**A swipe-down dashboard for your Car Thing.** By HyperXcess.

Pull down from the top edge to reveal a sliding shade with two pages:

- **Mac Health** — CPU, available memory, battery, and power status.
- **Your Day** — the next event from an optional CalThing installation.
- **Focus** — persistent focus timer, pause/reset, duration presets, and completed-block count. The countdown ticks every second locally, independently of slower stats updates.
- **Quick Controls** — Car Thing brightness, Mac audio output selection, and an optional named macOS Shortcut.

Swipe sideways between pages and up to close. The dial selects tiles when the shade is open. Your underlying app remains available when you close it.

ControlThing has **two parts**: a normal DeskThing backend app and a client extension for the overlay. Both are required. It is not a firmware replacement. CalThing and LaunchThing are optional; the calendar tile has no next event until CalThing provides a local snapshot.

## Install the backend (Apple Silicon Mac)

1. Download `ControlThing-v0.1.1.zip` from **Releases**.
2. In DeskThing, choose **Downloads → Apps → Upload App**. Initialize ControlThing.
3. In **Apps → ControlThing → Settings**, optionally enter the exact name of a macOS Shortcut. No Shortcut runs on startup; it runs only when you tap **Focus Shortcut**.
4. Leave USB serial blank if exactly one Car Thing is connected. If several ADB devices are attached, specify the intended Car Thing serial.
5. Install the client extension below, then swipe from the top edge.

The backend uses macOS `pmset`, `memory_pressure`, a bundled CoreAudio helper, and DeskThing’s bundled ADB executable. Brightness requires a USB-connected Car Thing. CoreAudio support in the published binary is **Apple Silicon, macOS 13+**. Windows, Linux, and Intel Mac behavior has not been validated. Missing optional hardware/services show unavailable state rather than fabricated values.

## Compatibility

Tested on DeskThing Server **0.11.17**, client **0.11.2**, and a Spotify Car Thing running Thing Labs firmware. The client extension targets the exact 0.11.2 bundle layout; the installer refuses unknown layouts. DeskThing/client updates can replace the extension, so reapply it after a compatible update. No firmware flashing is included.

## Client extension installation (Mac)

Install Node.js 20 or newer. Quit DeskThing while changing its staged client. In this repository, run:

```sh
npm ci
node tools/install-client.mjs --assets "$HOME/Library/Application Support/deskthing/webapp/assets"
```

The installer changes both modern and legacy JavaScript bundles and saves a local backup before writing. It does not modify your calendar feeds or account credentials. Restart DeskThing, open **Clients**, and use **Push staged client**, then **Restart Chromium on the Device**. Keep the Car Thing connected over USB.

If the staged push does not copy the files, the equivalent manual copy is:

```sh
ADB="/Applications/DeskThing.app/Contents/Resources/mac/adb"
"$ADB" devices
# Replace SERIAL below with your Car Thing serial from that list.
"$ADB" -s SERIAL shell 'mount -o remount,rw /'
"$ADB" -s SERIAL push "$HOME/Library/Application Support/deskthing/webapp/assets/index-BoMDv8nD.js" /usr/share/qt-superbird-app/webapp/assets/
"$ADB" -s SERIAL push "$HOME/Library/Application Support/deskthing/webapp/assets/index-legacy-DSl9FxfH.js" /usr/share/qt-superbird-app/webapp/assets/
"$ADB" -s SERIAL shell 'sync; mount -o remount,ro /'
"$ADB" -s SERIAL reverse tcp:8891 tcp:8891
"$ADB" -s SERIAL shell 'supervisorctl restart chromium'
```

### Revert the client extension

Each modified bundle has a project-named `.backup` alongside it. With DeskThing closed, copy the backup over its original bundle and push/restart the device again. A full-bundle restore also removes extensions installed after that backup; reapply the other extensions afterward. Alternatively stage an original 0.11.2 client through DeskThing and push it to restore all client UI behavior. Backend apps and calendar settings are separate from these client bundles.

## Optional full-screen swipe mappings

The top-edge gesture works without a profile change. To map DeskThing’s full SwipeDown and SwipeUp actions to this shade, quit DeskThing, then run:

```sh
node tools/map-swipes.mjs "$HOME/Library/Application Support/deskthing/mappings/YOUR-EDITABLE-PROFILE.json"
```

Choose your actual editable profile; the script rejects the default profile and backs up the selected JSON. It changes only SwipeDown to `mission-show` and SwipeUp to `mission-hide`. Restart DeskThing with that profile active. Restore the `.controlthing.backup` to undo the mapping change.

## Data and privacy

Focus state stays in local `data/controlthing-focus.json`. CalThing optionally writes local `data/calthing-events.json`, which this backend reads only while requesting a snapshot; it ignores snapshots older than 15 minutes. No Google feed links or OAuth tokens are read by this app. Data goes to your connected DeskThing client, not to HyperXcess. A configured Shortcut can do whatever that Shortcut is configured to do; only the exact saved name is run, using argument arrays rather than shell interpolation.

## Build and test

```sh
npm ci
npm test
npm run build
npm run package
```

Building the macOS helper requires Apple’s Command Line Tools and Swift. On other systems the server can be bundled, but no audio helper is produced; do not advertise those artifacts as tested full releases.

## License and credit

MIT. Uses DeskThing SDKs and integrates with DeskThing Client. See `THIRD_PARTY_NOTICES.md`.
