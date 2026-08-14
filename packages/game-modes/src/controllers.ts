import { GameModesError } from "./errors.ts";
import type { LegalAction, RevisionAwarePlayerCommand } from "./types.ts";

export interface PlayerController<
  TCommand extends RevisionAwarePlayerCommand = RevisionAwarePlayerCommand,
> {
  chooseAction(legalActions: readonly LegalAction<TCommand>[]): Promise<TCommand>;
}

export class QueuedHumanController<TCommand extends RevisionAwarePlayerCommand>
  implements PlayerController<TCommand>
{
  #resolver: ((command: TCommand) => void) | undefined;
  #legalTypes = new Set<string>();

  chooseAction(legalActions: readonly LegalAction<TCommand>[]): Promise<TCommand> {
    if (legalActions.length === 0) {
      return Promise.reject(
        new GameModesError("NO_LEGAL_ACTIONS", "No legal actions are available."),
      );
    }

    this.#legalTypes = new Set(legalActions.map((action) => action.command.type));
    return new Promise<TCommand>((resolve) => {
      this.#resolver = resolve;
    });
  }

  submit(command: TCommand): void {
    if (!this.#resolver) {
      throw new GameModesError("ILLEGAL_COMMAND", "The controller is not awaiting input.");
    }
    if (!this.#legalTypes.has(command.type)) {
      throw new GameModesError(
        "ILLEGAL_COMMAND",
        `${command.type} is not one of the currently legal commands.`,
      );
    }

    const resolve = this.#resolver;
    this.#resolver = undefined;
    this.#legalTypes.clear();
    resolve(command);
  }
}

/**
 * Deterministic baseline CPU controller. It never rolls its own randomness or
 * bypasses the rules engine: it can only choose among legal commands supplied
 * by the authoritative layer. Highest score wins; ties keep legal-action order.
 */
export class ComputerController<TCommand extends RevisionAwarePlayerCommand>
  implements PlayerController<TCommand>
{
  async chooseAction(legalActions: readonly LegalAction<TCommand>[]): Promise<TCommand> {
    if (legalActions.length === 0) {
      throw new GameModesError("NO_LEGAL_ACTIONS", "No legal actions are available.");
    }

    let selected = legalActions[0];
    for (const candidate of legalActions.slice(1)) {
      if ((candidate.scoreHint ?? 0) > (selected?.scoreHint ?? 0)) {
        selected = candidate;
      }
    }

    if (!selected) {
      throw new GameModesError("NO_LEGAL_ACTIONS", "No legal action could be selected.");
    }
    return selected.command;
  }
}
