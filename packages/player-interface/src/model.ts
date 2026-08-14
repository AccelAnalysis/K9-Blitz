export type PlayerId = string;
export type BoardEntityId = string;

export interface NormalizedPointView {
  /** Horizontal logical-board coordinate, 0 = left, 1 = right. */
  x: number;
  /** Vertical logical-board coordinate, 0 = top, 1 = bottom. */
  y: number;
}

export type ConnectionState = "connected" | "synchronizing" | "reconnecting" | "disconnected";
export type ExperiencePhase = "awaiting-roll" | "resolving-roll" | "moving" | "resolving-space" | "awaiting-choice" | "turn-complete" | "game-complete";
export type BoardSpaceKind = "start" | "track" | "action" | "finish";
export type BoardSpaceColor = "red" | "blue" | "green" | "yellow" | "orange" | "black" | "other";
export type SourceConfidence = "verified" | "provisional";

export interface BoardSpaceView {
  id: BoardEntityId;
  number?: number;
  label: string;
  anchor: NormalizedPointView;
  kind: BoardSpaceKind;
  color?: BoardSpaceColor;
  confidence?: SourceConfidence;
  helpText?: string;
}

export interface PawnView { playerId: PlayerId; spaceId: BoardEntityId; color: string; label: string; }

export interface DogSummaryView {
  name: string;
  breed?: string;
  portraitUrl?: string;
  trainingCompleted?: number;
  trainingTotal?: number;
  competitionProgress?: number;
  competitionTotal?: number;
}

export interface TokenSummaryView { id: string; label: string; count: number; }

export interface PlayerSummaryView {
  id: PlayerId;
  displayName: string;
  color: string;
  dog: DogSummaryView;
  trainerCardCount: number;
  tokens: TokenSummaryView[];
  positionLabel: string;
  isConnected?: boolean;
}

export interface DiceView { values: readonly [number, number] | null; status: "idle" | "rolling" | "settled"; }
export interface ChoiceView { id: string; label: string; description?: string; disabled?: boolean; }

export interface ModalView {
  id: string;
  kind: "trainer-card" | "event" | "token" | "help" | "result";
  title: string;
  eyebrow?: string;
  body: string;
  choices?: ChoiceView[];
  dismissible?: boolean;
}

export interface GameHistoryEntryView { id: string; turn: number; message: string; actorId?: PlayerId; stateRevision?: number; }
export interface TurnView { number: number; currentPlayerId: PlayerId; phase: ExperiencePhase; prompt: string; detail?: string; }
export interface BoardView { artworkUrl?: string; artworkAlt?: string; spaces: BoardSpaceView[]; pawns: PawnView[]; focusSpaceId?: BoardEntityId; }

export interface GameExperienceSnapshot {
  gameId: string;
  /** Monotonic authoritative revision used to recover presentation after reconnect. */
  revision: number;
  rulesVersion?: string;
  contentVersion?: string;
  connection: ConnectionState;
  localPlayerId?: PlayerId;
  players: PlayerSummaryView[];
  board: BoardView;
  turn: TurnView;
  dice: DiceView;
  modal?: ModalView;
  history: GameHistoryEntryView[];
}

/** Non-authoritative UI intention. Application orchestration converts this to a validated game command. */
export type PlayerIntent =
  | { type: "ROLL_DICE" }
  | { type: "DRAW_CARD"; deckId: string }
  | { type: "SELECT_CHOICE"; modalId: string; choiceId: string }
  | { type: "DISMISS_MODAL"; modalId: string }
  | { type: "END_TURN" };

export interface IntentAvailability { rollDice: boolean; drawCard: boolean; endTurn: boolean; }
export type AudioCue = "dice-roll" | "card-reveal" | "token-award" | "turn-change" | "victory";

export interface GameExperienceProps {
  snapshot: GameExperienceSnapshot;
  legalIntents: IntentAvailability;
  onIntent: (intent: PlayerIntent) => void | Promise<void>;
  title?: string;
  audioCues?: Partial<Record<AudioCue, string>>;
  musicUrl?: string;
}
