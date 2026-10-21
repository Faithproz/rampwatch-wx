# RampWatch Wx — Live Weather PWA for Ramp Ops

A standalone progressive web app for ramp personnel alerts: real-time heat index, lightning, and wind cautions pulled from free public APIs.

## Files

- `index.html` — main app (includes all styles, logic, and calls to Open-Meteo and NOAA)
- `manifest.webmanifest` — PWA metadata (name, icons, shortcuts)
- `sw.js` — service worker (offline caching, push notifications)
- `icon.svg` — PWA app icon
- `README.md` — this file

## Setup: Host on your own server

### Quick: GitHub Pages (free)

1. Create a new repo `rampwatch-wx` on GitHub (or fork this one).
2. Add the four files above to the repo root (or in a `/docs` folder).
3. Go to **Settings > Pages > Source** and select `main` branch (or `/docs` folder).
4. GitHub builds and deploys within ~2 min. Your app lives at `https://<username>.github.io/rampwatch-wx/`.

### Alternative: Netlify (also free)

1. Create a Netlify account (connected to GitHub) and select "New site from Git."
2. Point to your repo.
3. Build settings: leave blank (no build command needed).
4. Deploy. Netlify builds within seconds; your app gets a unique URL like `https://<name>.netlify.app/`.

### Self-hosted (your own server)

1. Place all four files in the web root (e.g., `/var/www/html/rampwatch/`).
2. Configure your web server (nginx, Apache) to serve over HTTPS (required for geolocation and notifications).
3. Visit `https://your-domain.com/rampwatch/`.

## First Use

1. **Open the app** on a phone, tablet, or desktop browser.
2. **Add to home screen** (iOS: Share > Add to Home Screen; Android: menu ⋮ > Install app).
3. **Pick an airport** from the dropdown (DFW, IAH, ATL, LAX, etc.) or tap "Use my location" for GPS.
4. **Enable notifications** so leads get alerts on status changes.
5. **Tap "Keep screen on"** to prevent the device from sleeping during a shift.
6. **Add crews** (gate teams, bag handlers, etc.) and tap Start when they go out.

## Features

### Live Weather Feed

- **Open-Meteo API**: free, no key, CORS-enabled; pulls current and 3-hour forecast every 5 minutes.
- **METAR**: NOAA Aviation Weather Center (if available for your airport) shows actual obs.
- Displays temperature, humidity, wind gust, weather code (for thunderstorms), and CAPE (storm energy).

### Lightning

- **Strike logging**: log strikes from your lightning detection system or tower at distance (mi).
- **30/30 logic**: each strike within the closure radius (default 5 mi) resets the all-clear countdown.
- **Alert radius**: 10 mi (default) warns personnel; 5 mi closes the ramp.
- **All-clear hold**: 15 min (default) from the last strike, then ramp can reopen.
- **Thunderstorm auto-alert**: if Open-Meteo detects a thunderstorm or METAR shows TS, raises alert.

### Heat Index & Crew Rotation

- **Rothfusz regression**: calculates heat index from temp + humidity (accounts for wind chill).
- **Work/rest cycles**: based on NWS heat index bands (Caution, Extreme Caution, Danger, Extreme Danger).
  - Normal (≤80°F): no cycle.
  - Caution (80–91°F): 50 min work / 10 min rest.
  - Extreme Caution (91–103°F): 45 min work / 15 min rest.
  - Danger (103–125°F): 30 min work / 30 min rest, cooled rest areas required.
  - Extreme Danger (>125°F): 15 min work / 45 min rest, essential tasks only.
- **Auto-flip**: when work time expires, crew is auto-moved to rest; when rest expires, back to work.
- **Chime alerts**: audio notification for rotations and alerts (can be toggled off).

### Wind Cautions

- **Caution**: gusts ≥25 kt (default); secure loose items.
- **Stop**: gusts ≥40 kt (default); stop belt loaders, secure cargo doors.
- Thresholds are placeholders; set per your airline's ops manual.

### Notifications

- **Browser Notification API**: on status changes (Open → Caution → Closed), leads get a push alert.
- **Works while app is open**: the app runs on a lead's phone or ops tablet on a stand.
- **Optional offline mode**: service worker caches API responses (up to 5 min old) if the network drops.

### Local Storage

All state persists in the browser (`localStorage`):
- Crew list and rotation timers.
- Strike log.
- Event log (up to 80 entries).
- Settings (airport, limits, sound on/off, manual entry toggle).

**No data leaves your device** unless you share the log or screenshots.

## Settings

Tap **Station limits** to adjust per your SOP:

- **Lightning alert radius** (default 10 mi): distance at which tower notifies you.
- **Ramp closure radius** (default 5 mi): distance that triggers all-clear countdown.
- **All-clear hold** (default 15 min): time from last strike before ramp can reopen.
- **Wind caution** (default 25 kt) and **stop** (default 40 kt): GSE and door handling.
- **Storm risk CAPE** (default 1500 J/kg): threshold for "storm risk" in the 2-hour outlook.
- **Manual entry**: toggle to override live feed with your own temp/humidity/gust values.

## Offline & Service Worker

The service worker (`sw.js`) handles offline scenarios:

- **Static assets** (HTML, CSS, icons): cached on first visit.
- **Live data** (Open-Meteo, METAR): network-first, 5-min fallback cache.
- **If the network drops**: the app keeps working with the last reading.
- **When back online**: auto-refresh on next visit or after 5 minutes.

## Browser Support

- **Modern browsers**: Chrome, Edge, Safari 15+, Firefox 90+.
- **iOS**: Safari on iPhone 13+; add to home screen for PWA mode.
- **Android**: Chrome, Edge, Samsung Internet; "Install app" prompt appears automatically.
- **Desktop**: any modern browser; "install" option in the address bar.

## Data & Privacy

- **No login required**: the app runs 100% locally on your device.
- **No user tracking**: no analytics, no accounts.
- **No syncing**: data stays on the device. Shift logs, crew lists, and notes are **not** sent anywhere unless you manually export or screenshot them.
- **Weather data**: Open-Meteo provides current and forecast conditions under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). METAR data from NOAA is public.

## Customization

Edit `index.html` in any text editor:

- **Airline/station name**: line ~60, `<p class="sub" id="stationLbl">` → change or remove.
- **Airport list**: lines ~245–249, `AIRPORTS` array → add/remove airports by ICAO code, name, lat, lon.
- **Default limits**: lines ~274–277, `HEAT` array → adjust work/rest cycles per your own heat stress policy.
- **Theme**: lines ~40–50, CSS variables `--accent`, `--ok`, `--warn`, `--bad` → use your airline's brand colors.
- **Fonts**: lines ~8–9, Google Fonts URLs → switch to your preferred fonts or remove.

## Known Limits

1. **Lightning distance**: this is for manual logging (strike reported by your system). Free APIs don't provide real-time strike locations. Use your certified lightning detection network as the source of truth.
2. **METAR availability**: not all airports have METAR or it may be delayed. The live forecast from Open-Meteo always works.
3. **Geolocation**: GPS works best outdoors; indoors or on a flight deck, signal may be weak. Fall back to airport selection.
4. **Notification permissions**: iOS PWAs show notifications only while the app is open. Android allows background notifications if the device is awake.

## Legal & Liability

**This is a pilot tool, not an approved safety system.**

- Ramp tower, your lightning detection network, and certified anemometers remain the **authority**.
- Use RampWatch to **augment** tower procedures, not replace them.
- Always follow your airline's ground ops manual, SOPs, and airport procedures.
- Each crew member must check with tower before operations.

## Support & Feedback

- Found a bug? Open an issue on the repo.
- Want a feature? Create a discussion (crew messaging, shift sync, photo logs, etc.).
- Hosting issues? Check your web server's HTTPS certificate and CORS headers.

---

**Built for ramp ops.** Stay safe out there. 🛫

