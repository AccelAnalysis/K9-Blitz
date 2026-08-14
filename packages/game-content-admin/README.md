# @k9-blitz/game-content-admin

Domain package for K9 Blitz workstream 6: versioned content management, ruleset/content-pack snapshots, administration authorization, publication validation, asset inventory, audit provenance, and the published Digital Rules v1.0 base-game catalog.

The catalog wraps the authoritative component definitions from `@k9-blitz/core-game` instead of creating competing runtime card/dog/token/space/competition schemas. `src/baseGame.ts` is the typed release baseline for rules ID `k9-blitz-digital-1.0` / content ID `launch-1.0`; `apps/web/game-data.js` is its static Pages publication projection.

The GitHub Pages build also publishes `apps/web/admin.html`, a static-safe Content Studio. Browser publishing is local to that browser; repository-wide promotion is done by exporting the validated catalog and committing a new version. No repository credential is embedded in the client.

See `../../docs/GAME_CONTENT_ADMINISTRATION.md` for architecture, lifecycle, validation, permissions, and promotion guidance.

## Test

From the repository root:

```bash
npm run qa
```

Focused package tests:

```bash
node --test packages/game-content-admin/test/*.test.ts
```
