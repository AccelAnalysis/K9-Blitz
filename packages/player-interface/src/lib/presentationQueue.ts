export interface PresentationStep {
  id: string;
  stateRevision: number;
  kind: "dice" | "pawn" | "card" | "token" | "focus" | "celebration";
  durationMs: number;
}

export class PresentationQueue {
  private queue: PresentationStep[] = [];
  private active: PresentationStep | undefined;

  enqueue(...steps: PresentationStep[]): void {
    this.queue.push(...steps);
    if (!this.active) this.active = this.queue.shift();
  }

  current(): PresentationStep | undefined {
    return this.active;
  }

  completeCurrent(): PresentationStep | undefined {
    this.active = this.queue.shift();
    return this.active;
  }

  pendingCount(): number {
    return this.queue.length + (this.active ? 1 : 0);
  }

  /** Drop stale visual work after reconnect/snapshot replacement. Never changes authoritative game state. */
  recoverToRevision(authoritativeRevision: number): void {
    if (this.active && this.active.stateRevision < authoritativeRevision) this.active = undefined;
    this.queue = this.queue.filter((step) => step.stateRevision >= authoritativeRevision);
    if (!this.active) this.active = this.queue.shift();
  }

  clear(): void {
    this.queue = [];
    this.active = undefined;
  }
}
