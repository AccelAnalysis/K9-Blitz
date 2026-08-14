export type GameModesErrorCode =
  | "INVALID_CONFIGURATION"
  | "LOBBY_CLOSED"
  | "PLAYER_LIMIT_REACHED"
  | "PLAYER_ALREADY_JOINED"
  | "PLAYER_NOT_FOUND"
  | "HOST_REQUIRED"
  | "PAWN_UNAVAILABLE"
  | "DOG_REQUIRED"
  | "DOG_UNAVAILABLE"
  | "PAWN_REQUIRED"
  | "PLAYER_NOT_READY"
  | "MINIMUM_PLAYERS_NOT_MET"
  | "MODE_ROSTER_INVALID"
  | "GAME_ID_MISMATCH"
  | "STALE_STATE"
  | "NOT_YOUR_TURN"
  | "ILLEGAL_COMMAND"
  | "REMOTE_IDENTITY_REQUIRED"
  | "RECONNECT_DISABLED"
  | "SESSION_NOT_FOUND"
  | "INVALID_RECONNECT_TOKEN"
  | "NO_LEGAL_ACTIONS"
  | "INVALID_RANDOM_SOURCE";

export class GameModesError extends Error {
  public readonly code: GameModesErrorCode;

  constructor(code: GameModesErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "GameModesError";
  }
}
