import type { GameConfiguration, GameMode, Player } from "./types.ts";

export const K9_BLITZ_DIGITAL_RULES_V1_PLAYER_PROFILE = {
  id: "k9-blitz-digital-1.0",
  contentId: "launch-1.0",
  provenance: "owner_authorized_digital",
  launchSupportedModes: ["local_pass_and_play"],
  minimumPlayers: 2,
  maximumPlayers: 4,
  pawnIds: ["red", "blue", "green", "yellow"],
  dogAssignmentMode: "player_choice",
  uniqueDogAssignments: false,
  turnOrderMode: "seat_order",
  startingSeatNumber: 1,
  trainerCardVisibility: "public",
  victoryMode: "first_to_finish",
  computerSeatsAllowed: true,
} as const;

export function createK9BlitzGameConfiguration(
  mode: GameMode,
  contentVersion = K9_BLITZ_DIGITAL_RULES_V1_PLAYER_PROFILE.contentId,
): GameConfiguration {
  return {
    mode,
    minimumPlayers: K9_BLITZ_DIGITAL_RULES_V1_PLAYER_PROFILE.minimumPlayers,
    maximumPlayers: K9_BLITZ_DIGITAL_RULES_V1_PLAYER_PROFILE.maximumPlayers,
    dogAssignmentMode: K9_BLITZ_DIGITAL_RULES_V1_PLAYER_PROFILE.dogAssignmentMode,
    allowReconnect: mode === "online_private",
    rulesVersion: K9_BLITZ_DIGITAL_RULES_V1_PLAYER_PROFILE.id,
    contentVersion,
    pawnIds: K9_BLITZ_DIGITAL_RULES_V1_PLAYER_PROFILE.pawnIds,
    uniqueDogAssignments: K9_BLITZ_DIGITAL_RULES_V1_PLAYER_PROFILE.uniqueDogAssignments,
    rulesProfileId: K9_BLITZ_DIGITAL_RULES_V1_PLAYER_PROFILE.id,
    ruleProvenance: K9_BLITZ_DIGITAL_RULES_V1_PLAYER_PROFILE.provenance,
    turnOrderMode: K9_BLITZ_DIGITAL_RULES_V1_PLAYER_PROFILE.turnOrderMode,
    trainerCardVisibility: K9_BLITZ_DIGITAL_RULES_V1_PLAYER_PROFILE.trainerCardVisibility,
    victoryMode: K9_BLITZ_DIGITAL_RULES_V1_PLAYER_PROFILE.victoryMode,
  };
}

/**
 * Digital Rules v1 defines turn order as setup order. Player seats are assigned
 * in setup order, so this helper resolves that policy for authoritative engine
 * initialization without allowing the mode layer to advance turns itself.
 */
export function getSeatOrderedPlayerIds(players: readonly Player[]): readonly string[] {
  return [...players]
    .sort((left, right) => left.seatNumber - right.seatNumber)
    .map((player) => player.id);
}

export function getStartingPlayerId(players: readonly Player[]): string {
  const ordered = getSeatOrderedPlayerIds(players);
  const first = ordered[K9_BLITZ_DIGITAL_RULES_V1_PLAYER_PROFILE.startingSeatNumber - 1];
  if (!first) {
    throw new Error("K9 Blitz requires at least one seated player to resolve turn order.");
  }
  return first;
}

export function isLaunchSupportedMode(mode: GameMode): boolean {
  return K9_BLITZ_DIGITAL_RULES_V1_PLAYER_PROFILE.launchSupportedModes.some(
    (candidate) => candidate === mode,
  );
}
