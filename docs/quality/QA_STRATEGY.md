# K9 Blitz Quality Assurance Strategy

## Quality objective

A digital K9 Blitz release is correct only when the authoritative state, active versioned K9 Blitz rules, player-visible behavior, persistence, and multiplayer behavior agree. Visual resemblance alone is not acceptance.

Physical-source fidelity and digital-product correctness are related but distinct claims. A source-backed legacy fact must be supported by evidence; an owner-authored digital rule must be explicitly specified and versioned. Both are testable once established.

## Test layers

### 1. Contract and data tests
Validate identifiers, schemas, board references, content references, version compatibility, and malformed content. These become mandatory as board/card/token content is introduced.

### 2. Rules-engine unit tests
Every rule must have deterministic tests covering legal path, illegal action, boundary/edge condition, effect exactly once, and no mutation on rejection. Random rules use injected deterministic values.

### 3. State-transition tests
Verify phase transitions, turn ownership, monotonic revisions, duplicate-command protection, win/finish conditions, and recovery from rejected commands.

### 4. Persistence tests
For each significant game phase: serialize, destroy runtime state, reload, and compare. Saved games must preserve deck/order information, active actions, versions, and authoritative revision once those domains exist.

### 5. Multiplayer/concurrency tests
Cover simultaneous commands, stale clients, duplicate submissions, reconnect, dropped messages, server restart, and atomic revision conflicts. No network path may create two accepted successors to the same authoritative revision.

### 6. End-to-end journey tests
Exercise complete player journeys from lobby through game completion. Local pass-and-play comes before remote multiplayer acceptance.

### 7. Visual regression tests
Once production board assets exist, maintain canonical screenshots for full-board and focused board areas across desktop/tablet/mobile. Visual tests supplement—not replace—logical assertions.

### 8. Accessibility/responsive tests
Verify keyboard/focus behavior, readable card/event UI, reduced motion, sound controls, accessible labels, and non-color-only communication.

### 9. Headless simulation
For each release rules version, run large deterministic game batches to identify unreachable states, loops, impossible finishes, and balance outliers once the required simulation adapter exists.

## Mandatory pull-request gates

A change is mergeable only when applicable gates are green:

1. Type-check passes.
2. Existing automated tests pass.
3. New behavior includes tests at the lowest effective layer.
4. A behavior claimed as legacy physical-game fidelity has source evidence; a newly designed behavior has explicit owner-approved digital-rule provenance and a version update when material.
5. Persistence/multiplayer changes demonstrate revision safety where applicable.
6. Visual changes include visual evidence once the rendering system exists.
7. Blocked acceptance is labeled blocked/unverified rather than reported as passing; owner-approved digital design work is not blocked merely because a legacy source never defined that behavior.

The bootstrap CI currently enforces type-check and deterministic engine unit tests. Additional gates should be activated when their implementation layer exists rather than adding permanently fake/skipped checks.

## Defect classification

- **P0 — State corruption / security / unrecoverable game loss:** authoritative state becomes invalid, players can forge outcomes, or active games are destroyed.
- **P1 — Rules correctness / multiplayer divergence:** an active versioned rule resolves incorrectly, illegal action succeeds, clients disagree on authoritative state, or a game cannot legitimately finish.
- **P2 — Significant experience defect:** interaction blocks normal play but does not corrupt state; reconnect or responsive behavior is materially degraded.
- **P3 — Cosmetic/minor:** visual/audio/text defect with a safe workaround and no rule/state impact.

## Evidence standard

For rule defects, evidence should capture: initial state/revision, command, deterministic/random input, emitted events, resulting state/revision, expected result, and authoritative rule source. The rule source may be source-backed physical documentation or an owner-authorized digital rules specification such as `docs/DIGITAL_RULES_V1.md`. For multiplayer defects, also capture both client revisions and server revision.
