import { GameModesError } from "./errors.js";
import type { LegalAction, TypedCommand } from "./types.js";

export interface PlayerController<TCommand extends TypedCommand = TypedCommand> {
  chooseAction(legalActions: readonly LegalAction<TCommand>[]): Promise<TCommand>;
}

export class QueuedHumanController<TCommand extends TypedCommand>
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

export class ComputerController<TCommand extends TypedCommand>
  implements PlayerController<TCommand>
{
  constructor(private readonly tieBreaker: () => number = Math.random) {}

  async chooseAction(legalActions: readonly LegalAction<TCommand>[]): Promise<TCommand> {
    if (legalActions.length === 0) {
      throw new GameModesError("NO_LEGAL_ACTIONS", "No legal actions are available.");
    }

    const highestScore = Math.max(...legalActions.map((action) => action.scoreHint ?? 0));
    const best = legalActions.filter((action) => (action.scoreHint ?? 0) === highestScore);
    const index = Math.min(
      best.length - 1,
      Math.max(0, Math.floor(this.tieBreaker() * best.length)),
    );
    const selected = best[index];
    if (!selected) {
      throw new GameModesError("NO_LEGAL_ACTIONS", "No legal action could be selected.");
    }
    return selected.command;
  }
}
