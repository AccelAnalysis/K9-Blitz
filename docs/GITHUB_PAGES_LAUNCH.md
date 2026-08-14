# K9 Blitz — GitHub Pages Launch

## Deployment

The browser release lives in `apps/web` and is intentionally dependency-free. Every push to `main` runs `.github/workflows/pages.yml`, verifies JavaScript syntax, executes the launch engine tests, assembles a self-contained Pages artifact, and deploys it with GitHub's official Pages actions.

Expected project URL:

`https://accelanalysis.github.io/K9-Blitz/`

The workflow copies `packages/board-map/assets/board-reference.svg` to the published `assets/board.svg`, keeping board artwork replaceable without changing gameplay/UI code.

## One-time repository activation

The first deployment attempt proved the artifact assembles and verifies correctly, but GitHub returned `Get Pages site failed: Not Found` because Pages has never been initialized for this repository. This is a repository-level setting, not an application defect.

A repository administrator must perform this one-time activation:

1. Open **Settings → Pages** in `AccelAnalysis/K9-Blitz`.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Open **Actions → Deploy GitHub Pages** and run the workflow again (or make any subsequent push to `main`).

No code or secret changes are required after that setting is enabled.

## Launch functionality

The GitHub Pages release supports:

- 2–4 local pass-and-play trainers;
- optional computer-controlled seats;
- two-die rolling and animated pawn movement;
- the owner-authorized 72-space Barkley Ville logical route;
- Trainer Cards with random no-repeat draws and discard recycling;
- Paw Token collection/spending;
- K9 Competition Track progress;
- dog profiles;
- current-player dashboard and legal turn gating;
- game history;
- save/resume in browser storage;
- responsive board zoom/focus;
- sound controls, fullscreen, reduced-motion support, and win celebration.

## Rules authority

The playable release uses **K9 Blitz Digital Rules v1.0**:

- ruleset ID: `k9-blitz-digital`;
- rules version: `1.0.0`;
- content version: `digital-base-1.0.0`.

The project references establish the physical game's theme and visible components, while the game owner has explicitly authorized original design completion wherever exact physical rule behavior is unavailable. The resulting digital decisions are therefore production-authoritative for the digital edition rather than temporary demo assumptions.

The canonical rules are documented in `docs/K9_BLITZ_DIGITAL_RULES_V1.md` and executed by `packages/game-engine/src/digitalRulesV1.ts` through the shared authoritative rules engine. Source-observed physical facts and owner-authorized digital design choices remain distinguishable in project provenance.

A missing physical rulebook is **not a blocker** to playing or shipping Digital Rules v1.0. If a later physical-rule transcription is supplied and the owner wants different behavior, it must ship as a new version rather than silently changing existing saved games.

## Online multiplayer

GitHub Pages is static hosting. The release therefore treats local/pass-and-play as the supported launch mode. The repository contains online room/session contracts, but live remote multiplayer requires a server-authoritative host and transport and is intentionally disabled in the Pages UI rather than faked in browser state.

## Local preview

Serve the static directory over HTTP (ES modules do not work reliably from a raw `file://` URL):

```bash
python3 -m http.server 8080 --directory apps/web
```

For the board image locally, copy the reference asset first:

```bash
mkdir -p apps/web/assets
cp packages/board-map/assets/board-reference.svg apps/web/assets/board.svg
```

Then open `http://localhost:8080`.

## Verification

```bash
node --check apps/web/app.js
node --check apps/web/game-data.js
node --check apps/web/game-engine.js
node --test apps/web/test/*.test.mjs
npm run qa
```

## Production-art handoff

Replace `packages/board-map/assets/board-reference.svg` with approved production artwork (or change the Pages assembly step to copy the approved asset). Keep the same `assets/board.svg` publication contract or update the single reference in `apps/web/index.html`.
