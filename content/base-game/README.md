# Base Game Content

This directory publishes the **owner-authorized K9 Blitz Digital Rules v1.0 base content**.

The repository distinguishes two kinds of authority:

- **source-backed physical evidence** — facts directly supported by the board photograph, supplied descriptions, or future physical source material;
- **owner-authored digital product rules/content** — explicit design decisions created to fill unavailable legacy details and versioned as digital authority.

Owner-authored content is valid for the digital product but must not be mislabeled `source-verified` unless a corresponding physical source is later inspected.

## Published launch authority

- Rules: `k9-blitz-digital-1.0`
- Content: `launch-1.0`
- Rules document: `docs/DIGITAL_RULES_V1.md`
- Runtime component catalog: `packages/core-game/src/baseGame.ts`
- Machine-readable catalog summary: `content/base-game/catalog.json`

The catalog covers the launch dog profiles, 12 Trainer Cards, Paw Token component inventory, all 72 board-space mechanics entries, and the eight-stage K9 Competition Track.

Future edits must preserve version/provenance discipline. Material rule changes require a new or updated authority record and corresponding rules/content version; physical-source corrections should be recorded separately from digital design changes.
