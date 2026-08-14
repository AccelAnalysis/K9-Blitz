# Game Content & Administration

## Status

**Complete for K9 Blitz Digital Edition 1.0.**

Workstream 6 owns Content Management and Administrative/Game Configuration. The repository now contains a fully populated, versioned base-game catalog plus a usable static-host Content Studio.

The governing boundary remains:

> Content describes the game. The authoritative game/core layers execute the game.

The game owner explicitly authorized fabrication of unavailable details on August 13, 2026. Those decisions are authoritative for the versioned Digital Edition; they are not represented as verbatim transcription of unseen physical materials.

## Published authority

- Rules ID: `k9-blitz-digital-1.0`
- Content ID: `launch-1.0`
- Domain catalog: `packages/game-content-admin/src/baseGame.ts`
- Browser publication snapshot: `apps/web/game-data.js`
- Human-readable rules authority: `docs/DIGITAL_RULES_V1.md`

The base catalog includes four dogs, a 12-card Trainer deck, Paw Token content, all 72 runtime board-space content records, four challenges, reusable rewards and penalties, the eight-step K9 Competition Track, rules/help, game settings, media metadata, a completed asset inventory, an exact content-pack snapshot, and a ruleset snapshot.

## Integration with core-game

Administrative records wrap the authoritative component definitions already owned by `packages/core-game`:

- Dog content wraps `DogDefinition`.
- Trainer Card content wraps `TrainerCardDefinition`.
- Token content wraps `TokenDefinition`.
- Board-space content wraps `BoardSpaceMechanicsDefinition`.
- Competition content wraps `CompetitionTrackDefinition`.

The administrative wrapper adds provenance, verification status, immutable revision history, publishing lifecycle, content-pack membership, and audit evidence without taking over runtime game state.

## Rule-capability boundary

Content never embeds executable scripts. Behavior is selected using stable capability IDs. Digital Edition 1.0 publishes concrete registries for supported Trainer Card effects, board-space resolvers, challenges, rewards, and penalties. Publication validation fails if content references an unsupported capability or nonexistent runtime board space.

## Lifecycle and immutable revisions

General administration retains the draft → published → retired lifecycle:

1. New editable content starts as a draft.
2. Each draft update appends the next revision.
3. Publishing appends an immutable published revision.
4. Published content is revised by explicitly starting a new draft revision.
5. Retirement preserves historical published revisions.

The owner-authorized base game is checked in as an immutable release seed at revision 1. `base-game-pack` pins every entity by exact `{ id, revision }`; `digital-edition-rules` pins the exact content-pack revision.

## Publication validation

CI validates:

- required IDs, slugs, and titles;
- `qa-verified` publication status for the base game;
- exact runtime/content identity;
- published content dependencies;
- all 72 board-space IDs;
- registered rule-capability IDs;
- competition-stage topology;
- exact content-pack and ruleset revisions;
- media-rights metadata;
- asset-inventory consistency;
- global catalog ID uniqueness;
- exact parity between the domain catalog and GitHub Pages runtime catalog.

## Administration roles

The domain authorization model remains:

- `player`: read-only published content consumption;
- `content_editor`: create and revise drafts and maintain inventory;
- `content_publisher`: publish/retire content and inspect audit history;
- `game_admin`: manage configuration and inspect audit history;
- `system_admin`: all administrative permissions.

## Content Studio

`apps/web/admin.html` implements the browser administration surface and is included in the GitHub Pages artifact. It provides:

- dashboard counts and active version status;
- category navigation for Trainer Cards, Dogs, Board Spaces, Pawns, Competition Track, Rules & Help, and Game Settings;
- search and JSON record editing;
- whole-catalog validation before draft save or publication;
- browser-persistent drafts;
- local publication with automatic content-version bumping;
- item revert and full baseline reset;
- JSON import/export;
- local append-style audit history.

GitHub Pages is static hosting, so the Content Studio deliberately stores no repository token and cannot silently write global production content. A local publish becomes active for the same browser after the game reloads. Exported JSON is the portable promotion artifact for a repository-wide release.

## Saved-game compatibility

The launch game records `rulesVersion` and `contentVersion` in every save. A saved match is resumed only when both match the active publication. This prevents an administrative content change from altering an in-progress game silently.

## Expansion path

New dogs, cards, spaces, challenges, settings, or expansion packs can be introduced as new versioned entities and content packs without rewriting the core administration lifecycle. New executable behavior still requires a registered rule capability, preserving the separation between content and engine code.
