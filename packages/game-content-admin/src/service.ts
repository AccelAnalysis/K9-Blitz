import { assertPermission } from "./permissions.ts";
import type {
  AuditStore,
  BoardSpaceRegistry,
  Clock,
  ContentStore,
  IdGenerator,
  RuleCapabilityRegistry,
} from "./ports.ts";
import type { AdminActor, AdminAuditEntry, CatalogEntity, ContentType } from "./types.ts";
import { validateForPublication, type PublicationPolicy } from "./validation.ts";

export interface ContentAdministrationDependencies {
  store: ContentStore;
  audit: AuditStore;
  clock: Clock;
  ids: IdGenerator;
  rules: RuleCapabilityRegistry;
  boardSpaces?: BoardSpaceRegistry;
  publicationPolicy?: Partial<PublicationPolicy>;
}

type NewDraft<T extends CatalogEntity> = Omit<
  T,
  "status" | "revision" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy"
>;

type DraftMutation<T extends CatalogEntity> = Partial<
  Omit<T, "id" | "contentType" | "status" | "revision" | "createdAt" | "createdBy">
>;

function clone<T>(value: T): T {
  return structuredClone(value);
}

function editableCopy(entity: CatalogEntity): CatalogEntity {
  if (entity.contentType !== "content-pack") return clone(entity);
  const { publishedAt: _publishedAt, ...draft } = entity;
  return draft as CatalogEntity;
}

export class ContentAdministrationService {
  readonly #deps: ContentAdministrationDependencies;

  constructor(deps: ContentAdministrationDependencies) {
    this.#deps = deps;
  }

  async createDraft<T extends CatalogEntity>(actor: AdminActor, input: NewDraft<T>): Promise<T> {
    this.assertWritePermission(actor, input.contentType);
    if (await this.#deps.store.getLatest(input.id)) throw new Error(`Content ${input.id} already exists.`);

    const now = this.#deps.clock.now();
    const entity = {
      ...clone(input),
      status: "draft",
      revision: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: actor.id,
      updatedBy: actor.id,
    } as T;

    await this.#deps.store.put(entity);
    await this.audit(actor, "CONTENT_CREATED", entity);
    return clone(entity);
  }

  async updateDraft<T extends CatalogEntity>(
    actor: AdminActor,
    id: string,
    changes: DraftMutation<T>,
  ): Promise<T> {
    const current = await this.requireLatest(id);
    this.assertWritePermission(actor, current.contentType);
    if (current.status !== "draft") {
      throw new Error(`Content ${id} is ${current.status}; start a new revision before editing.`);
    }

    const next = {
      ...current,
      ...clone(changes),
      id: current.id,
      contentType: current.contentType,
      status: "draft",
      revision: current.revision + 1,
      createdAt: current.createdAt,
      createdBy: current.createdBy,
      updatedAt: this.#deps.clock.now(),
      updatedBy: actor.id,
    } as T;

    await this.#deps.store.put(next);
    await this.audit(actor, "CONTENT_UPDATED", next, current.revision);
    return clone(next);
  }

  async startRevision<T extends CatalogEntity>(actor: AdminActor, id: string): Promise<T> {
    const current = await this.requireLatest(id);
    this.assertWritePermission(actor, current.contentType);
    if (current.status !== "published") {
      throw new Error(`Content ${id} must be published before a new editable revision can be started.`);
    }

    const next = {
      ...editableCopy(current),
      status: "draft",
      revision: current.revision + 1,
      updatedAt: this.#deps.clock.now(),
      updatedBy: actor.id,
    } as T;

    await this.#deps.store.put(next);
    await this.audit(actor, "CONTENT_REVISION_STARTED", next, current.revision);
    return clone(next);
  }

  async publish<T extends CatalogEntity>(actor: AdminActor, id: string): Promise<T> {
    assertPermission(actor.role, "content:publish");
    const current = await this.requireLatest(id);
    if (current.status !== "draft") throw new Error(`Content ${id} is not a draft.`);

    const validationDependencies = {
      store: this.#deps.store,
      rules: this.#deps.rules,
      ...(this.#deps.boardSpaces ? { boardSpaces: this.#deps.boardSpaces } : {}),
      ...(this.#deps.publicationPolicy ? { policy: this.#deps.publicationPolicy } : {}),
    };
    await validateForPublication(current, validationDependencies);

    const now = this.#deps.clock.now();
    const next = {
      ...current,
      status: "published",
      revision: current.revision + 1,
      updatedAt: now,
      updatedBy: actor.id,
      ...(current.contentType === "content-pack" ? { publishedAt: now } : {}),
    } as T;

    await this.#deps.store.put(next);
    await this.audit(actor, "CONTENT_PUBLISHED", next, current.revision);
    return clone(next);
  }

  async retire<T extends CatalogEntity>(actor: AdminActor, id: string): Promise<T> {
    assertPermission(actor.role, "content:retire");
    const current = await this.requireLatest(id);
    if (current.status !== "published") {
      throw new Error(`Only published content can be retired; ${id} is ${current.status}.`);
    }

    const next = {
      ...current,
      status: "retired",
      revision: current.revision + 1,
      updatedAt: this.#deps.clock.now(),
      updatedBy: actor.id,
    } as T;

    await this.#deps.store.put(next);
    await this.audit(actor, "CONTENT_RETIRED", next, current.revision);
    return clone(next);
  }

  async getPublishedRevision(id: string, revision: number): Promise<CatalogEntity> {
    const entity = await this.#deps.store.getRevision({ id, revision });
    if (!entity || entity.status !== "published") {
      throw new Error(`Published content ${id}@${revision} was not found.`);
    }
    return clone(entity);
  }

  async getAuditLog(actor: AdminActor): Promise<readonly AdminAuditEntry[]> {
    assertPermission(actor.role, "audit:read");
    return this.#deps.audit.list();
  }

  private assertWritePermission(actor: AdminActor, contentType: ContentType): void {
    if (contentType === "game-setting") {
      assertPermission(actor.role, "configuration:write");
      return;
    }
    if (contentType === "asset-inventory-item") {
      assertPermission(actor.role, "inventory:write");
      return;
    }
    assertPermission(actor.role, "content:draft:write");
  }

  private async requireLatest(id: string): Promise<CatalogEntity> {
    const entity = await this.#deps.store.getLatest(id);
    if (!entity) throw new Error(`Content ${id} was not found.`);
    return entity;
  }

  private async audit(
    actor: AdminActor,
    action: AdminAuditEntry["action"],
    entity: CatalogEntity,
    beforeRevision?: number,
  ): Promise<void> {
    const entry: AdminAuditEntry = {
      id: this.#deps.ids.nextId("audit"),
      occurredAt: this.#deps.clock.now(),
      actorId: actor.id,
      actorRole: actor.role,
      action,
      entityId: entity.id,
      entityType: entity.contentType,
      afterRevision: entity.revision,
      ...(beforeRevision === undefined ? {} : { beforeRevision }),
    };
    await this.#deps.audit.append(entry);
  }
}
