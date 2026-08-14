# @k9-blitz/game-content-admin

Domain package for K9 Blitz workstream 6: versioned content management, ruleset/content-pack snapshots, administration authorization, publication validation, asset inventory, and audit provenance.

The catalog wraps the authoritative component definitions from `@k9-blitz/core-game` instead of creating competing card/dog/token/space/competition schemas.

It intentionally does not choose a database, web framework, admin UI framework, or multiplayer transport. See `../../docs/GAME_CONTENT_ADMINISTRATION.md` for boundaries and integration guidance.

## Test

The repository authority is Node 24+. From this package:

```bash
npm test
```
