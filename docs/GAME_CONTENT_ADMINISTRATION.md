# Game Content & Administration

## Purpose

Workstream 6 owns **Content Management** and **Administrative/Game Configuration**. It provides the versioned source of truth that tells the rest of K9 Blitz which dogs, Trainer Cards, token definitions, board-space mechanics content, challenges, rewards/penalties, competition definitions, help, settings, media, content packs, and rulesets are available.

The governing boundary is:

> Content describes the game. The authoritative game/core layers execute the game.

This implementation follows `AGENTS.md`: it does not invent missing physical-game behavior; it preserves rule/content versions; and administrative content cannot carry arbitrary scripts or callbacks.

## Integration with merged core-game contracts

The catalog does **not** create competing definitions for the mechanics already owned by `packages/core-game`.

- `DogContentDefinition.runtime` is the current core `DogDefinition`.
- `TrainerCardContentDefinition.runtime` is the current core `TrainerCardDefinition`.
- `TokenContentDefinition.runtime` is the current core `TokenDefinition`.
- `BoardSpaceContentDefinition.runtime` is the current core `BoardSpaceMechanicsDefinition`.
- `CompetitionContentDefinition.runtime` is the current core `CompetitionTrackDefinition`.

The administrative wrapper adds provenance, verification status, immutable revision history, publishing lifecycle, tags, help/media references, content-pack membership, and audit evidence.

Core IDs and admin IDs are validated for identity where they represent the same object. This prevents an admin record from silently publishing a runtime definition under a different identity.

## Rule capability boundary

Content references behavior by stable IDs. The core/rules layer supplies a `RuleCapabilityRegistry` that confirms whether those IDs are actually implemented.

Capability kinds currently include:

- Trainer Card effects;
- dog special abilities;
- board-space resolvers;
- challenge resolvers;
- reward resolvers;
- penalty resolvers;
- competition requirements.

Publication fails when content references an unsupported capability. This is the administrative equivalent of "commands in, events/state out": content selects known behavior but never embeds executable behavior.

## Lifecycle and immutable revisions

Every catalog entity has a stable `id` and a monotonic `revision`.

1. New content starts as `draft` revision 1.
2. Each draft update appends the next revision.
3. Publishing appends an immutable `published` revision.
4. A published record cannot be directly edited; `startRevision` must explicitly create a new draft from it.
5. Retirement appends a `retired` revision while retaining historical published revisions.

Content packs store exact `{ id, revision }` references. Rulesets store exact published content-pack revisions. A saved game can therefore retain the rule/content snapshot that created it even after later administrative edits.

## Publication validation

Before publication, the validator checks as applicable:

- required IDs/titles/slugs;
- minimum physical-source verification status;
- runtime/core definition identity consistency;
- required published dependencies (decks, help, rewards, media);
- board-space existence through the Board lane registry;
- registered rule-capability IDs through the Core/Rules lane registry;
- duplicate skill/action/stage IDs;
- competition prerequisite integrity;
- exact published revisions inside content packs and rulesets;
- optional media-rights policy;
- asset-inventory QA consistency.

The default policy blocks `unverified` content. Production may strengthen this to require `qa-verified` content and confirmed media rights/provenance.

## Administration permissions

- `player`: read-only published content consumption.
- `content_editor`: create and revise content drafts; maintain inventory records.
- `content_publisher`: edit, publish, retire, and inspect audit history.
- `game_admin`: manage game-configuration drafts and inspect audit history.
- `system_admin`: all administrative capabilities.

Publication remains an explicit privileged action; hiding an admin control in the UI is never authorization.

## Persistence ports

The domain exports framework-independent ports:

- `ContentStore`;
- `AuditStore`;
- `Clock`;
- `IdGenerator`;
- `RuleCapabilityRegistry`;
- `BoardSpaceRegistry`.

`InMemoryContentStore` and `InMemoryAuditStore` provide deterministic adapters for tests and integration work. The Architecture lane can bind the ports to the selected persistent store without changing the content lifecycle.

## Admin UI information architecture

A future administrative application can safely expose:

- Dashboard;
- Game Content: Dogs, Trainer Decks/Cards, Tokens, Challenges, Rewards/Penalties, Board-Space Content, Competition Content;
- Rules & Help: rulebook, tutorials, glossary;
- Media;
- Game Configuration: Rulesets, Content Packs, Settings;
- Asset Inventory;
- Administration Audit Log.

The UI should show lifecycle state, verification state, revision, and dependency/validation failures prominently.

## Physical asset inventory still required

An exact base-game publication remains blocked until authoritative source material is inventoried for:

1. full board and preferably original production artwork;
2. rulebook;
3. every Trainer Card, front and back;
4. every Dog Card, front and back;
5. every token and its rules/quantity;
6. every pawn color;
7. dice specification;
8. player aids;
9. K9 Competition Track rules and icon meanings;
10. packaging/logo artwork;
11. font identification/licensing information;
12. original illustrations where available.

No production base-game content pack should be described as complete while these inputs remain unresolved.
