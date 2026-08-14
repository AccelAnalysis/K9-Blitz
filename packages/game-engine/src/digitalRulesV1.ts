import type { DomainEffectResolution, DomainState, RulesRuntime } from "./contracts.ts";
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
 * Trainer Cards resolve immediately and then live in the discard pile. The
 * underlying rules implementation records the draw before effects resolve;
 * this wrapper normalizes the post-effect state so a physical card instance
 * never exists in both a player's hand and a discard pile.
 */
export const K9_BLITZ_DIGITAL_RULES_V1: RulesRuntime = {
  ...baseRules,
  resolveDomainEffect(domain, effect, context): DomainEffectResolution {
    const resolution = baseRules.resolveDomainEffect(domain, effect, context);
    return {
      ...resolution,
      domain: normalizeImmediateTrainerCards(resolution.domain),
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
