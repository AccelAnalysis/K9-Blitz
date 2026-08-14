import type {
  ChooseOptionCommand,
  CommandReceipt,
  CreateGameInput,
  DomainEffect,
  DomainState,
  EngineContext,
  EngineFailure,
  EngineResult,
  GameCommand,
  GameEvent,
  GameEventType,
  GameState,
  JsonObject,
  LegalAction,
  MovementState,
  PendingRuleEffect,
  PlayerState,
  RuleEffect,
  RulesRuntime,
  TurnPhase,
  TurnState,
  WinnerState,
} from "./contracts.ts";
import { collectInvariantViolations } from "./invariants.ts";

// Internal mutation is confined to a private cloned draft. Inputs are never mutated.
type DeepMutable<T> = T extends readonly (infer U)[]
  ? DeepMutable<U>[]
  : T extends object
    ? { -readonly [K in keyof T]: DeepMutable<T[K]> }
    : T;

type MutableGameState = DeepMutable<GameState>;
type MutableDomainState = DeepMutable<DomainState>;

export function createGameState(input: CreateGameInput, context: EngineContext): GameState {
  validatePlayers(input, context.rules);
  const now = context.clock.now();
  const players: PlayerState[] = input.players.map((player) => ({
    ...clone(player),
    boardSpaceId: context.rules.startSpaceId,
  }));
  const turnOrder = input.turnOrder ? [...input.turnOrder] : players.map((player) => player.id);

  const state: GameState = {
    gameId: input.gameId,
    rulesetId: context.rules.metadata.id,
    rulesVersion: context.rules.metadata.rulesVersion,
    contentVersion: context.rules.metadata.contentVersion,
    revision: 0,
    status: "ready",
    turnOrder,
    currentPlayerId: null,
    turnNumber: 0,
    roundNumber: 0,
    turn: null,
    domain: {
      players,
      dogs: clone(input.dogs ?? {}),
      decks: clone(input.decks ?? {}),
      tokens: clone(input.tokens ?? { bag: [], discarded: [], removed: [], data: {} }),
      competition: clone(input.competition ?? { participants: {}, activeCompetition: null, data: {} }),
      extensions: clone(input.extensions ?? {}),
    },
    pendingEffects: [],
    winner: null,
    history: [],
    commandReceipts: [],
    eventSequence: 0,
    effectSequence: 0,
    createdAt: now,
    updatedAt: now,
  };

  const violations = collectInvariantViolations(state);
  if (violations.length > 0) throw new Error(`Invalid initial game state: ${violations.join("; ")}`);
  return state;
}

export function getLegalActions(state: Readonly<GameState>, playerId: string): readonly LegalAction[] {
  if (state.status !== "active" || state.currentPlayerId !== playerId || !state.turn) return [];

  if (state.turn.phase === "awaiting_roll") return [{ type: "ROLL_DICE" }];

  if (state.turn.phase === "awaiting_decision" && state.turn.pendingDecisionEffectId) {
    const pending = state.pendingEffects.find((effect) => effect.id === state.turn?.pendingDecisionEffectId);
    if (
      pending?.effect.type === "CHOICE" &&
      pending.targetPlayerId === playerId &&
      pending.status === "waiting_for_player"
    ) {
      return [{
        type: "CHOOSE_OPTION",
        effectId: pending.id,
        optionIds: pending.effect.options.map((option) => option.id),
      }];
    }
  }

  if (state.turn.phase === "awaiting_turn_end" && state.turn.canEndTurn) {
    return [{ type: "END_TURN" }];
  }

  return [];
}

export function executeCommand(
  state: Readonly<GameState>,
  command: GameCommand,
  context: EngineContext,
): EngineResult {
  const versionFailure = validateRuntimeVersion(state, context.rules);
  if (versionFailure) return fail(state, "RULESET_MISMATCH", versionFailure);

  const existingViolations = collectInvariantViolations(state);
  if (existingViolations.length > 0) {
    return fail(
      state,
      "STATE_INVARIANT_VIOLATION",
      `Input state violates game invariants: ${existingViolations.join("; ")}`,
    );
  }

  if (state.commandReceipts.some((receipt) => receipt.commandId === command.commandId)) {
    return fail(state, "COMMAND_ALREADY_PROCESSED", `Command ${command.commandId} has already been processed.`);
  }

  if (command.expectedRevision !== state.revision) {
    return fail(
      state,
      "STALE_STATE",
      `Expected revision ${command.expectedRevision}; current revision is ${state.revision}.`,
    );
  }

  const draft = mutableClone(state);
  draft.revision = state.revision + 1;
  const emitted: GameEvent[] = [];

  try {
    const dispatchFailure = dispatch(draft, command, context, emitted);
    if (dispatchFailure) return fail(state, dispatchFailure.code, dispatchFailure.message);

    const violations = collectInvariantViolations(draft);
    if (violations.length > 0) {
      return fail(
        state,
        "STATE_INVARIANT_VIOLATION",
        `Command would violate game invariants: ${violations.join("; ")}`,
      );
    }

    const receipt: CommandReceipt = {
      commandId: command.commandId,
      expectedRevision: command.expectedRevision,
      committedRevision: draft.revision,
      eventIds: emitted.map((event) => event.id),
    };
    draft.commandReceipts.push(mutableClone(receipt));
    draft.updatedAt = context.clock.now();

    return { ok: true, state: draft, events: emitted };
  } catch (error) {
    return fail(
      state,
      "INVALID_RULE_RESULT",
      error instanceof Error ? error.message : "Rules runtime produced an invalid result.",
    );
  }
}

function dispatch(
  draft: MutableGameState,
  command: GameCommand,
  context: EngineContext,
  emitted: GameEvent[],
): { code: EngineFailure["code"]; message: string } | null {
  switch (command.type) {
    case "START_GAME":
      return startGame(draft, command.commandId, context, emitted);
    case "ROLL_DICE":
      return rollDice(draft, command, context, emitted);
    case "CHOOSE_OPTION":
      return chooseOption(draft, command, context, emitted);
    case "END_TURN":
      return endTurn(draft, command, context, emitted);
    case "PAUSE_GAME":
      return pauseGame(draft, command.commandId, command.actorPlayerId, context, emitted);
    case "RESUME_GAME":
      return resumeGame(draft, command.commandId, command.actorPlayerId, context, emitted);
  }
}

function startGame(
  draft: MutableGameState,
  commandId: string,
  context: EngineContext,
  emitted: GameEvent[],
): { code: EngineFailure["code"]; message: string } | null {
  if (draft.status === "completed") {
    return { code: "GAME_ALREADY_COMPLETE", message: "A completed game cannot be restarted." };
  }
  if (draft.status !== "ready") {
    return { code: "GAME_NOT_READY", message: `Game must be ready to start; current status is ${draft.status}.` };
  }
  const firstPlayerId = draft.turnOrder[0];
  if (!firstPlayerId) return { code: "INVALID_RULE_RESULT", message: "Game cannot start without a turn order." };

  draft.status = "active";
  draft.roundNumber = 1;
  draft.turnNumber = 1;
  draft.currentPlayerId = firstPlayerId;

  emit(draft, emitted, commandId, context, "GAME_STARTED", undefined, {
    rulesetId: draft.rulesetId,
    rulesVersion: draft.rulesVersion,
    contentVersion: draft.contentVersion,
    turnOrder: [...draft.turnOrder],
  });
  beginTurn(draft, firstPlayerId, commandId, context, emitted);
  return null;
}

function rollDice(
  draft: MutableGameState,
  command: Extract<GameCommand, { type: "ROLL_DICE" }>,
  context: EngineContext,
  emitted: GameEvent[],
): { code: EngineFailure["code"]; message: string } | null {
  const validation = validatePlayerTurnCommand(draft, command.actorPlayerId, "awaiting_roll");
  if (validation) return validation;
  if (!draft.turn) return { code: "ACTION_NOT_ALLOWED", message: "No active turn exists." };
  if (draft.turn.dice) return { code: "ACTION_NOT_ALLOWED", message: "Dice have already been rolled this turn." };

  draft.turn.phase = "resolving";
  const dice = context.rules.rollDice(context.random);
  validateDiceResult(dice);
  draft.turn.dice = mutableClone(dice);
  draft.turn.completedActions.push({ commandId: command.commandId, type: command.type });
  emit(draft, emitted, command.commandId, context, "DICE_ROLLED", command.actorPlayerId, {
    dice: [...dice.dice],
    total: dice.total,
  });

  const movement = context.rules.calculateMovement(draft, command.actorPlayerId, dice);
  validateMovement(draft, command.actorPlayerId, movement);
  const player = draft.domain.players.find((candidate) => candidate.id === command.actorPlayerId);
  if (!player) return { code: "INVALID_RULE_RESULT", message: `Player ${command.actorPlayerId} does not exist.` };

  player.boardSpaceId = movement.to;
  draft.turn.movement = mutableClone(movement);
  draft.turn.landedSpaceId = movement.to;
  emit(draft, emitted, command.commandId, context, "PAWN_MOVED", command.actorPlayerId, {
    from: movement.from,
    path: [...movement.path],
    to: movement.to,
    distance: movement.distance,
  });
  emit(draft, emitted, command.commandId, context, "SPACE_LANDED", command.actorPlayerId, {
    spaceId: movement.to,
  });

  enqueueEffects(draft, context.rules.getLandingEffects(draft, command.actorPlayerId, movement.to), command.actorPlayerId);
  drainEffectQueue(draft, command.commandId, context, emitted);
  if (draft.turn.pendingDecisionEffectId) return null;

  afterResolution(draft, command.actorPlayerId, command.commandId, context, emitted);
  return null;
}

function chooseOption(
  draft: MutableGameState,
  command: ChooseOptionCommand,
  context: EngineContext,
  emitted: GameEvent[],
): { code: EngineFailure["code"]; message: string } | null {
  const validation = validatePlayerTurnCommand(draft, command.actorPlayerId, "awaiting_decision");
  if (validation) return validation;
  if (!draft.turn?.pendingDecisionEffectId) {
    return { code: "NO_PENDING_DECISION", message: "There is no decision waiting to be resolved." };
  }
  if (draft.turn.pendingDecisionEffectId !== command.effectId) {
    return { code: "INVALID_DECISION", message: "The requested effect is not the active decision." };
  }

  const index = draft.pendingEffects.findIndex((pending) => pending.id === command.effectId);
  const pending = index >= 0 ? draft.pendingEffects[index] : undefined;
  if (!pending || pending.effect.type !== "CHOICE" || pending.status !== "waiting_for_player") {
    return { code: "NO_PENDING_DECISION", message: "The requested choice is no longer pending." };
  }
  if (pending.targetPlayerId !== command.actorPlayerId) {
    return { code: "NOT_CURRENT_PLAYER", message: "This decision belongs to a different player." };
  }

  const option = pending.effect.options.find((candidate) => candidate.id === command.optionId);
  if (!option) return { code: "INVALID_DECISION", message: `Unknown option ${command.optionId}.` };

  draft.pendingEffects.splice(index, 1);
  delete draft.turn.pendingDecisionEffectId;
  draft.turn.phase = "resolving";
  draft.turn.completedActions.push({ commandId: command.commandId, type: command.type });
  emit(draft, emitted, command.commandId, context, "DECISION_RESOLVED", command.actorPlayerId, {
    effectId: command.effectId,
    optionId: command.optionId,
  });

  enqueueEffects(draft, option.effects, command.actorPlayerId, 0);
  drainEffectQueue(draft, command.commandId, context, emitted);
  if (draft.turn.pendingDecisionEffectId) return null;

  afterResolution(draft, command.actorPlayerId, command.commandId, context, emitted);
  return null;
}

function endTurn(
  draft: MutableGameState,
  command: Extract<GameCommand, { type: "END_TURN" }>,
  context: EngineContext,
  emitted: GameEvent[],
): { code: EngineFailure["code"]; message: string } | null {
  const validation = validatePlayerTurnCommand(draft, command.actorPlayerId, "awaiting_turn_end");
  if (validation) return validation;
  if (draft.pendingEffects.length > 0) {
    return { code: "PENDING_EFFECTS", message: "Turn cannot end while rule effects remain unresolved." };
  }
  if (!draft.turn?.canEndTurn) return { code: "ACTION_NOT_ALLOWED", message: "The active turn cannot end yet." };

  draft.turn.completedActions.push({ commandId: command.commandId, type: command.type });
  finishTurn(draft, command.commandId, context, emitted);
  return null;
}

function pauseGame(
  draft: MutableGameState,
  commandId: string,
  actorPlayerId: string,
  context: EngineContext,
  emitted: GameEvent[],
): { code: EngineFailure["code"]; message: string } | null {
  if (draft.status !== "active") return { code: "GAME_NOT_ACTIVE", message: "Only an active game can be paused." };
  draft.status = "paused";
  emit(draft, emitted, commandId, context, "GAME_PAUSED", actorPlayerId, {});
  return null;
}

function resumeGame(
  draft: MutableGameState,
  commandId: string,
  actorPlayerId: string,
  context: EngineContext,
  emitted: GameEvent[],
): { code: EngineFailure["code"]; message: string } | null {
  if (draft.status !== "paused") return { code: "GAME_NOT_PAUSED", message: "Only a paused game can be resumed." };
  draft.status = "active";
  emit(draft, emitted, commandId, context, "GAME_RESUMED", actorPlayerId, {});
  return null;
}

function enqueueEffects(
  draft: MutableGameState,
  effects: readonly RuleEffect[],
  defaultTargetPlayerId: string,
  insertAt = draft.pendingEffects.length,
): void {
  const pending: DeepMutable<PendingRuleEffect>[] = effects.map((effect) => {
    draft.effectSequence += 1;
    return {
      id: `effect-${draft.effectSequence}`,
      effect: mutableClone(effect),
      targetPlayerId: effect.targetPlayerId ?? defaultTargetPlayerId,
      status: "pending",
    };
  });
  draft.pendingEffects.splice(insertAt, 0, ...pending);
}

function drainEffectQueue(
  draft: MutableGameState,
  commandId: string,
  context: EngineContext,
  emitted: GameEvent[],
): void {
  while (draft.pendingEffects.length > 0) {
    const pending = draft.pendingEffects[0];
    if (!pending) return;

    if (pending.effect.type === "CHOICE") {
      if (!draft.turn) throw new Error("Choice effect cannot resolve without an active turn.");
      pending.status = "waiting_for_player";
      draft.turn.phase = "awaiting_decision";
      draft.turn.pendingDecisionEffectId = pending.id;
      draft.turn.canEndTurn = false;
      emit(draft, emitted, commandId, context, "DECISION_REQUESTED", pending.targetPlayerId, {
        effectId: pending.id,
        promptKey: pending.effect.promptKey,
        optionIds: pending.effect.options.map((option) => option.id),
        source: pending.effect.source
          ? { kind: pending.effect.source.kind, id: pending.effect.source.id }
          : null,
      });
      return;
    }

    const effect: DomainEffect = pending.effect;
    const resolution = context.rules.resolveDomainEffect(draft.domain, effect, {
      gameState: draft,
      targetPlayerId: pending.targetPlayerId,
      random: context.random,
    });
    draft.domain = mutableClone(resolution.domain) as MutableDomainState;
    draft.pendingEffects.shift();
    emit(draft, emitted, commandId, context, "RULE_EFFECT_APPLIED", pending.targetPlayerId, {
      effectId: pending.id,
      effectType: effect.effectType,
      source: effect.source ? { kind: effect.source.kind, id: effect.source.id } : null,
    });

    for (const domainEvent of resolution.events ?? []) {
      emit(draft, emitted, commandId, context, "DOMAIN_EVENT", domainEvent.playerId, {
        name: domainEvent.name,
        ...(domainEvent.payload ?? {}),
      });
    }

    if (resolution.followUpEffects?.length) {
      enqueueEffects(draft, resolution.followUpEffects, pending.targetPlayerId, 0);
    }
  }
}

function afterResolution(
  draft: MutableGameState,
  activePlayerId: string,
  commandId: string,
  context: EngineContext,
  emitted: GameEvent[],
): void {
  const victory = context.rules.evaluateVictory(draft);
  if (victory.won) {
    if (!victory.winner) throw new Error("Rules runtime reported victory without winner metadata.");
    const winner: WinnerState = {
      ...clone(victory.winner),
      determinedOnTurn: draft.turnNumber,
    };
    draft.winner = mutableClone(winner);
    draft.status = "completed";
    draft.currentPlayerId = null;
    if (draft.turn) {
      draft.turn.phase = "turn_complete";
      draft.turn.canEndTurn = false;
    }
    emit(draft, emitted, commandId, context, "GAME_COMPLETED", winner.playerId, {
      winnerPlayerId: winner.playerId,
      winnerDogId: winner.dogId ?? null,
      reason: winner.reason,
      data: winner.data ?? {},
    });
    return;
  }

  if (!draft.turn) throw new Error("Resolution completed without an active turn.");
  draft.turn.phase = "awaiting_turn_end";
  draft.turn.canEndTurn = true;

  if (context.rules.turnPolicy.endTurn === "automatic") {
    finishTurn(draft, commandId, context, emitted);
  } else if (draft.currentPlayerId !== activePlayerId) {
    throw new Error("Rules runtime changed the current player outside the turn controller.");
  }
}

function finishTurn(
  draft: MutableGameState,
  commandId: string,
  context: EngineContext,
  emitted: GameEvent[],
): void {
  if (!draft.turn || !draft.currentPlayerId) throw new Error("Cannot finish a turn without an active player.");

  const currentPlayerId = draft.currentPlayerId;
  draft.turn.phase = "turn_complete";
  draft.turn.canEndTurn = false;
  emit(draft, emitted, commandId, context, "TURN_ENDED", currentPlayerId, {
    turnNumber: draft.turnNumber,
    roundNumber: draft.roundNumber,
  });

  const nextPlayerId = context.rules.getNextPlayerId
    ? context.rules.getNextPlayerId(draft, currentPlayerId)
    : getDefaultNextPlayerId(draft, currentPlayerId);
  if (!draft.turnOrder.includes(nextPlayerId)) {
    throw new Error(`Rules runtime returned next player ${nextPlayerId}, which is not in turn order.`);
  }

  const currentIndex = draft.turnOrder.indexOf(currentPlayerId);
  const nextIndex = draft.turnOrder.indexOf(nextPlayerId);
  if (nextIndex < currentIndex) draft.roundNumber += 1;

  draft.turnNumber += 1;
  draft.currentPlayerId = nextPlayerId;
  beginTurn(draft, nextPlayerId, commandId, context, emitted);
}

function beginTurn(
  draft: MutableGameState,
  playerId: string,
  commandId: string,
  context: EngineContext,
  emitted: GameEvent[],
): void {
  const turn: TurnState = {
    id: `turn-${draft.turnNumber}`,
    number: draft.turnNumber,
    round: draft.roundNumber,
    playerId,
    phase: "awaiting_roll",
    startedAt: context.clock.now(),
    completedActions: [],
    canEndTurn: false,
  };
  draft.turn = mutableClone(turn);
  emit(draft, emitted, commandId, context, "TURN_STARTED", playerId, {
    turnNumber: draft.turnNumber,
    roundNumber: draft.roundNumber,
  });
}

function emit(
  draft: MutableGameState,
  emitted: GameEvent[],
  commandId: string,
  context: EngineContext,
  type: GameEventType,
  playerId: string | undefined,
  payload: JsonObject,
): void {
  draft.eventSequence += 1;
  const event: GameEvent = {
    id: `event-${draft.eventSequence}`,
    sequence: draft.eventSequence,
    type,
    commandId,
    occurredAt: context.clock.now(),
    stateRevision: draft.revision,
    ...(playerId === undefined ? {} : { playerId }),
    payload: clone(payload),
  };
  draft.history.push(mutableClone(event));
  emitted.push(event);
}

function validatePlayerTurnCommand(
  state: Readonly<GameState>,
  playerId: string,
  requiredPhase: TurnPhase,
): { code: EngineFailure["code"]; message: string } | null {
  if (state.status === "completed") return { code: "GAME_ALREADY_COMPLETE", message: "The game is already complete." };
  if (state.status !== "active") return { code: "GAME_NOT_ACTIVE", message: `Game is not active; current status is ${state.status}.` };
  if (state.currentPlayerId !== playerId) return { code: "NOT_CURRENT_PLAYER", message: `Player ${playerId} does not own the current turn.` };
  if (!state.turn || state.turn.phase !== requiredPhase) {
    return {
      code: "ACTION_NOT_ALLOWED",
      message: `Action requires ${requiredPhase}; current phase is ${state.turn?.phase ?? "none"}.`,
    };
  }
  return null;
}

function validateRuntimeVersion(state: Readonly<GameState>, rules: RulesRuntime): string | null {
  if (
    state.rulesetId === rules.metadata.id &&
    state.rulesVersion === rules.metadata.rulesVersion &&
    state.contentVersion === rules.metadata.contentVersion
  ) return null;

  return `State requires ${state.rulesetId}@rules:${state.rulesVersion}/content:${state.contentVersion}; runtime is ${rules.metadata.id}@rules:${rules.metadata.rulesVersion}/content:${rules.metadata.contentVersion}.`;
}

function validatePlayers(input: CreateGameInput, rules: RulesRuntime): void {
  const count = input.players.length;
  if (count === 0) throw new Error("Game requires at least one player.");
  if (rules.metadata.minPlayers !== undefined && count < rules.metadata.minPlayers) {
    throw new Error(`Ruleset requires at least ${rules.metadata.minPlayers} players; received ${count}.`);
  }
  if (rules.metadata.maxPlayers !== undefined && count > rules.metadata.maxPlayers) {
    throw new Error(`Ruleset allows at most ${rules.metadata.maxPlayers} players; received ${count}.`);
  }

  const ids = input.players.map((player) => player.id);
  if (new Set(ids).size !== ids.length) throw new Error("Player IDs must be unique.");

  if (input.turnOrder) {
    if (input.turnOrder.length !== ids.length || new Set(input.turnOrder).size !== ids.length) {
      throw new Error("Explicit turn order must contain each player exactly once.");
    }
    const known = new Set(ids);
    if (input.turnOrder.some((playerId) => !known.has(playerId))) {
      throw new Error("Explicit turn order contains an unknown player.");
    }
  }
}

function validateDiceResult(dice: { readonly dice: readonly number[]; readonly total: number }): void {
  if (dice.dice.length === 0 || dice.dice.some((value) => !Number.isInteger(value) || value < 1)) {
    throw new Error("Rules runtime returned invalid dice values.");
  }
  const calculated = dice.dice.reduce((sum, value) => sum + value, 0);
  if (calculated !== dice.total) {
    throw new Error(`Rules runtime dice total ${dice.total} does not match values totaling ${calculated}.`);
  }
}

function validateMovement(state: Readonly<GameState>, playerId: string, movement: MovementState): void {
  const player = state.domain.players.find((candidate) => candidate.id === playerId);
  if (!player) throw new Error(`Rules runtime attempted movement for unknown player ${playerId}.`);
  if (movement.from !== player.boardSpaceId) {
    throw new Error(`Movement starts at ${movement.from}, but player is at ${player.boardSpaceId}.`);
  }
  if (!Number.isInteger(movement.distance) || movement.distance < 0) {
    throw new Error("Movement distance must be a non-negative integer.");
  }
  if (movement.distance !== movement.path.length) {
    throw new Error(`Movement distance ${movement.distance} does not match path length ${movement.path.length}.`);
  }
  const destination = movement.path.at(-1) ?? movement.from;
  if (movement.to !== destination) {
    throw new Error(`Movement destination ${movement.to} does not match path destination ${destination}.`);
  }
}

function getDefaultNextPlayerId(state: Readonly<GameState>, currentPlayerId: string): string {
  const currentIndex = state.turnOrder.indexOf(currentPlayerId);
  if (currentIndex < 0 || state.turnOrder.length === 0) {
    throw new Error(`Current player ${currentPlayerId} is not present in turn order.`);
  }
  const next = state.turnOrder[(currentIndex + 1) % state.turnOrder.length];
  if (!next) throw new Error("Turn order did not produce a next player.");
  return next;
}

function fail(
  state: Readonly<GameState>,
  code: EngineFailure["code"],
  message: string,
): EngineFailure {
  return { ok: false, code, message, state: state as GameState };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function mutableClone<T>(value: T): DeepMutable<T> {
  return JSON.parse(JSON.stringify(value)) as DeepMutable<T>;
}
