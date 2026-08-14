export type GameModesErrorCode =
  | "INVALID_CONFIGURATION"
  | "LOBBY_CLOSED"
  | "PLAYER_LIMIT_REACHED"
  | "PLAYER_ALREADY_JOINED"
  | "PLAYER_NOT_FOUND"
  | "HOST_REQUIRED"
  | "PAWN_UNAVAILABLE"
  | "DOG_REQUIRED"
  | "PAWN_REQUIRED"
  | "PLAYER_NOT_READY"
  | "MINIMUM_PLAYERS_NOT_MET"
  | "GAME_ID_MISMATCH"
  | "NOT_YOUR_TURN"
  | "ILLEGAL_COMMAND"
  | "REMOTE_IDENTITY_REQUIRED"
  | "RECONNECT_DISABLED"
  | "SESSION_NOT_FOUND"
  | "INVALID_RECONNECT_TOKEN"
  | "NO_LEGAL_ACTIONS";

export class GameModesError extends Error {
  constructor(
    public readonly code: GameModesErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "GameModesError";
  }
}
