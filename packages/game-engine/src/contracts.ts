export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export type GameStatus = "lobby" | "ready" | "active" | "paused" | "completed" | "abandoned";

export type TurnPhase =
  | "turn_start"
  | "awaiting_roll"
  | "resolving"
  | "awaiting_decision"
  | "awaiting_turn_end"
  | "turn_complete";

export interface DiceResult {
  readonly dice: readonly number[];
  readonly total: number;
}

export interface MovementState {
  readonly from: string;
  readonly path: readonly string[];
  readonly to: string;
  readonly distance: number;
}

export interface StatusEffectState {
  readonly id: string;
  readonly type: string;
  readonly sourceId?: string;
  readonly appliedTurn: number;
  readonly remainingTurns?: number;
  readonly data?: JsonObject;
}

export interface PlayerState {
  readonly id: string;
  readonly displayName: string;
  readonly seatIndex: number;
  readonly boardSpaceId: string;
  readonly dogId: string | null;
  readonly cardIds: readonly string[];
  readonly tokenIds: readonly string[];
  readonly statuses: readonly StatusEffectState[];
  readonly finished: boolean;
  readonly finishOrder?: number;
  readonly data: JsonObject;
}

export interface DogRuntimeState {
  readonly id: string;
  readonly definitionId: string;
  readonly trainingProgress: Readonly<Record<string, number>>;
  readonly completedTraining: readonly string[];
  readonly competitionProgress: Readonly<Record<string, number>>;
  readonly statuses: readonly StatusEffectState[];
  readonly data: JsonObject;
}

export interface DeckState {
  readonly id: string;
  readonly drawPile: readonly string[];
  readonly discardPile: readonly string[];
  readonly data: JsonObject;
}

export interface TokenSystemState {
  readonly bag: readonly string[];
  readonly discarded: readonly string[];
  readonly removed: readonly string[];
  readonly data: JsonObject;
}

export interface CompetitionState {
  readonly participants: Readonly<Record<string, JsonObject>>;
  readonly activeCompetition: JsonObject | null;
  readonly data: JsonObject;
}

export interface DomainState {
  readonly players: readonly PlayerState[];
  readonly dogs: Readonly<Record<string, DogRuntimeState>>;
  readonly decks: Readonly<Record<string, DeckState>>;
  readonly tokens: TokenSystemState;
  readonly competition: CompetitionState;
  readonly extensions: Readonly<Record<string, JsonValue>>;
}

export interface RuleEffectSource {
  readonly kind: "space" | "card" | "token" | "dog" | "competition" | "system" | "other";
  readonly id: string;
}

export interface ChoiceOption {
  readonly id: string;
  readonly labelKey: string;
  readonly effects: readonly RuleEffect[];
}

export interface ChoiceEffect {
  readonly type: "CHOICE";
  readonly targetPlayerId?: string;
  readonly promptKey: string;
  readonly options: readonly ChoiceOption[];
  readonly source?: RuleEffectSource;
}

export interface DomainEffect {
  readonly type: "DOMAIN";
  readonly effectType: string;
  readonly payload: JsonObject;
  readonly targetPlayerId?: string;
  readonly source?: RuleEffectSource;
}

export type RuleEffect = ChoiceEffect | DomainEffect;

export interface PendingRuleEffect {
  readonly id: string;
  readonly effect: RuleEffect;
  readonly targetPlayerId: string;
  readonly status: "pending" | "waiting_for_player";
}

export interface TurnActionRecord {
  readonly commandId: string;
  readonly type: GameCommand["type"];
}

export interface TurnState {
  readonly id: string;
  readonly number: number;
  readonly round: number;
  readonly playerId: string;
  readonly phase: TurnPhase;
  readonly startedAt: string;
  readonly dice?: DiceResult;
  readonly movement?: MovementState;
  readonly landedSpaceId?: string;
  readonly pendingDecisionEffectId?: string;
  readonly completedActions: readonly TurnActionRecord[];
  readonly canEndTurn: boolean;
}

export interface WinnerState {
  readonly playerId: string;
  readonly dogId?: string | null;
  readonly determinedOnTurn: number;
  readonly reason: string;
  readonly data?: JsonObject;
}

export type GameEventType =
  | "GAME_STARTED"
  | "TURN_STARTED"
  | "DICE_ROLLED"
  | "PAWN_MOVED"
  | "SPACE_LANDED"
  | "RULE_EFFECT_APPLIED"
  | "DECISION_REQUESTED"
  | "DECISION_RESOLVED"
  | "TURN_ENDED"
  | "GAME_PAUSED"
  | "GAME_RESUMED"
  | "GAME_COMPLETED"
  | "DOMAIN_EVENT";

export interface GameEvent {
  readonly id: string;
  readonly sequence: number;
  readonly type: GameEventType;
  readonly commandId: string;
  readonly occurredAt: string;
  readonly stateRevision: number;
  readonly playerId?: string;
  readonly payload: JsonObject;
}

export interface CommandReceipt {
  readonly commandId: string;
  readonly expectedRevision: number;
  readonly committedRevision: number;
  readonly eventIds: readonly string[];
}

export interface GameState {
  readonly gameId: string;
  readonly rulesetId: string;
  readonly rulesVersion: string;
  readonly contentVersion: string;
  readonly revision: number;
  readonly status: GameStatus;
  readonly turnOrder: readonly string[];
  readonly currentPlayerId: string | null;
  readonly turnNumber: number;
  readonly roundNumber: number;
  readonly turn: TurnState | null;
  readonly domain: DomainState;
  readonly pendingEffects: readonly PendingRuleEffect[];
  readonly winner: WinnerState | null;
  readonly history: readonly GameEvent[];
  readonly commandReceipts: readonly CommandReceipt[];
  readonly eventSequence: number;
  readonly effectSequence: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CommandEnvelope {
  readonly commandId: string;
  readonly actorPlayerId: string;
  readonly expectedRevision: number;
}

export interface StartGameCommand extends CommandEnvelope {
  readonly type: "START_GAME";
}

export interface RollDiceCommand extends CommandEnvelope {
  readonly type: "ROLL_DICE";
}

export interface ChooseOptionCommand extends CommandEnvelope {
  readonly type: "CHOOSE_OPTION";
  readonly effectId: string;
  readonly optionId: string;
}

export interface EndTurnCommand extends CommandEnvelope {
  readonly type: "END_TURN";
}

export interface PauseGameCommand extends CommandEnvelope {
  readonly type: "PAUSE_GAME";
}

export interface ResumeGameCommand extends CommandEnvelope {
  readonly type: "RESUME_GAME";
}

export type GameCommand =
  | StartGameCommand
  | RollDiceCommand
  | ChooseOptionCommand
  | EndTurnCommand
  | PauseGameCommand
  | ResumeGameCommand;

export type EngineErrorCode =
  | "GAME_NOT_READY"
  | "GAME_NOT_ACTIVE"
  | "GAME_NOT_PAUSED"
  | "GAME_ALREADY_COMPLETE"
  | "STALE_STATE"
  | "NOT_CURRENT_PLAYER"
  | "COMMAND_ALREADY_PROCESSED"
  | "ACTION_NOT_ALLOWED"
  | "NO_PENDING_DECISION"
  | "INVALID_DECISION"
  | "PENDING_EFFECTS"
  | "RULESET_MISMATCH"
  | "INVALID_RULE_RESULT"
  | "STATE_INVARIANT_VIOLATION";

export interface EngineFailure {
  readonly ok: false;
  readonly code: EngineErrorCode;
  readonly message: string;
  readonly state: GameState;
}

export interface EngineSuccess {
  readonly ok: true;
  readonly state: GameState;
  readonly events: readonly GameEvent[];
}

export type EngineResult = EngineFailure | EngineSuccess;

export interface LegalAction {
  readonly type: "ROLL_DICE" | "CHOOSE_OPTION" | "END_TURN";
  readonly effectId?: string;
  readonly optionIds?: readonly string[];
}

export interface VictoryEvaluation {
  readonly won: boolean;
  readonly winner?: Omit<WinnerState, "determinedOnTurn">;
}

export interface ProposedDomainEvent {
  readonly name: string;
  readonly playerId?: string;
  readonly payload?: JsonObject;
}

export interface DomainEffectResolution {
  readonly domain: DomainState;
  readonly events?: readonly ProposedDomainEvent[];
  readonly followUpEffects?: readonly RuleEffect[];
}

export interface RulesMetadata {
  readonly id: string;
  readonly rulesVersion: string;
  readonly contentVersion: string;
  readonly minPlayers?: number;
  readonly maxPlayers?: number;
}

export interface TurnPolicy {
  readonly endTurn: "manual" | "automatic";
}

export interface RandomSource {
  nextInt(minInclusive: number, maxInclusive: number): number;
}

export interface Clock {
  now(): string;
}

export interface RulesRuntime {
  readonly metadata: RulesMetadata;
  readonly startSpaceId: string;
  readonly turnPolicy: TurnPolicy;

  rollDice(random: RandomSource): DiceResult;

  calculateMovement(
    state: Readonly<GameState>,
    playerId: string,
    dice: DiceResult,
  ): MovementState;

  getLandingEffects(
    state: Readonly<GameState>,
    playerId: string,
    spaceId: string,
  ): readonly RuleEffect[];

  resolveDomainEffect(
    domain: Readonly<DomainState>,
    effect: DomainEffect,
    context: {
      readonly gameState: Readonly<GameState>;
      readonly targetPlayerId: string;
      readonly random: RandomSource;
    },
  ): DomainEffectResolution;

  evaluateVictory(state: Readonly<GameState>): VictoryEvaluation;

  getNextPlayerId?(
    state: Readonly<GameState>,
    currentPlayerId: string,
  ): string;
}

export interface EngineContext {
  readonly random: RandomSource;
  readonly clock: Clock;
  readonly rules: RulesRuntime;
}

export interface CreateGameInput {
  readonly gameId: string;
  readonly players: readonly Omit<PlayerState, "boardSpaceId">[];
  readonly turnOrder?: readonly string[];
  readonly dogs?: Readonly<Record<string, DogRuntimeState>>;
  readonly decks?: Readonly<Record<string, DeckState>>;
  readonly tokens?: TokenSystemState;
  readonly competition?: CompetitionState;
  readonly extensions?: Readonly<Record<string, JsonValue>>;
}
