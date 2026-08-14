import type { ModalView, PlayerIntent } from "../model";

interface EventModalProps {
  modal: ModalView;
  onIntent: (intent: PlayerIntent) => void | Promise<void>;
}

export function EventModal({ modal, onIntent }: EventModalProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className={`event-modal modal-${modal.kind}`} role="dialog" aria-modal="true" aria-labelledby="event-title">
        <div className="modal-icon" aria-hidden="true">
          {modal.kind === "trainer-card" ? "🃏" : modal.kind === "token" ? "🐾" : "⭐"}
        </div>
        {modal.eyebrow && <p className="eyebrow">{modal.eyebrow}</p>}
        <h2 id="event-title">{modal.title}</h2>
        <p className="modal-body">{modal.body}</p>

        {modal.choices && modal.choices.length > 0 && (
          <div className="choice-list">
            {modal.choices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                disabled={choice.disabled ?? false}
                onClick={() => void onIntent({ type: "SELECT_CHOICE", modalId: modal.id, choiceId: choice.id })}
              >
                <strong>{choice.label}</strong>
                {choice.description && <span>{choice.description}</span>}
              </button>
            ))}
          </div>
        )}

        {modal.dismissible && (
          <button className="secondary-button" type="button" onClick={() => void onIntent({ type: "DISMISS_MODAL", modalId: modal.id })}>
            Close
          </button>
        )}
      </section>
    </div>
  );
}
