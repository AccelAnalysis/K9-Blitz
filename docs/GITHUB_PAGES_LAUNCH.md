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
- Barkley Ville board interactions;
- Trainer Cards;
- Paw Token collection/spending;
- K9 Competition Track progress;
- dog profiles;
- current-player dashboard and legal turn gating;
- game history;
- save/resume in browser storage;
- responsive board zoom/focus;
- sound controls, fullscreen, reduced-motion support, and win celebration.

## Rules authority

The playable Pages edition uses **K9 Blitz Digital Rules v1.0**, documented in `docs/DIGITAL_RULES_V1.md`.

The physical references establish K9 Blitz's visual identity and many visible game concepts. Where legacy source material did not establish exact behavior, the owner has authorized the missing behavior to be designed for the digital product. Those decisions are now explicit, versioned product rules rather than temporary demo assumptions.

Key launch rules include:

- 2–4 trainers play in setup order;
- roll two dice and move the summed total;
- no exact roll is required to reach Finish;
- landing spaces resolve exactly once;
- Paw Tokens are the reward/spend resource;
- the K9 Competition Track caps at 8;
- Trainer Cards resolve immediately;
- card-driven movement does not trigger a second landing-space resolution;
- the first trainer to reach Finish wins immediately.

The launch implementation records `rulesVersion = k9-blitz-digital-1.0` and `contentVersion = launch-1.0`. Saved games from incompatible earlier versions are intentionally not resumed under changed semantics.

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

## Board-art handoff

Board artwork remains replaceable independently of game rules. Replace the currently published Board/Map asset when an approved production artwork revision is selected, while preserving `assets/board.svg` or updating its single publication/reference contract. Rule effects must continue to come from versioned game data rather than being inferred from artwork.
