# Board calibration preview

A dependency-free engineering preview for the Board/Map lane. It exists to validate board scaling, pan/zoom behavior, hit regions, pawn visibility, and normalized coordinate capture before a product UI framework is selected/integrated.

Run a static server from the repository root, for example:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/tools/board-preview/
```

The preview intentionally does not execute K9 Blitz rules. Clicking the board reports normalized coordinates so an authoritative straight-down board image can be transcribed without tying geometry to one screen resolution.
