import { useMemo, useState } from "react";
import type { BoardSpaceView, GameExperienceSnapshot, IntentAvailability, PlayerIntent } from "../model";

const path: BoardSpaceView[] = [
  { id: "start", label: "START", anchor: { x: 0.07, y: 0.83 }, kind: "start", helpText: "Starting zone. Exact setup behavior comes from the authoritative K9 Blitz rules." },
  { id: "s1", number: 1, label: "Space 1", anchor: { x: 0.14, y: 0.76 }, kind: "track", color: "blue" },
  { id: "s2", number: 2, label: "Space 2", anchor: { x: 0.21, y: 0.68 }, kind: "track", color: "green" },
  { id: "obedience", number: 3, label: "Obedience Class", anchor: { x: 0.29, y: 0.58 }, kind: "action", helpText: "Obedience Class appears on the physical board. Its exact rule must be supplied by the rulebook/content layer." },
  { id: "s4", number: 4, label: "Space 4", anchor: { x: 0.39, y: 0.48 }, kind: "track", color: "yellow" },
  { id: "s5", number: 5, label: "Space 5", anchor: { x: 0.49, y: 0.40 }, kind: "track", color: "red" },
  { id: "trainer", number: 6, label: "Trainer Card", anchor: { x: 0.61, y: 0.37 }, kind: "action", helpText: "Trainer Card presentation is supported here; card resolution remains authoritative game logic." },
  { id: "s7", number: 7, label: "Space 7", anchor: { x: 0.71, y: 0.44 }, kind: "track", color: "blue" },
  { id: "agility", number: 8, label: "Agility Course", anchor: { x: 0.78, y: 0.54 }, kind: "action", helpText: "Agility Course is shown on the board reference. Exact outcomes are not inferred by this interface." },
  { id: "vet", number: 9, label: "Vet Check", anchor: { x: 0.82, y: 0.67 }, kind: "action", helpText: "Vet Check is a known board label; rule text awaits the authoritative rulebook." },
  { id: "s10", number: 10, label: "Space 10", anchor: { x: 0.76, y: 0.79 }, kind: "track", color: "green" },
  { id: "finish", label: "FINISH", anchor: { x: 0.90, y: 0.84 }, kind: "finish", helpText: "Finish/podium area. The interface does not assume that arrival alone determines the winner." },
];

const initial: GameExperienceSnapshot = {
  gameId: "demo-k9-blitz",
  revision: 7,
  connection: "connected",
  localPlayerId: "p1",
  players: [
    {
      id: "p1", displayName: "Player 1", color: "#e6493f", positionLabel: "Obedience Class", trainerCardCount: 2,
      dog: { name: "Luna", breed: "Corgi", trainingCompleted: 3, trainingTotal: 6, competitionProgress: 4, competitionTotal: 8 },
      tokens: [{ id: "paw", label: "Paw", count: 2 }, { id: "ribbon", label: "Ribbon", count: 1 }], isConnected: true,
    },
    {
      id: "p2", displayName: "Player 2", color: "#3b78d8", positionLabel: "Space 2", trainerCardCount: 1,
      dog: { name: "Max", breed: "Beagle", trainingCompleted: 2, trainingTotal: 6, competitionProgress: 2, competitionTotal: 8 },
      tokens: [{ id: "paw", label: "Paw", count: 1 }], isConnected: true,
    },
  ],
  board: {
    spaces: path,
    pawns: [
      { playerId: "p1", spaceId: "obedience", color: "#e6493f", label: "Player 1 pawn" },
      { playerId: "p2", spaceId: "s2", color: "#3b78d8", label: "Player 2 pawn" },
    ],
    focusSpaceId: "obedience",
  },
  turn: { number: 7, currentPlayerId: "p1", phase: "awaiting-roll", prompt: "Player 1's turn", detail: "Roll the dice to begin the turn." },
  dice: { values: null, status: "idle" },
  history: [
    { id: "h1", turn: 6, actorId: "p2", message: "Player 2 completed the previous turn." },
    { id: "h2", turn: 7, actorId: "p1", message: "Player 1's turn began." },
  ],
};

export function useDemoGame(): {
  snapshot: GameExperienceSnapshot;
  legalIntents: IntentAvailability;
  onIntent: (intent: PlayerIntent) => void;
} {
  const [snapshot, setSnapshot] = useState(initial);

  const legalIntents = useMemo<IntentAvailability>(() => ({
    rollDice: snapshot.turn.phase === "awaiting-roll",
    drawCard: snapshot.turn.phase === "resolving-space",
    endTurn: snapshot.turn.phase === "turn-complete",
  }), [snapshot.turn.phase]);

  const onIntent = (intent: PlayerIntent) => {
    if (intent.type === "ROLL_DICE") {
      // DEMO ONLY: production dice values come from the authoritative rules/game-state layer.
      const values: [number, number] = [3, 4];
      setSnapshot((current) => ({
        ...current,
        revision: current.revision + 1,
        dice: { values, status: "settled" },
        turn: { ...current.turn, phase: "resolving-space", prompt: "You rolled 7", detail: "Luna moved to the Trainer Card space. Draw a card to continue." },
        board: {
          ...current.board,
          pawns: current.board.pawns.map((pawn) => pawn.playerId === current.turn.currentPlayerId ? { ...pawn, spaceId: "trainer" } : pawn),
          focusSpaceId: "trainer",
        },
        players: current.players.map((player) => player.id === current.turn.currentPlayerId ? { ...player, positionLabel: "Trainer Card" } : player),
        history: [...current.history, { id: `h-${current.history.length + 1}`, turn: current.turn.number, actorId: current.turn.currentPlayerId, message: "Player 1 rolled 7 and moved to the Trainer Card space." }],
      }));
      return;
    }

    if (intent.type === "DRAW_CARD") {
      setSnapshot((current) => ({
        ...current,
        revision: current.revision + 1,
        turn: { ...current.turn, phase: "awaiting-choice", prompt: "Trainer Card drawn", detail: "Resolve the card to continue." },
        modal: {
          id: "demo-card",
          kind: "trainer-card",
          eyebrow: "Trainer Card",
          title: "Digital card presentation",
          body: "This demonstrates the reveal and choice interface. Authentic card text and effects must come from the K9 Blitz content/rules layer.",
          choices: [{ id: "resolve", label: "Resolve demo card", description: "Completes the presentation without inventing a production rule." }],
        },
      }));
      return;
    }

    if (intent.type === "SELECT_CHOICE" || intent.type === "DISMISS_MODAL") {
      setSnapshot((current) => {
        const { modal: _resolvedModal, ...withoutModal } = current;
        return {
          ...withoutModal,
          revision: current.revision + 1,
          turn: { ...current.turn, phase: "turn-complete", prompt: "Turn complete", detail: "The authoritative controller can now advance to the next player." },
          history: [...current.history, { id: `h-${current.history.length + 1}`, turn: current.turn.number, actorId: current.turn.currentPlayerId, message: "The Trainer Card presentation was resolved." }],
        };
      });
      return;
    }

    if (intent.type === "END_TURN") setSnapshot(initial);
  };

  return { snapshot, legalIntents, onIntent };
}
