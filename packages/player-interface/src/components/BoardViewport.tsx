import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { BoardSpaceView, BoardView, PlayerSummaryView } from "../model";
import { clampZoom, focusSpace, fullBoardCamera, type CameraState } from "../lib/camera";

interface BoardViewportProps {
  board: BoardView;
  players: PlayerSummaryView[];
  activePlayerId: string;
  reducedMotion: boolean;
  onOpenHelp: (space: BoardSpaceView) => void;
}

const kindLabel: Record<BoardSpaceView["kind"], string> = {
  start: "Start",
  track: "Track space",
  action: "Action space",
  finish: "Finish",
};

export function BoardViewport({ board, players, activePlayerId, reducedMotion, onOpenHelp }: BoardViewportProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | undefined>(undefined);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ distance: number; zoom: number } | undefined>(undefined);
  const [camera, setCamera] = useState<CameraState>(() => fullBoardCamera());

  const spaceById = useMemo(() => new Map(board.spaces.map((space) => [space.id, space])), [board.spaces]);
  const activePawn = board.pawns.find((pawn) => pawn.playerId === activePlayerId);
  const activeSpace = activePawn ? spaceById.get(activePawn.spaceId) : undefined;

  const focus = (space: BoardSpaceView, zoom = 1.85) => {
    const bounds = viewportRef.current?.getBoundingClientRect();
    if (!bounds) return;
    setCamera(focusSpace(space, bounds.width, bounds.height, zoom));
  };

  useEffect(() => {
    if (camera.following && activeSpace) focus(activeSpace, camera.zoom);
    // Intentionally follows only authoritative space changes while follow mode is enabled.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSpace?.id]);

  const zoomBy = (delta: number) => setCamera((current) => ({ ...current, zoom: clampZoom(current.zoom + delta), following: false }));
  const followActive = () => { if (activeSpace) focus(activeSpace); };

  return (
    <section className="board-frame" aria-label="K9 Blitz game board">
      <div className="board-toolbar" aria-label="Board view controls">
        <button type="button" onClick={() => zoomBy(-0.25)} aria-label="Zoom out">−</button>
        <button type="button" onClick={() => zoomBy(0.25)} aria-label="Zoom in">+</button>
        <button type="button" onClick={() => setCamera(fullBoardCamera())}>Full board</button>
        <button type="button" onClick={followActive} disabled={!activeSpace}>Follow player</button>
      </div>

      <div
        ref={viewportRef}
        className="board-viewport"
        onWheel={(event) => { event.preventDefault(); zoomBy(event.deltaY < 0 ? 0.15 : -0.15); }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
          const pointers = [...pointersRef.current.values()];
          if (pointers.length === 1) {
            dragRef.current = { x: event.clientX, y: event.clientY, panX: camera.panX, panY: camera.panY };
          } else if (pointers.length === 2) {
            const [first, second] = pointers;
            if (first && second) {
              pinchRef.current = { distance: pointerDistance(first, second), zoom: camera.zoom };
              dragRef.current = undefined;
            }
          }
        }}
        onPointerMove={(event) => {
          if (!pointersRef.current.has(event.pointerId)) return;
          pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
          const pointers = [...pointersRef.current.values()];
          if (pointers.length >= 2 && pinchRef.current) {
            const [first, second] = pointers;
            if (first && second) {
              const pinch = pinchRef.current;
              const distance = pointerDistance(first, second);
              setCamera((current) => ({ ...current, zoom: clampZoom(pinch.zoom * (distance / pinch.distance)), following: false }));
              return;
            }
          }
          const drag = dragRef.current;
          if (drag) setCamera((current) => ({ ...current, panX: drag.panX + event.clientX - drag.x, panY: drag.panY + event.clientY - drag.y, following: false }));
        }}
        onPointerUp={(event) => { pointersRef.current.delete(event.pointerId); pinchRef.current = undefined; dragRef.current = undefined; }}
        onPointerCancel={(event) => { pointersRef.current.delete(event.pointerId); pinchRef.current = undefined; dragRef.current = undefined; }}
      >
        <div className={`board-surface ${reducedMotion ? "reduce-motion" : ""}`} style={{ transform: `translate3d(${camera.panX}px, ${camera.panY}px, 0) scale(${camera.zoom})` }}>
          {board.artworkUrl ? (
            <img className="board-artwork" src={board.artworkUrl} alt={board.artworkAlt ?? "K9 Blitz game board"} draggable={false} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", userSelect: "none", pointerEvents: "none" }} />
          ) : <DemoBoardScenery />}

          <div className="board-space-layer" aria-label="Interactive board spaces">
            {board.spaces.map((space) => (
              <button
                key={space.id}
                type="button"
                className={`board-space space-${space.kind} ${space.color ? `space-${space.color}` : ""} ${space.confidence === "provisional" ? "space-provisional" : ""}`}
                style={{ left: `${space.anchor.x * 100}%`, top: `${space.anchor.y * 100}%`, ...spaceVisualStyle(space) }}
                onClick={(event) => { event.stopPropagation(); if (space.helpText) onOpenHelp(space); else focus(space, Math.max(camera.zoom, 1.6)); }}
                aria-label={`${space.label}. ${kindLabel[space.kind]}`}
                title={`${space.label}${space.confidence === "provisional" ? " — provisional geometry" : ""}${space.helpText ? " — open help" : ""}`}
              >
                <span aria-hidden="true">{space.number ?? (space.kind === "start" ? "S" : space.kind === "finish" ? "F" : "•")}</span>
              </button>
            ))}
          </div>

          <div className="pawn-layer" aria-label="Player pawns">
            {board.pawns.map((pawn, index) => {
              const space = spaceById.get(pawn.spaceId);
              const player = players.find((candidate) => candidate.id === pawn.playerId);
              if (!space || !player) return null;
              const sameSpace = board.pawns.filter((candidate) => candidate.spaceId === pawn.spaceId);
              const slot = sameSpace.findIndex((candidate) => candidate.playerId === pawn.playerId);
              const angle = (slot / Math.max(1, sameSpace.length)) * Math.PI * 2;
              const offset = sameSpace.length > 1 ? 12 : 0;
              return (
                <div
                  key={pawn.playerId}
                  className={`pawn ${pawn.playerId === activePlayerId ? "active-pawn" : ""}`}
                  style={{ left: `calc(${space.anchor.x * 100}% + ${Math.cos(angle) * offset}px)`, top: `calc(${space.anchor.y * 100}% + ${Math.sin(angle) * offset}px)`, background: pawn.color, zIndex: 40 + index }}
                  aria-label={`${player.displayName}'s pawn at ${space.label}`}
                  title={`${player.displayName} — ${player.dog.name}`}
                >
                  <span aria-hidden="true">🐕</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <p className="board-art-note">{board.artworkUrl ? "Board artwork and geometry supplied by the Board & Map layer; provisional spaces are marked separately." : "Standalone demo geometry only. Production artwork and authoritative coordinates are injected by the Board & Map layer."}</p>
    </section>
  );
}

function spaceVisualStyle(space: BoardSpaceView): CSSProperties {
  const palette: Partial<Record<NonNullable<BoardSpaceView["color"]>, string>> = {
    blue: "#4f9cdf", green: "#67b66a", red: "#e95b50", yellow: "#f4cf55", orange: "#e79a43", black: "#333333",
  };
  return {
    ...(space.kind === "action" ? { background: "#fff6df", borderColor: "#7f5a37" } : {}),
    ...(space.color && palette[space.color] ? { background: palette[space.color] } : {}),
    ...(space.color === "red" || space.color === "black" ? { color: "white" } : {}),
    ...(space.confidence === "provisional" ? { outline: "2px dashed rgba(50,43,31,.6)", outlineOffset: 3 } : {}),
  };
}

function pointerDistance(a: { x: number; y: number }, b: { x: number; y: number }): number { return Math.hypot(a.x - b.x, a.y - b.y); }

function DemoBoardScenery() {
  return (
    <div className="demo-board" aria-hidden="true">
      <div className="demo-sky" />
      <div className="demo-park"><strong>Pawsitive Park</strong><span>agility field</span></div>
      <div className="demo-academy"><strong>K9 Academy</strong><span>training</span></div>
      <div className="demo-daycare"><strong>Doggy Daycare</strong><span>play &amp; care</span></div>
      <div className="demo-center"><span>BARKLEY</span><strong>VILLE</strong><small>Trainer Cards · Competition Track</small></div>
      <div className="demo-beach"><strong>The Beach</strong><span>Finish podium</span></div>
    </div>
  );
}
