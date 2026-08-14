import type { GameConfiguration, GameMode, Player } from "./types.ts";

export const K9_BLITZ_PLAYER_RULES_V1 = {
  id: "k9-blitz-player-rules-1.0",
  provenance: "owner_authorized_digital",
  minimumPlayers: 2,
  maximumPlayers: 5,
  pawnIds: ["red", "blue", "green", "yellow", "brown"],
  dogAssignmentMode: "player_choice",
  uniqueDogAssignments: true,
  turnOrderMode: "seat_order",
  startingSeatNumber: 1,
  trainerCardVisibility: "public",
  victoryMode: "first_to_finish",
  spectatorsAllowed: false,
  lateJoinAllowed: false,
  modes: {
    local_pass_and_play: {
      hostController: "human_local",
      allowedControllers: ["human_local", "computer"],
      accountsRequired: false,
      reconnect: false,
    },
    online_private: {
      hostController: "human_remote",
      allowedControllers: ["human_remote", "computer"],
      accountsRequired: true,
      reconnect: true,
    },
    solo_vs_ai: {
      hostController: "human_local",
      allowedControllers: ["human_local", "computer"],
      humanPlayers: 1,
      minimumComputerPlayers: 1,
      maximumComputerPlayers: 4,
      accountsRequired: false,
      reconnect: false,
    },
  },
} as const;

export const K9_BLITZ_DIGITAL_RULES_VERSION = "digital-1.0";

export function createK9BlitzGameConfiguration(
  mode: GameMode,
  contentVersion = "launch-1.0",
): GameConfiguration {
  return {
    mode,
    minimumPlayers: K9_BLITZ_PLAYER_RULES_V1.minimumPlayers,
    maximumPlayers: K9_BLITZ_PLAYER_RULES_V1.maximumPlayers,
    dogAssignmentMode: K9_BLITZ_PLAYER_RULES_V1.dogAssignmentMode,
    allowReconnect: K9_BLITZ_PLAYER_RULES_V1.modes[mode].reconnect,
    rulesVersion: K9_BLITZ_DIGITAL_RULES_VERSION,
    contentVersion,
    pawnIds: K9_BLITZ_PLAYER_RULES_V1.pawnIds,
    uniqueDogAssignments: K9_BLITZ_PLAYER_RULES_V1.uniqueDogAssignments,
    rulesProfileId: K9_BLITZ_PLAYER_RULES_V1.id,
    ruleProvenance: K9_BLITZ_PLAYER_RULES_V1.provenance,
    turnOrderMode: K9_BLITZ_PLAYER_RULES_V1.turnOrderMode,
    trainerCardVisibility: K9_BLITZ_PLAYER_RULES_V1.trainerCardVisibility,
    victoryMode: K9_BLITZ_PLAYER_RULES_V1.victoryMode,
  };
}

/**
 * The authoritative turn engine remains responsible for storing/advancing the
 * active player. This helper only resolves the owner-authorized v1 ordering
 * policy into a stable player-id sequence for engine initialization.
 */
export function getSeatOrderedPlayerIds(players: readonly Player[]): readonly string[] {
  return [...players]
    .sort((left, right) => left.seatNumber - right.seatNumber)
    .map((player) => player.id);
}

export function getStartingPlayerId(players: readonly Player[]): string {
  const ordered = getSeatOrderedPlayerIds(players);
  const first = ordered[K9_BLITZ_PLAYER_RULES_V1.startingSeatNumber - 1];
  if (!first) {
    throw new Error("K9 Blitz requires at least one seated player to resolve turn order.");
  }
  return first;
}
