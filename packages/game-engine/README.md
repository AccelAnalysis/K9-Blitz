# K9 Blitz Game Engine

This package is the framework-independent authority for K9 Blitz gameplay state transitions.

Current bootstrap scope proves the architecture only: typed state/command/event contracts, revision-aware command validation, turn/phase checks, duplicate-command protection, injected randomness, and deterministic tests.

It does **not** yet implement board movement, card effects, tokens, competition progression, or victory rules because those behaviors require authoritative physical-game rules/content.

## Boundary

Code here must not import React, rendering engines, browser APIs, database SDKs, authentication SDKs, or multiplayer transports. Those systems call the engine through commands and consume returned state/events.
