import type { DiceView, IntentAvailability, PlayerIntent, TurnView } from "../model";

interface TurnControlsProps {
  turn: TurnView;
  dice: DiceView;
  legalIntents: IntentAvailability;
  disabled: boolean;
  onIntent: (intent: PlayerIntent) => void | Promise<void>;
}

function Die({ value, rolling }: { value: number | undefined; rolling: boolean }) {
  return <span className={`die ${rolling ? "rolling" : ""}`} aria-label={value ? `Die showing ${value}` : "Die not rolled"}>{value ?? "?"}</span>;
}

export function TurnControls({ turn, dice, legalIntents, disabled, onIntent }: TurnControlsProps) {
  const total = dice.values ? dice.values[0] + dice.values[1] : null;
  return (
    <section className="turn-controls" aria-live="polite">
      <div className="turn-copy">
        <p className="eyebrow">Turn {turn.number}</p>
        <h2>{turn.prompt}</h2>
        {turn.detail && <p>{turn.detail}</p>}
      </div>

      <div className="dice-cluster" aria-label={total ? `Dice total ${total}` : "Dice ready"}>
        <Die value={dice.values?.[0]} rolling={dice.status === "rolling"} />
        <Die value={dice.values?.[1]} rolling={dice.status === "rolling"} />
        {total !== null && <strong className="dice-total">Total {total}</strong>}
      </div>

      <div className="primary-actions">
        {legalIntents.rollDice && (
          <button className="primary-button" disabled={disabled || dice.status === "rolling"} onClick={() => void onIntent({ type: "ROLL_DICE" })}>
            {dice.status === "rolling" ? "Rolling…" : "Roll dice"}
          </button>
        )}
        {legalIntents.drawCard && (
          <button className="primary-button" disabled={disabled} onClick={() => void onIntent({ type: "DRAW_CARD", deckId: "trainer" })}>
            Draw Trainer Card
          </button>
        )}
        {legalIntents.endTurn && (
          <button className="primary-button" disabled={disabled} onClick={() => void onIntent({ type: "END_TURN" })}>
            End turn
          </button>
        )}
      </div>
    </section>
  );
}
