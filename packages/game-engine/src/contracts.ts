export type GameStatus = "lobby" | "active" | "completed";

export type TurnPhase =
  | "awaiting_roll"
  | "roll_resolved"
  | "resolving_action"
  | "turn_complete";

export interface PlayerState {
  readonly id: string;
  readonly displayName: string;
  readonly boardSpaceId: string | null;
}

export interface TurnState {
  readonly number: number;
  readonly phase: TurnPhase;
}

export interface GameState {
  readonly gameId: string;
  readonly rulesVersion: string;
  readonly contentVersion: string;
  readonly revision: number;
  readonly status: GameStatus;
  readonly currentPlayerId: string;
  readonly turn: TurnState;
  readonly players: readonly PlayerState[];
  readonly processedCommandIds: readonly string[];
}

export interface CommandEnvelope {
  readonly commandId: string;
  readonly actorPlayerId: string;
  readonly expectedRevision: number;
}

export interface RollDiceCommand extends CommandEnvelope {
  readonly type: "ROLL_DICE";
}

export type GameCommand = RollDiceCommand;

export interface DiceRolledEvent {
  readonly type: "DICE_ROLLED";
  readonly commandId: string;
  readonly playerId: string;
  readonly dice: readonly [number, number];
  readonly total: number;
  readonly stateRevision: number;
}

export type GameEvent = DiceRolledEvent;

export type EngineErrorCode =
  | "GAME_NOT_ACTIVE"
  | "STALE_STATE"
  | "NOT_CURRENT_PLAYER"
  | "COMMAND_ALREADY_PROCESSED"
  | "ACTION_NOT_ALLOWED";

export interface EngineFailure {
  readonly ok: false;
  readonly code: EngineErrorCode;
  readonly message: string;
  readonly state: GameState;
}

export interface EngineSuccess {
  readonly ok: true;
  readonly state: GameState;
  readonly events: readonly GameEvent[];
}

export type EngineResult = EngineFailure | EngineSuccess;
