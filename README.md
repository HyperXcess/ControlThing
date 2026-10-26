# ControlThing

[Download releases](https://github.com/HyperXcess/ControlThing/releases) · [Report a problem](https://github.com/HyperXcess/ControlThing/issues)

**A swipe-down dashboard for your Car Thing.**

Pull down from the top edge to reveal a sliding shade with five pages:

- **PC Health** — a full-width dashboard with large CPU, memory-in-use, and battery meters. The current backend reads a Mac; the name does not imply Windows support.
- **Your Day** — the next three upcoming or ongoing timed events from CalendarThing, with an Open CalendarThing button.
- **Focus** — a full-width countdown, large Start/Pause and Reset buttons, preset or custom 1–120 minute sessions, and completed-block count. The countdown ticks every second locally, independently of slower stats updates.
- **Brightness** — a full-width screen control with a large percentage, slider, and low/high buttons.
- **Audio** — a separate full-width Mac volume control and output-device selector. Fixed-volume outputs show an unavailable slider.

Tap the bottom icon-and-label buttons to open a section. Swipe the button strip to browse it without changing the active section. Swipe sideways on the dashboard to change pages, or up to close. Click the dial on Brightness or Audio to engage the slider, turn to adjust, and click again to finish. The dial selects tiles when the shade is open. Your underlying app remains available when you close it.

ControlThing has **two parts**: a normal DeskThing backend app and a client extension for the overlay. Both are required. It is not a firmware replacement. CalendarThing and LaunchThing are optional; the calendar tile has no next event until CalendarThing provides a local snapshot.

## Install from the DeskThing store

1. Open **Downloads → Add Client/App** in the left sidebar.
2. Add this repository’s GitHub URL as an **App** repository.
3. Refresh/pull the repository, select the app, download it, and initialize it.
4. The declared post-install step backs up and stages the client integration. It does not change account credentials, calendar settings, or firmware. It supports the DeskThing 0.11.2 modern/legacy client bundles and stops before writing if either layout is unsupported.
5. Open **Clients → Push staged client**, then **Restart Chromium on the Device** to activate the client UI changes.

The release includes a separate **`latest.json`** with DeskThing metadata, a version-pinned runtime download URL, embedded icon, size, and SHA-512 checksum. The ZIP named with the lowercase internal app ID is the installable runtime. The capitalized `ControlThing-source-…zip` archive is for development, not installation.

## Install the backend (Apple Silicon Mac)

1. Download `controlthing-v0.2.0.zip` from **Releases**.
2. In DeskThing, choose **Downloads → Apps → Upload App**. Initialize ControlThing.
3. In **Apps → ControlThing → Settings**, configure USB reconnect recovery if needed. The old Shortcut tile has been removed; its saved setting is retained only for compatibility.
4. Leave USB serial blank if exactly one Car Thing is connected. If several ADB devices are attached, specify the intended Car Thing serial.
5. The post-install step stages the shade. Push the staged client to the device, restart its browser, then swipe from the top edge. The manual installer below is an alternative.

The backend uses macOS `pmset`, `memory_pressure`, a bundled CoreAudio helper, and DeskThing’s bundled ADB executable. Brightness requires a USB-connected Car Thing. CoreAudio support in the published binary is **Apple Silicon, macOS 13+**. Windows, Linux, and Intel Mac behavior has not been validated. Missing optional hardware/services show unavailable state rather than fabricated values.

## Manual brightness

A brightness change stops the firmware ambient-light backlight service and saves the selected raw level in `/var/lib/controlthing/brightness` before applying it. This prevents the ambient sensor from replacing the manual value during the current boot. Persistent manual mode across reboots additionally requires disabling the firmware backlight service’s autostart and configuring a one-shot restore from that saved file; the app package does not silently rewrite the device’s supervisor configuration.

## Compatibility

Tested on DeskThing Server **0.11.17**, client **0.11.2**, and a Spotify Car Thing running Thing Labs firmware. The client extension targets the exact 0.11.2 bundle layout; the installer refuses unknown layouts. DeskThing/client updates can replace the extension, so reapply it after a compatible update. No firmware flashing is included.

## Manual client extension installation (Mac, optional alternative)

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

Focus state stays in local `data/controlthing-focus.json`. CalendarThing optionally writes local `data/calthing-events.json`, which this backend reads only while requesting a snapshot; it ignores snapshots older than 15 minutes. No Google feed links or OAuth tokens are read by this app. Data goes to your connected DeskThing client, not to HyperXcess. A configured Shortcut can do whatever that Shortcut is configured to do; only the exact saved name is run, using argument arrays rather than shell interpolation.

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

## USB reconnect recovery

On macOS, ControlThing checks its recognized USB-connected Car Thing every 15 seconds while DeskThing is running. If the device's local DeskThing server listener disappears after a reconnect or reboot, it restores the existing ADB reverse link on port 8891. It also restores the previously configured Spotify relay link on port 8892 when needed and corrects a reset device clock. Healthy connections are left unchanged. It does not restart Chromium, reboot the device, kill ADB, or invoke `adb reverse --list` (unsafe with this device's old adbd).

Recovery is enabled by default under **Automatically restore USB connection** in ControlThing settings. Disable that setting to stop checks. Multiple recognized Car Things require an explicit **Car Thing USB serial**. Unrelated Android devices are ignored. This recovers missing USB tunnels; it cannot prevent a physical power interruption or diagnose every browser crash.

## Automatic clock overlay

The client integration disables the stock disconnected/idle screensaver overlay. A connection drop leaves the app visible with its connection warning; the automatic clock cannot take over. Manually opening a clock app remains possible.

## MusicThing entry

With [MusicThing](https://github.com/HyperXcess/MusicThing) installed, the bottom waveform tab opens it by tap or upward pull. The pull has a finger-follow preview; a short pull cancels. The entry disappears inside MusicThing, whose Back button returns to the previous app. The top edge remains reserved for ControlThing. MusicThing is a separate app, not included in this package.
