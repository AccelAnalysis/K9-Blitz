# Game Content & Administration

## Status

**Complete for K9 Blitz Digital Rules v1.0 / `launch-1.0`.**

Workstream 6 owns the lifecycle around game content: catalog administration, validation, publishing/version snapshots, configuration, provenance, asset inventory, and the browser Content Studio. It does not replace the rules engine or create a second mechanics catalog.

The owner explicitly authorized unavailable legacy details to be created for the digital product. Those decisions are versioned product authority and are not represented as verbatim transcription of unseen physical materials.

## Canonical authority chain

The completed system uses one direction of authority:

1. `docs/DIGITAL_RULES_V1.md` — human-readable rules authority.
2. `packages/core-game/src/baseGame.ts` — canonical runtime component definitions.
3. `content/base-game/catalog.json` — machine-readable release summary/provenance.
4. `packages/game-content-admin/src/baseGame.ts` — administrative wrappers, release snapshot, capability registry, help/settings, media metadata, and asset inventory.
5. `apps/web/game-data.js` — GitHub Pages/browser publication projection, with strict compatibility validation.

Category 6 imports the Core Game definitions directly for Dogs, Trainer Cards, Paw Token, all 72 board-space mechanics records, and the eight-stage K9 Competition Track. It therefore cannot silently drift into a competing meaning of those game objects.

## Published content

The v1.0 administrative release contains:

- 4 launch dog profiles;
- 1 Trainer deck with 12 versioned cards;
- Paw Token definition;
- all 72 board-space mechanics records;
- reusable challenge, reward, penalty, and achievement records mapped to supported v1 resolvers;
- the 8-stage K9 Competition Track;
- rules/help records;
- versioned game-setting groups;
- competition icon media metadata;
- physical/digital asset inventory records;
- one immutable content-pack snapshot pinned by exact `{ id, revision }` references;
- one immutable ruleset snapshot pinned to the exact content-pack revision.

Rules ID: `k9-blitz-digital-1.0`  
Content ID: `launch-1.0`

## Publication lifecycle

The general administration service retains the existing lifecycle:

`draft → published → retired`

Published records are immutable revisions. A change begins a new draft revision rather than mutating history. Content packs pin exact entity revisions, and rulesets pin exact content-pack revisions, so saved games can retain the content/rules snapshot that created them.

The checked-in Digital Rules v1 base catalog is release seed revision 1 and is marked `qa-verified` as **digital product content**. That status does not imply that owner-authored behavior was recovered from a physical rulebook; provenance remains explicit in the canonical catalog and repository guardrails.

## Rule capability boundary

Administrative content cannot embed arbitrary JavaScript or callbacks. It references stable resolver/effect IDs already represented by the Digital Rules v1 component catalog, including:

- `GAIN_PAW_TOKENS`;
- `ADVANCE_COMPETITION`;
- `MOVE`;
- `NO_EFFECT`;
- `GRANT_EXTRA_TURN`;
- `DRAW_TRAINER_CARD`;
- `SPEND_PAW_TOKENS`;
- `FINISH_GAME`.

Publication validation rejects unknown capabilities, nonexistent board-space IDs, missing dependencies, inconsistent runtime/content IDs, broken competition topology, missing media references, invalid exact revisions, or unconfirmed required rights metadata.

## Content Studio

`apps/web/admin.html` is the GitHub Pages-safe administrative surface. It is intentionally separate from the player game UI and provides:

- active rules/content version status;
- dashboards for Dogs, Trainer Cards, Board Spaces, Pawns, Competition Track, Rules & Help, and Game Settings;
- search and JSON-level record editing;
- browser-persistent drafts;
- validation before save or publish;
- local publication and baseline reset;
- JSON import/export;
- browser-local audit history.

### Static-host security boundary

GitHub Pages cannot safely hold a repository token or server-side administrator session. Therefore **Publish Locally** affects only the current browser. The running game reads that validated local publication on reload and saves the resulting rules/content version with the match.

Repository-wide promotion is explicit: export the validated browser publication, reconcile it into the canonical Core Game/catalog sources, update the applicable rules/content version when semantics change, run `npm run qa`, and merge through GitHub. The Content Studio never places repository credentials in client code.

## QA and release gates

The canonical repository test discovery automatically includes Category 6 tests. The base-game suite verifies that:

- administrative wrappers are exact projections of the current Core Game definitions;
- every published entity passes the real publication validator under strict QA/rights policy;
- catalog IDs remain globally unique;
- all 72 board-space records exist;
- ruleset/content-pack references are exact.

The Pages content test independently compares browser dogs, Trainer Cards, special-space labels, versions, and Competition size against `content/base-game/catalog.json`, then proves unsupported rule semantics/effects are rejected.

`tools/qa/build-pages.mjs` packages and validates both the player game and the Content Studio before Pages deployment.

## Asset inventory

The asset inventory is complete as an **administrative inventory**: every required component family has a tracked record, rights status, content status, and QA status. Visual production fidelity remains the Board/Map & Physical Pieces lane's responsibility; Category 6 does not falsely mark a provisional board illustration as a source-verified physical transcription.

## Expansion path

New dogs, Trainer Cards, challenges, artwork, or expansion packs can be added as versioned content without rewriting the administration lifecycle. New executable behavior must first exist as an approved engine/rules capability and must be accompanied by the applicable authority/version update.
