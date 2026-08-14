# K9 Blitz Quality Assurance Strategy

## Quality objective

A digital K9 Blitz release is correct only when the authoritative state, active versioned K9 Blitz rules, player-visible behavior, persistence boundary, and deployment artifact agree. Visual resemblance alone is not acceptance.

Physical-source fidelity and digital-product correctness are related but distinct claims. A source-backed legacy fact must be supported by evidence; an owner-authored digital rule must be explicitly specified and versioned. K9 Blitz Digital Rules v1.0 are current product authority under `docs/DIGITAL_RULES_V1.md` and ADR-0002.

## Canonical gate

Run:

```bash
npm run qa
```

Pull-request CI and Pages verification execute the same command. It performs:

1. strict TypeScript validation for repository TypeScript domain sources;
2. repository/architecture audit;
3. automatic test discovery across `packages/`, `apps/`, and `tools/`;
4. prerequisite builds for tests that consume package `dist/` output;
5. all discovered unit/domain/integration/complete-game tests;
6. GitHub Pages artifact assembly and static smoke validation.

A future lane therefore cannot add a test file that silently sits outside a hand-maintained root test list.

## Test layers

### 1. Contract and data
Validate identifiers, schemas, board references, content references, version compatibility, malformed content, and publication contracts.

### 2. Rules-engine and component units
Every rule/component mechanic receives deterministic coverage for legal behavior, rejection/boundary behavior, effect exactly once, and invariant preservation. Random mechanics use deterministic inputs.

### 3. State transitions
Verify phase transitions, turn ownership, monotonic revisions, duplicate-command protection, history, winner/finish conditions, and recovery from rejected commands.

### 4. Persistence
Local versioned state must survive serialization/save-restore without losing active player, board position, deck progress, rewards, competition progress, winner, or version identity. Future hosted persistence additionally requires atomic revision tests and restart recovery.

### 5. Multiplayer/concurrency
Cover stale revisions, duplicate commands, reconnect/session identity, deterministic computer-player behavior, and authoritative local handoff at the domain layer. Hosted transport/database acceptance becomes mandatory when an online service is introduced.

### 6. Complete-game simulation
For each release rules version, run deterministic game batches to identify loops, impossible finishes, invalid state bounds, and reproducibility defects. Current QA includes hundreds of seeded four-player K9 Blitz Digital Rules v1.0 games.

### 7. Static release artifact
The Pages builder checks JavaScript syntax, required HTML semantics, local HTML references, module references, board SVG presence, and the exact canonical file set copied to `_site`.

### 8. Visual regression and accessibility
Automated static checks supplement—never replace—human visual/keyboard/screen-reader acceptance until a screenshot/browser accessibility harness is added. Player-visible changes still require appropriate visual evidence.

## Mandatory pull-request gates

A change is mergeable only when applicable gates are green:

1. `npm run qa` passes on the exact candidate.
2. New behavior includes tests at the lowest effective layer.
3. A behavior claimed as physical-game fidelity has source evidence; newly designed behavior has explicit owner-approved digital-rule provenance/versioning.
4. Persistence/multiplayer changes demonstrate revision safety where applicable.
5. The deployable Pages artifact builds from the same source candidate.
6. P0/P1 defects are absent for the claimed release scope.

## Defect classification

- **P0 — State corruption / security / unrecoverable game loss:** authoritative state becomes invalid, remote outcomes can be forged, or active games are destroyed.
- **P1 — Rules/release correctness:** an active versioned rule resolves incorrectly, illegal action succeeds, clients diverge, a game cannot legitimately finish, canonical QA fails, or the release artifact is broken.
- **P2 — Significant experience defect:** interaction blocks normal play but state remains recoverable.
- **P3 — Cosmetic/minor:** visual/audio/text defect with no rule/state consequence.

## Evidence standard

For gameplay defects capture rules/content version, initial state/revision, action/command, deterministic/random input, emitted history/events, resulting state/revision, expected result, and rule authority. For remote defects also capture client/session/server revisions. For Pages defects capture exact commit, QA/workflow result, and deployment result.
