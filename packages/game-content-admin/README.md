# @k9-blitz/game-content-admin

K9 Blitz workstream 6: versioned content administration, immutable release snapshots, publishing validation, permissions, audit provenance, help/settings/media records, and asset inventory.

`src/baseGame.ts` imports the current owner-authorized Digital Rules v1 component definitions directly from `@k9-blitz/core-game` and wraps them administratively. It does not maintain a competing Dog/Card/Token/Space/Competition rules catalog.

Published authority:

- rules: `k9-blitz-digital-1.0`;
- content: `launch-1.0`;
- runtime components: `../core-game/src/baseGame.ts`;
- machine-readable release summary: `../../content/base-game/catalog.json`;
- browser projection: `../../apps/web/game-data.js`;
- static Content Studio: `../../apps/web/admin.html`.

The Content Studio can draft, validate, import/export, audit, and publish browser-local content without embedding GitHub credentials. Repository-wide promotion remains an explicit versioned GitHub change.

Run the repository authority checks with:

```bash
npm run qa
```

See `../../docs/GAME_CONTENT_ADMINISTRATION.md` for the complete architecture and promotion contract.
