import { useEffect, useMemo, useRef, useState } from "react";
import { BoardViewport } from "./components/BoardViewport";
import { EventModal } from "./components/EventModal";
import { HelpDrawer, HistoryDrawer, SettingsDrawer, type ExperienceSettings } from "./components/Drawers";
import { PlayerDashboard } from "./components/PlayerDashboard";
import { TurnControls } from "./components/TurnControls";
import { GameAudioController } from "./lib/audio";
import type { BoardSpaceView, GameExperienceProps } from "./model";

const settingsKey = "k9-blitz.player-experience.settings.v1";
const noAudioCues = {};

function readSettings(): ExperienceSettings {
  const fallback: ExperienceSettings = {
    soundEnabled: true,
    musicEnabled: true,
    reducedMotion: typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  };
  try {
    const stored = window.localStorage.getItem(settingsKey);
    return stored ? { ...fallback, ...JSON.parse(stored) } : fallback;
  } catch {
    return fallback;
  }
}

export function GameExperience({ snapshot, legalIntents, onIntent, title = "K9 Blitz", audioCues = noAudioCues, musicUrl }: GameExperienceProps) {
  const [settings, setSettingsState] = useState<ExperienceSettings>(readSettings);
  const [drawer, setDrawer] = useState<"history" | "help" | "settings" | undefined>();
  const [helpSpace, setHelpSpace] = useState<BoardSpaceView>();
  const audioRef = useRef(new GameAudioController(audioCues, musicUrl));
  const previousAudioState = useRef({ diceStatus: snapshot.dice.status, modalId: snapshot.modal?.id, playerId: snapshot.turn.currentPlayerId, phase: snapshot.turn.phase });

  useEffect(() => {
    audioRef.current.configure(audioCues, musicUrl);
    return () => audioRef.current.stopAll();
  }, [audioCues, musicUrl]);

  useEffect(() => {
    audioRef.current.syncMusic(settings);
  }, [settings.musicEnabled, musicUrl]);

  useEffect(() => {
    const previous = previousAudioState.current;
    if (previous.diceStatus !== snapshot.dice.status && snapshot.dice.status === "rolling") audioRef.current.playCue("dice-roll", settings);
    if (previous.modalId !== snapshot.modal?.id && snapshot.modal?.kind === "trainer-card") audioRef.current.playCue("card-reveal", settings);
    if (previous.modalId !== snapshot.modal?.id && snapshot.modal?.kind === "token") audioRef.current.playCue("token-award", settings);
    if (previous.playerId !== snapshot.turn.currentPlayerId) audioRef.current.playCue("turn-change", settings);
    if (previous.phase !== snapshot.turn.phase && snapshot.turn.phase === "game-complete") audioRef.current.playCue("victory", settings);
    previousAudioState.current = { diceStatus: snapshot.dice.status, modalId: snapshot.modal?.id, playerId: snapshot.turn.currentPlayerId, phase: snapshot.turn.phase };
  }, [snapshot.dice.status, snapshot.modal?.id, snapshot.modal?.kind, snapshot.turn.currentPlayerId, snapshot.turn.phase, settings.soundEnabled]);

  const activePlayer = useMemo(
    () => snapshot.players.find((player) => player.id === snapshot.turn.currentPlayerId) ?? snapshot.players[0],
    [snapshot.players, snapshot.turn.currentPlayerId],
  );

  if (!activePlayer) return <main className="experience-empty">No players are available for this game.</main>;

  const setSettings = (next: ExperienceSettings) => {
    setSettingsState(next);
    try { window.localStorage.setItem(settingsKey, JSON.stringify(next)); } catch { /* storage is optional */ }
  };

  const interactionDisabled = snapshot.connection !== "connected";

  return (
    <main className={`game-experience ${settings.reducedMotion ? "reduce-motion" : ""}`}>
      <header className="game-topbar">
        <div><p className="eyebrow">The Ultimate Dog Training Challenge</p><h1>{title}</h1></div>
        <div className="topbar-actions">
          <ConnectionBadge state={snapshot.connection} revision={snapshot.revision} />
          <button type="button" onClick={() => { setHelpSpace(undefined); setDrawer("help"); }}>Help</button>
          <button type="button" onClick={() => setDrawer("history")}>History</button>
          <button type="button" onClick={() => setDrawer("settings")} aria-label="Experience settings">⚙</button>
        </div>
      </header>

      <section className="game-layout">
        <div className="player-rail" aria-label="Players">
          {snapshot.players.map((player) => (
            <div key={player.id} className={`player-chip ${player.id === snapshot.turn.currentPlayerId ? "active" : ""}`}>
              <span className="player-dot" style={{ background: player.color }} />
              <span><strong>{player.displayName}</strong><small>{player.dog.name}</small></span>
              {player.isConnected === false && <em title="Disconnected">offline</em>}
            </div>
          ))}
        </div>

        <BoardViewport board={snapshot.board} players={snapshot.players} activePlayerId={snapshot.turn.currentPlayerId} reducedMotion={settings.reducedMotion} onOpenHelp={(space) => { setHelpSpace(space); setDrawer("help"); }} />
        <PlayerDashboard player={activePlayer} isActive />
      </section>

      <TurnControls turn={snapshot.turn} dice={snapshot.dice} legalIntents={legalIntents} disabled={interactionDisabled} onIntent={onIntent} />

      {interactionDisabled && <ConnectionOverlay state={snapshot.connection} />}
      {snapshot.modal && <EventModal modal={snapshot.modal} onIntent={onIntent} />}

      <HistoryDrawer open={drawer === "history"} history={snapshot.history} onClose={() => setDrawer(undefined)} />
      <HelpDrawer open={drawer === "help"} space={helpSpace} onClose={() => setDrawer(undefined)} />
      <SettingsDrawer open={drawer === "settings"} settings={settings} onSettings={setSettings} onClose={() => setDrawer(undefined)} />
    </main>
  );
}

function ConnectionBadge({ state, revision }: { state: GameExperienceProps["snapshot"]["connection"]; revision: number }) {
  return <span className={`connection-badge connection-${state}`} title={`Authoritative revision ${revision}`}>{state === "connected" ? `Live · r${revision}` : state}</span>;
}

function ConnectionOverlay({ state }: { state: GameExperienceProps["snapshot"]["connection"] }) {
  const copy = state === "reconnecting" ? "Reconnecting to the authoritative game state…" : state === "synchronizing" ? "Synchronizing game state…" : "Connection lost. Actions are paused until the game state is restored.";
  return <div className="connection-overlay" role="status">{copy}</div>;
}
