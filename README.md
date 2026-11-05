# CraftSound Audio Editor

<p align="center">
  <img src="public/favicon.svg" alt="CraftSound Logo" width="80" height="80" />
</p>

<p align="center">
  <strong>A modern, professional browser-based multitrack audio workstation and editor built with React 19, TypeScript, Web Audio API, and Tailwind CSS.</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#keyboard-shortcuts">Shortcuts</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#license">License</a>
</p>

---

## Overview

**CraftSound** is a fully client-side Digital Audio Workstation (DAW) and multitrack audio editor running directly in the browser. It combines non-destructive multitrack timeline editing, real-time Web Audio API signal processing, interactive waveform visualization, and client-side high-fidelity audio rendering (WAV & MP3) with offline-first IndexedDB persistence.

No server-side audio processing required. Everything happens directly on the client with zero latency and complete privacy.

---

## Features

### 🎚️ Multitrack Timeline & Editing
- **Multi-Track Mixing**: Add multiple audio tracks, each with independent volume sliders, stereo panning (-1 to +1), mute, and solo controls.
- **Non-Destructive Trimming**: Drag clip edges (left and right handles) to adjust start and end trim boundaries without modifying the original audio asset.
- **Clip Splitting**: Split audio clips precisely at the current playhead position (`S` key) with instantaneous buffer boundary slicing.
- **Freeform Drag & Drop**: Drag audio clips freely across time positions and reorder between tracks.
- **Interactive Time Ruler**: Millisecond-accurate ruler with zoom support (from 10 px/s to 200 px/s) and click-to-seek playhead positioning.

### 🌊 Waveform Visualization & Web Audio Engine
- **Peak Waveform Rendering**: Canvas-rendered bidirectional audio waveforms generated from normalized audio buffer peak data.
- **Web Audio Signal Chain**: Node routing utilizing `AudioBufferSourceNode`, `GainNode`, and `StereoPannerNode` connected to a unified `MasterGainNode`.
- **Integrated Synthesizer**: Built-in procedural demo audio generator (Ambient Pad, Bass Drum, Hi-Hat) utilizing Web Audio oscillators and envelopes for instant zero-download onboarding.

### 💾 Offline-First Storage & Undo/Redo
- **IndexedDB Persistence**: Powered by `Dexie.js` for persistent storage of audio assets, blob data, tracks, and clip states.
- **State Autosave**: Debounced background persistence preserving project state across browser reloads.
- **Undo / Redo Stack**: Comprehensive history snapshots supporting deep state rollbacks (`Ctrl+Z` / `Ctrl+Y`).

### 📦 High-Fidelity Audio Export
- **Offline Audio Rendering**: Mixes all active timeline tracks through an `OfflineAudioContext` at up to 48 kHz stereo.
- **WAV Encoder**: Pure client-side 16-bit PCM and 32-bit float RIFF binary encoder.
- **MP3 Encoder**: Direct in-browser MP3 encoding powered by `@breezystack/lamejs` with configurable bitrates (128 kbps, 192 kbps, 320 kbps).
- **Export Progress Modal**: Real-time progress tracking through decode, mix, and encoding phases.

---

## Architecture

```
CraftSound Architecture
├── Presentation Layer (React 19)
│   ├── TopToolbar              -> Project title, undo/redo, theme toggle, export trigger
│   ├── AudioLibraryPanel       -> Asset ingestion, drag-and-drop, synthesized demo tracks
│   ├── Timeline                -> Multi-track lane container, ruler, interactive playhead
│   │   ├── TimelineTrackLane   -> Track lane wrapper, collision & drop management
│   │   ├── AudioClip           -> Clip position, resize handles, waveform canvas
│   │   └── Waveform            -> High-performance HTML5 Canvas peak rendering
│   └── PlaybackControls        -> Transport controls, timecode display, zoom, master volume
│
├── Core Services (Pure TypeScript)
│   ├── AudioEngineService      -> Web Audio Context, active source node graph, clock
│   ├── AudioDecoderService     -> ArrayBuffer to AudioBuffer decoding and memory cache
│   ├── DemoAudioService        -> Algorithmic Web Audio synthesizer for test tracks
│   ├── MixTimelineService      -> OfflineAudioContext multi-track rendering pipeline
│   ├── WavEncoderService       -> RIFF binary formatting & sample packing
│   └── Mp3EncoderService       -> LameJS MP3 compression pipeline
│
└── Storage Layer (IndexedDB / Dexie)
    └── DexieDatabase           -> Projects, audio asset blobs, tracks, clips persistence
```

---

## Tech Stack

| Category | Technology |
|---|---|
| **Framework** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Bundler & Tooling** | [Vite 8](https://vite.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Icons & Motion** | [Lucide React](https://lucide.dev/) & [Motion](https://motion.dev/) |
| **Audio Processing** | Web Audio API (`AudioContext`, `OfflineAudioContext`) |
| **MP3 Encoding** | [@breezystack/lamejs](https://github.com/breezystack/lamejs) |
| **Database** | [Dexie.js](https://dexie.org/) (IndexedDB wrapper) |
| **Runtime** | [Bun](https://bun.sh/) / [Node.js](https://nodejs.org/) |

---

## Getting Started

### Prerequisites
- **Node.js** (v18+) or **Bun** (v1.0+)
- A modern browser with Web Audio API support (Chrome, Edge, Firefox, Safari)

### Installation

```bash
# Clone the repository
git clone https://github.com/arshadakl/audio-editor.git
cd audio-editor

# Install dependencies (using Bun)
bun install

# Or using npm
npm install
```

### Development Server

```bash
bun run dev
# or: npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
bun run build
# or: npm run build
```
The optimized production bundle will be generated in the `dist/` directory.

### Preview Build

```bash
bun run preview
# or: npm run preview
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| <kbd>Space</kbd> | Toggle Play / Pause |
| <kbd>Delete</kbd> / <kbd>Backspace</kbd> | Delete selected clip(s) |
| <kbd>S</kbd> | Split selected clip at playhead position |
| <kbd>Ctrl</kbd> + <kbd>Z</kbd> / <kbd>⌘</kbd> + <kbd>Z</kbd> | Undo last action |
| <kbd>Ctrl</kbd> + <kbd>Y</kbd> / <kbd>⌘</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> | Redo action |
| <kbd>Ctrl</kbd> + <kbd>A</kbd> / <kbd>⌘</kbd> + <kbd>A</kbd> | Select all clips on timeline |
| <kbd>Escape</kbd> | Deselect all clips |
| <kbd>Home</kbd> | Seek playhead to start (00:00.00) |
| <kbd>End</kbd> | Seek playhead to project end |
| <kbd>←</kbd> / <kbd>→</kbd> | Nudge playhead by 1 second |

---

## Deployment

The project is structured as a static Single Page Application (SPA) and is pre-configured for seamless deployment to **Cloudflare Pages**.

### Cloudflare Pages (Recommended)

#### Option 1: Git Integration (Continuous Deployment)
1. In the [Cloudflare Dashboard](https://dash.cloudflare.com/), navigate to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
2. Select your repository: `arshadakl/audio-editor`.
3. Configure the build settings:
   - **Framework preset**: `Vite`
   - **Build command**: `bun run build` (or `npm run build`)
   - **Build output directory**: `dist`
   - **Root directory**: `/`
4. Click **Save and Deploy**. Cloudflare Pages will automatically trigger a new deployment on every commit to `main`.

#### Option 2: Direct CLI Deployment via Wrangler
Deploy directly from your terminal using the built-in Wrangler CLI:
```bash
# Build the production bundle
bun run build

# Deploy to Cloudflare Pages
bun run pages:deploy
# or: npx wrangler pages deploy dist
```

#### SPA Routing & Asset Caching
- **`public/_redirects`**: Automatically routes all SPA navigation requests to `/index.html` (HTTP 200).
- **`public/_headers`**: Enforces strict security headers (`X-Frame-Options`, `X-Content-Type-Options`) and configures long-term immutable caching (`max-age=31536000`) for all `/assets/*` bundles.

---

## Conventional Commits

This repository enforces the [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) specification:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation updates
- `style`: Code style / UI formatting changes
- `refactor`: Code changes that neither fix a bug nor add a feature
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Changes affecting build system or external dependencies
- `ci`: Changes to CI configuration files and scripts
- `chore`: Maintenance tasks and housekeeping

---

## License

This project is licensed under the [MIT License](LICENSE).
