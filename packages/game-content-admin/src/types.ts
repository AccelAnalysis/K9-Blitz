import type { TrainerCardDefinition as CoreTrainerCardDefinition } from "../../core-game/src/cards.js";
import type { CompetitionTrackDefinition as CoreCompetitionTrackDefinition } from "../../core-game/src/competition.js";
import type { DogDefinition as CoreDogDefinition } from "../../core-game/src/dogs.js";
import type { BoardSpaceMechanicsDefinition as CoreBoardSpaceMechanicsDefinition } from "../../core-game/src/spaces.js";
import type { TokenDefinition as CoreTokenDefinition } from "../../core-game/src/tokens.js";

export type ContentStatus = "draft" | "published" | "retired";
export type VerificationStatus = "unverified" | "source-verified" | "qa-verified";

export type ContentType =
  | "dog"
  | "trainer-deck"
  | "trainer-card"
  | "token"
  | "board-space-content"
  | "challenge"
  | "reward"
  | "penalty"
  | "competition"
  | "help"
  | "game-setting"
  | "media-asset"
  | "content-pack"
  | "ruleset"
  | "asset-inventory-item";

export type AdminRole =
  | "player"
  | "content_editor"
  | "content_publisher"
  | "game_admin"
  | "system_admin";

export type AdminPermission =
  | "content:read"
  | "content:draft:write"
  | "content:publish"
  | "content:retire"
  | "configuration:write"
  | "inventory:write"
  | "audit:read"
  | "administration:manage";

export type RuleCapabilityKind =
  | "trainer-card-effect"
  | "dog-special-ability"
  | "board-space-resolver"
  | "challenge-resolver"
  | "reward-resolver"
  | "penalty-resolver"
  | "competition-requirement";

export interface AdminActor {
  id: string;
  role: AdminRole;
}

export interface ContentRef {
  id: string;
  revision: number;
}

export interface ContentMetadata {
  id: string;
  contentType: ContentType;
  slug: string;
  title: string;
  status: ContentStatus;
  verificationStatus: VerificationStatus;
  revision: number;
  tags: readonly string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

/** Versioned administrative wrapper around the authoritative core-game dog definition. */
export interface DogContentDefinition extends ContentMetadata {
  contentType: "dog";
  runtime: CoreDogDefinition;
  description?: string;
}

export interface TrainerDeckContentDefinition extends ContentMetadata {
  contentType: "trainer-deck";
  deckId: string;
  description?: string;
  cardBackAssetId?: string;
}

/** Versioned administrative wrapper around the authoritative core-game Trainer Card definition. */
export interface TrainerCardContentDefinition extends ContentMetadata {
  contentType: "trainer-card";
  runtime: CoreTrainerCardDefinition;
  rulesText?: string;
}

/** Versioned administrative wrapper around the authoritative core-game token definition. */
export interface TokenContentDefinition extends ContentMetadata {
  contentType: "token";
  runtime: CoreTokenDefinition;
  rulesText?: string;
}

/** Versioned content for one board-space mechanics record owned at runtime by core-game. */
export interface BoardSpaceContentDefinition extends ContentMetadata {
  contentType: "board-space-content";
  runtime: CoreBoardSpaceMechanicsDefinition;
  helpContentId?: string;
  artworkAssetId?: string;
}

export interface ChallengeContentDefinition extends ContentMetadata {
  contentType: "challenge";
  description: string;
  instructionHelpContentId?: string;
  resolverId: string;
  parameters?: Readonly<Record<string, unknown>>;
}

export interface RewardContentDefinition extends ContentMetadata {
  contentType: "reward";
  description?: string;
  resolverId: string;
  parameters?: Readonly<Record<string, unknown>>;
}

export interface PenaltyContentDefinition extends ContentMetadata {
  contentType: "penalty";
  description?: string;
  resolverId: string;
  parameters?: Readonly<Record<string, unknown>>;
}

/** Versioned administrative wrapper around the authoritative core-game competition track definition. */
export interface CompetitionContentDefinition extends ContentMetadata {
  contentType: "competition";
  runtime: CoreCompetitionTrackDefinition;
  description?: string;
}

export interface HelpContentDefinition extends ContentMetadata {
  contentType: "help";
  category: "rule" | "space" | "card" | "token" | "competition" | "tutorial" | "glossary";
  shortText: string;
  fullText: string;
  imageAssetIds: readonly string[];
  relatedContentIds: readonly string[];
}

export interface GameSettingDefinition extends ContentMetadata {
  contentType: "game-setting";
  key: string;
  scope: "global" | "ruleset" | "content-pack";
  value: unknown;
  description?: string;
}

export interface MediaAssetDefinition extends ContentMetadata {
  contentType: "media-asset";
  assetType: "board" | "dog" | "card" | "token" | "icon" | "ui" | "rulebook" | "logo" | "other";
  uri: string;
  mimeType?: string;
  width?: number;
  height?: number;
  altText?: string;
  sourceProvenance?: string;
  rightsStatus: "unknown" | "confirmed" | "not-required";
}

export interface ContentPackDefinition extends ContentMetadata {
  contentType: "content-pack";
  version: string;
  compatibleRulesetIds: readonly string[];
  entities: readonly ContentRef[];
  publishedAt?: string;
}

export interface RulesetDefinition extends ContentMetadata {
  contentType: "ruleset";
  version: string;
  contentPacks: readonly ContentRef[];
  effectiveAt?: string;
}

export interface AssetInventoryItem extends ContentMetadata {
  contentType: "asset-inventory-item";
  componentCategory:
    | "board"
    | "rulebook"
    | "trainer-card"
    | "dog-card"
    | "token"
    | "pawn"
    | "dice"
    | "player-aid"
    | "competition-track"
    | "packaging-logo"
    | "font"
    | "illustration"
    | "other";
  physicalReferenceStatus: "missing" | "reference-only" | "verified";
  frontImageStatus: "not-applicable" | "missing" | "reference-only" | "verified";
  backImageStatus: "not-applicable" | "missing" | "reference-only" | "verified";
  rulesCaptured: boolean;
  digitalArtworkComplete: boolean;
  contentRecordComplete: boolean;
  qaVerified: boolean;
  rightsStatus: "unknown" | "confirmed" | "not-required";
  notes?: string;
}

export type CatalogEntity =
  | DogContentDefinition
  | TrainerDeckContentDefinition
  | TrainerCardContentDefinition
  | TokenContentDefinition
  | BoardSpaceContentDefinition
  | ChallengeContentDefinition
  | RewardContentDefinition
  | PenaltyContentDefinition
  | CompetitionContentDefinition
  | HelpContentDefinition
  | GameSettingDefinition
  | MediaAssetDefinition
  | ContentPackDefinition
  | RulesetDefinition
  | AssetInventoryItem;

export interface AdminAuditEntry {
  id: string;
  occurredAt: string;
  actorId: string;
  actorRole: AdminRole;
  action:
    | "CONTENT_CREATED"
    | "CONTENT_UPDATED"
    | "CONTENT_REVISION_STARTED"
    | "CONTENT_PUBLISHED"
    | "CONTENT_RETIRED";
  entityId: string;
  entityType: ContentType;
  beforeRevision?: number;
  afterRevision: number;
}
