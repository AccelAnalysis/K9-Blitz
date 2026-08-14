export type GameMode =
  | "local_pass_and_play"
  | "online_private"
  | "solo_vs_ai";

export type ControllerType =
  | "human_local"
  | "human_remote"
  | "computer";

export type ConnectionState =
  | "local"
  | "connected"
  | "disconnected"
  | "reconnecting";

export type PlayerStatus =
  | "joining"
  | "selecting"
  | "ready"
  | "active"
  | "waiting"
  | "disconnected"
  | "finished";

export type GameSetupState =
  | "creating"
  | "waiting_for_players"
  | "configuring_players"
  | "ready_check"
  | "initializing"
  | "playing";

export type LobbyStatus = "open" | "starting" | "closed";

export type DogAssignmentMode =
  | "player_choice"
  | "random"
  | "rules_defined";

export interface GameConfiguration {
  readonly mode: GameMode;
  readonly minimumPlayers: number;
  readonly maximumPlayers: number;
  readonly dogAssignmentMode: DogAssignmentMode;
  readonly allowReconnect: boolean;
  readonly rulesVersion: string;
  readonly contentVersion: string;
  readonly pawnIds: readonly string[];
}

export interface Player {
  readonly id: string;
  readonly displayName: string;
  readonly controllerType: ControllerType;
  readonly userId?: string;
  readonly seatNumber: number;
  readonly pawnId: string | null;
  readonly dogId: string | null;
  readonly connectionState: ConnectionState;
  readonly status: PlayerStatus;
  readonly ready: boolean;
}

export interface PlayerSeat {
  readonly seatNumber: number;
  readonly playerId: string | null;
}

export interface LobbyState {
  readonly gameId: string;
  readonly roomCode?: string;
  readonly hostPlayerId: string;
  readonly configuration: GameConfiguration;
  readonly setupState: GameSetupState;
  readonly status: LobbyStatus;
  readonly seats: readonly PlayerSeat[];
  readonly players: readonly Player[];
}

export interface JoinPlayerInput {
  readonly playerId: string;
  readonly displayName: string;
  readonly controllerType: ControllerType;
  readonly userId?: string;
}

export interface CommandEnvelope<TCommand = unknown> {
  readonly gameId: string;
  readonly playerId: string;
  readonly command: TCommand;
}

export interface AuthoritativeTurnView {
  readonly gameId: string;
  readonly activePlayerId: string;
  readonly legalCommandTypes: readonly string[];
}

export interface TypedCommand {
  readonly type: string;
}

export interface OnlinePlayerSession {
  readonly playerId: string;
  readonly userId: string;
  readonly connectionId: string;
  readonly connectionState: Exclude<ConnectionState, "local">;
  readonly reconnectToken: string;
}

export interface LegalAction<TCommand extends TypedCommand = TypedCommand> {
  readonly command: TCommand;
  readonly scoreHint?: number;
}
