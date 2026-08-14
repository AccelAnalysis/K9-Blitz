import type {
  AdminAuditEntry,
  CatalogEntity,
  ContentRef,
  RuleCapabilityKind,
} from "./types.ts";

export interface ContentStore {
  getLatest(id: string): Promise<CatalogEntity | undefined>;
  getRevision(ref: ContentRef): Promise<CatalogEntity | undefined>;
  listRevisions(id: string): Promise<readonly CatalogEntity[]>;
  listLatest(): Promise<readonly CatalogEntity[]>;
  put(entity: CatalogEntity): Promise<void>;
}

export interface AuditStore {
  append(entry: AdminAuditEntry): Promise<void>;
  list(): Promise<readonly AdminAuditEntry[]>;
}

export interface Clock {
  now(): string;
}

export interface IdGenerator {
  nextId(prefix: string): string;
}

/** Implemented by the authoritative rules/core layer; admin content can only reference registered IDs. */
export interface RuleCapabilityRegistry {
  hasCapability(kind: RuleCapabilityKind, capabilityId: string): boolean;
}

/** Implemented by the board/map layer so content cannot publish against nonexistent spaces. */
export interface BoardSpaceRegistry {
  hasBoardSpace(boardSpaceId: string): boolean;
}
