export type SpaceActionTrigger = "land" | "pass" | "turn-start" | "turn-end";

/**
 * Action definitions describe what should be resolved without embedding rulebook behavior
 * in board artwork or UI components. Category 3's rules engine owns resolver execution.
 */
export interface BoardSpaceActionDefinition {
  readonly id: string;
  readonly label: string;
  readonly trigger: SpaceActionTrigger;
  readonly resolverId: string;
  readonly parameters?: Readonly<Record<string, unknown>>;
}

export interface BoardSpaceMechanicsDefinition {
  readonly spaceId: string;
  readonly actions: readonly BoardSpaceActionDefinition[];
}

export function getTriggeredSpaceActions(
  space: BoardSpaceMechanicsDefinition,
  trigger: SpaceActionTrigger,
): readonly BoardSpaceActionDefinition[] {
  return space.actions.filter((action) => action.trigger === trigger);
}
