# K9 Blitz Release Gates

## 1. Pull-request gate

Every candidate must pass `npm run qa` on the exact PR head. The gate includes type checking, architecture audit, all discovered tests, deterministic complete-game simulation, and construction/verification of the GitHub Pages artifact.

A lane may not rely on its own package test command as proof that repository integration passes.

## 2. Main-branch gate

Merging requires a green exact-head CI result unless an administrator consciously overrides an external GitHub limitation. If `main` advances after validation, the candidate is refreshed/revalidated before merge.

## 3. Rules/content authority gate

Every release identifies its `rulesVersion` and `contentVersion`. Physical-source facts and owner-authored digital design retain distinct provenance. The current launch authority is `docs/DIGITAL_RULES_V1.md` under ADR-0002.

A material rules/content change publishes a new version; it does not silently alter old saves.

## 4. GitHub Pages artifact gate

`npm run build:pages` is the canonical artifact assembler. It fails when a source asset is missing, JavaScript syntax is invalid, a local HTML/module reference is broken, required document semantics are absent, or the board asset is not SVG content.

The Pages workflow reruns canonical repository QA before deployment, then rebuilds the same artifact through the canonical builder.

## 5. Runtime-claim gate

The current Pages release may claim local/pass-and-play authority, local saved games, computer players, and K9 Blitz Digital Rules v1.0 behavior implemented there. It may not claim secure remote-authoritative multiplayer merely because online domain models exist.

A remote multiplayer release additionally requires a trusted session host, authentication/authorization, trusted randomness, atomic revision persistence, reconnect recovery, and real transport E2E evidence.

## 6. Severity gate

- P0/P1 defects block the affected release claim.
- P2 defects require an explicit release decision and documented workaround.
- P3 defects may ship when no correctness/accessibility obligation is violated.

## 7. Evidence

Record exact commit SHA, CI workflow result, rules/content versions, and deployment result. For a failed rule test, retain deterministic seed/input sufficient to reproduce the failure.
