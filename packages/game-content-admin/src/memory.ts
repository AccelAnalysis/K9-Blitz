import type { AuditStore, ContentStore } from "./ports.ts";
import type { AdminAuditEntry, CatalogEntity, ContentRef } from "./types.ts";

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class InMemoryContentStore implements ContentStore {
  readonly #revisions = new Map<string, CatalogEntity[]>();

  async getLatest(id: string): Promise<CatalogEntity | undefined> {
    const revisions = this.#revisions.get(id);
    const latest = revisions?.at(-1);
    return latest ? clone(latest) : undefined;
  }

  async getRevision(ref: ContentRef): Promise<CatalogEntity | undefined> {
    const entity = this.#revisions.get(ref.id)?.find((candidate) => candidate.revision === ref.revision);
    return entity ? clone(entity) : undefined;
  }

  async listRevisions(id: string): Promise<readonly CatalogEntity[]> {
    return clone(this.#revisions.get(id) ?? []);
  }

  async listLatest(): Promise<readonly CatalogEntity[]> {
    const latest = [...this.#revisions.values()]
      .map((revisions) => revisions.at(-1))
      .filter((entity): entity is CatalogEntity => entity !== undefined);
    return clone(latest);
  }

  async put(entity: CatalogEntity): Promise<void> {
    const revisions = this.#revisions.get(entity.id) ?? [];
    if (revisions.some((candidate) => candidate.revision === entity.revision)) {
      throw new Error(`Revision ${entity.revision} already exists for ${entity.id}.`);
    }
    const previous = revisions.at(-1);
    if (previous && entity.revision !== previous.revision + 1) {
      throw new Error(`Revision ${entity.revision} is not sequential for ${entity.id}.`);
    }
    this.#revisions.set(entity.id, [...revisions, clone(entity)]);
  }
}

export class InMemoryAuditStore implements AuditStore {
  readonly #entries: AdminAuditEntry[] = [];

  async append(entry: AdminAuditEntry): Promise<void> {
    this.#entries.push(clone(entry));
  }

  async list(): Promise<readonly AdminAuditEntry[]> {
    return clone(this.#entries);
  }
}
