# FrameX — AI Video Editor

Vanilla HTML5 / CSS3 / ES6+ JavaScript. No frameworks, no build step.

## Run it

Because ES modules are loaded via `<script type="module">`, opening
`index.html` directly with `file://` will be blocked by browser CORS
rules for module imports. Serve it with any static server:

```bash
cd framex-web
python3 -m http.server 8080
# or: npx serve .
```

Then visit `http://localhost:8080`.

## Firebase setup (required before auth/Firestore will work)

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. **Authentication** → Sign-in method → enable **Google**, **Email/Password**,
   **GitHub**, and **Facebook**. GitHub and Facebook each need OAuth app
   credentials from their respective developer consoles, pasted into the
   Firebase provider config.
3. **Firestore Database** → create in production mode → paste the contents
   of `firestore.rules` into the Rules tab and publish.
4. **Project settings** → General → "Your apps" → add a Web app → copy the
   config object into `js/firebase-config.js` (replace the `YOUR_...`
   placeholders).

## Project structure

```
framex-web/
├── index.html          # Auth screen (login / signup / password reset)
├── home.html            # Dashboard: recent projects, quick actions, search
├── editor.html           # Editor: tool rail, preview player, multi-track timeline
├── export.html            # Export flow: resolution/fps/format/bitrate, progress
├── css/
│   ├── variables.css     # Design tokens (colors, radii, spacing, motion)
│   ├── base.css           # Reset + typography + layout utilities
│   ├── components.css      # Buttons, cards, inputs, modals, toasts
│   ├── auth.css / home.css / editor.css / export.css
├── js/
│   ├── firebase-config.js  # Firebase app init (fill in your config)
│   ├── auth.js               # Sign-in for all 4 providers + linking + reset
│   ├── auth-guard.js           # requireAuth() for protected pages
│   ├── firestore-service.js     # users/{uid} and projects/{id} CRUD
│   ├── timeline.js                # Timeline model + drag/trim/split/snap/zoom
│   ├── constants.js                # Routes, export presets, AI tool list
│   ├── utils.js                     # Toasts, formatters, validators
│   └── auth-page.js / home.js / editor.js / export.js   # Per-page controllers
└── firestore.rules
```

## Deploying (GitHub Pages)

This is a static site, so it deploys as-is — no build step.

1. Push to a GitHub repo, then in **Settings → Pages**, set source to
   "GitHub Actions" (the included `.github/workflows/deploy.yml` handles
   the rest on every push to `main`).
2. In Firebase Console → Authentication → Settings → **Authorized domains**,
   add your `*.github.io` URL (and any custom domain), or social sign-in
   popups will be rejected.

## What's fully functional today

- Firebase Auth: Google, GitHub, Facebook, Email/Password, account linking,
  password reset, email verification, persistent sessions, friendly errors.
- Firestore: user doc auto-created on first login, project CRUD, live
  dashboard updates via `onSnapshot`, autosave with debounce.
- Timeline: multi-track (video/audio/text), drag to move, trim handles,
  split, ripple delete, snap-to-clip, zoom.
- Export: real browser-side capture and encoding via `MediaRecorder`,
  downloadable output, export history written to Firestore.

## Known limitations — honest, not hidden

- **AI features** (captions, background/object removal, enhancement, etc.)
  need a real model to run somewhere. `editor.js`'s `runAiTool()` calls a
  placeholder `/api/ai-tools/:id` endpoint — point it at a Cloud Function
  or your AI provider of choice.
- **MP4/MOV/GIF export**: browsers only natively encode to WebM via
  `MediaRecorder`. `export.js`'s `transcodeToFormat()` is the integration
  point for `ffmpeg.wasm` (client-side) or a server transcode step to
  produce true `.mp4`/`.mov`/`.gif` files.
- **Cloud backup / cross-device sync / version history**: the Firestore
  schema (`versionHistory` field) is in place; wiring up automatic
  snapshotting is a straightforward next step once the editor UI is final.

Everything else — UI, state, Firebase reads/writes, timeline interactions,
real media capture — runs as-is with no stubs.
