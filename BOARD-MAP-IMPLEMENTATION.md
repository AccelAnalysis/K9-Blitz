# Board, Map & Physical Pieces — implementation boundary

This branch establishes the **Category 1** foundation from the project README: Digital Board Recreation, Board Coordinate & Movement System, and Player Pawns.

## Implemented

- perspective-corrected development board reference derived from the supplied photograph;
- normalized `[0,1]` coordinate contract;
- typed Barkley Ville board/location model;
- explicit graph-based `next`/`previous` topology contract;
- topology validation and deterministic movement-path traversal primitives;
- strict refusal to make a movement choice when topology branches without a rule-level chooser;
- canonical photographed pawn colors (red, blue, green, yellow, brown);
- deterministic co-located pawn layout;
- viewport coordinate conversion helpers;
- responsive, dependency-free board calibration preview with pan, zoom, fit, hit-region overlay and coordinate inspection;
- unit tests for topology, coordinate conversion, pawn layout and branch safety.

## Source-supported versus still unknown

The supplied board photograph supports the overall Barkley Ville visual target, colored track, START, FINISH, Pawsitive Park, central Barkley Ville/Trainer Card/K9 Competition areas, The Beach, and the visible pawn colors.

It does **not** reliably establish the complete machine-readable order of every printed track segment or the gameplay meaning of every printed color/value/action. Those details are intentionally not fabricated in this implementation. The route model is ready for authoritative transcription once a straight-down board scan/original artwork and the rulebook are available.

## Cross-workstream contract

Category 1 owns geometry and physical board/pawn representation. It does not own:

- dice outcomes;
- Trainer Card mechanics;
- Dog Profile Card mechanics;
- tokens/bag mechanics;
- board-space rule effects;
- K9 Competition Track progression rules;
- turn authority or persistent game state;
- multiplayer synchronization;
- product-level dashboard/modals/animation/sound.

Other workstreams should consume stable `space.id`, location IDs, normalized coordinates and `walkBoard()` rather than embedding board geometry or movement-path assumptions in UI/rules code.

## Completion gate for faithful production board

The software foundation is implemented, but visual/map transcription should remain **provisional** until the project receives:

1. licensed original board artwork or a straight-down high-resolution scan;
2. complete rulebook;
3. confirmation of every track-space boundary, printed label and path edge;
4. approved production pawn artwork/3D assets if the final UI requires more than color-coded digital markers.
