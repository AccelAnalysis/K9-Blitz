import type {
  DomainEffect,
  DomainEffectResolution,
  DomainState,
  PlayerState,
  RulesRuntime,
} from "./contracts.ts";
import {
  createK9BlitzDigitalGameInput,
  createK9BlitzDigitalTokenSystem,
  createK9BlitzDigitalTrainerDeck,
  K9_BLITZ_DIGITAL_CONTENT_VERSION,
  K9_BLITZ_DIGITAL_RULES_V1 as baseRules,
  K9_BLITZ_DIGITAL_RULES_VERSION,
  K9_BLITZ_LAST_SPACE_INDEX,
  K9_BLITZ_MAX_COMPETITION,
  K9_BLITZ_PAW_TOKEN_COUNT,
  K9_BLITZ_PAW_TOKEN_IDS,
  K9_BLITZ_TRAINER_CARD_IDS,
  type K9BlitzDigitalPlayerSetup,
} from "./k9BlitzDigitalRules.ts";

export {
  createK9BlitzDigitalGameInput,
  createK9BlitzDigitalTokenSystem,
  createK9BlitzDigitalTrainerDeck,
  K9_BLITZ_DIGITAL_CONTENT_VERSION,
  K9_BLITZ_DIGITAL_RULES_VERSION,
  K9_BLITZ_LAST_SPACE_INDEX,
  K9_BLITZ_MAX_COMPETITION,
  K9_BLITZ_PAW_TOKEN_COUNT,
  K9_BLITZ_PAW_TOKEN_IDS,
  K9_BLITZ_TRAINER_CARD_IDS,
  type K9BlitzDigitalPlayerSetup,
};

/**
 * Owner-authorized K9 Blitz Digital Rules v1.0.
 *
 * This wrapper makes three product-level decisions explicit on top of the
 * reusable base implementation:
 *
 * 1. Trainer Cards resolve immediately and then live only in discard state.
 * 2. Card-driven movement relocates the pawn but does not trigger a second
 *    landing-space effect during the same card resolution.
 * 3. Paw Tokens are digital score markers. The state starts with 48 concrete
 *    instances to mirror the tabletop bag, but more unique virtual instances
 *    are created if every existing marker is already held so an earned award
 *    is never denied by component exhaustion.
 */
export const K9_BLITZ_DIGITAL_RULES_V1: RulesRuntime = {
  ...baseRules,
  resolveDomainEffect(domain, effect, context): DomainEffectResolution {
    const preparedDomain = ensureDigitalTokenCapacity(domain, effect);
    const resolution = baseRules.resolveDomainEffect(preparedDomain, effect, context);
    return {
      ...resolution,
      domain: normalizeImmediateTrainerCards(resolution.domain),
      ...(effect.effectType === "MOVE_RELATIVE" ? { followUpEffects: [] } : {}),
    };
  },
};

function normalizeImmediateTrainerCards(domain: Readonly<DomainState>): DomainState {
  const discarded = new Set<string>();
  for (const deck of Object.values(domain.decks)) {
    for (const cardId of deck.discardPile) discarded.add(cardId);
  }
  if (discarded.size === 0) return domain;

  return {
    ...domain,
    players: domain.players.map((player) => ({
      ...player,
      cardIds: player.cardIds.filter((cardId) => !discarded.has(cardId)),
    })),
  };
}

function ensureDigitalTokenCapacity(
  domain: Readonly<DomainState>,
  effect: DomainEffect,
): DomainState {
  if (effect.effectType !== "GAIN_PAW_TOKENS") return domain;
  const requested = effect.payload.amount;
  if (typeof requested !== "number" || !Number.isInteger(requested) || requested <= 0) return domain;

  const available = domain.tokens.bag.length + domain.tokens.discarded.length;
  const shortfall = requested - available;
  if (shortfall <= 0) return domain;

  const used = allTokenIds(domain);
  const generated: string[] = [];
  let sequence = used.size + 1;
  while (generated.length < shortfall) {
    const candidate = `paw-token-digital-${sequence}`;
    sequence += 1;
    if (used.has(candidate)) continue;
    used.add(candidate);
    generated.push(candidate);
  }

  return {
    ...domain,
    tokens: {
      ...domain.tokens,
      bag: [...domain.tokens.bag, ...generated],
    },
  };
}

function allTokenIds(domain: Readonly<DomainState>): Set<string> {
  const ids = new Set<string>([
    ...domain.tokens.bag,
    ...domain.tokens.discarded,
    ...domain.tokens.removed,
  ]);
  for (const player of domain.players as readonly PlayerState[]) {
    for (const tokenId of player.tokenIds) ids.add(tokenId);
  }
  return ids;
}
