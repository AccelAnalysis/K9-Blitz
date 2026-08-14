import { ComponentInvariantError, assertUniqueIds } from "./errors.js";

export interface CompetitionStageDefinition {
  readonly id: string;
  readonly label: string;
  readonly iconAssetId?: string;
  readonly prerequisiteStageIds: readonly string[];
  readonly requirementIds: readonly string[];
  readonly rewardIds: readonly string[];
}

export interface CompetitionTrackDefinition {
  readonly id: string;
  readonly stages: readonly CompetitionStageDefinition[];
}

export interface CompetitionTrackState {
  readonly trackId: string;
  readonly completedStageIds: readonly string[];
}

export function validateCompetitionTrack(definition: CompetitionTrackDefinition): void {
  const stageIds = definition.stages.map((stage) => stage.id);
  assertUniqueIds(stageIds, `Competition track ${definition.id}`);
  const known = new Set(stageIds);

  for (const stage of definition.stages) {
    for (const prerequisiteId of stage.prerequisiteStageIds) {
      if (!known.has(prerequisiteId)) {
        throw new ComponentInvariantError(
          "UNKNOWN_COMPETITION_PREREQUISITE",
          `Stage ${stage.id} references unknown prerequisite stage ${prerequisiteId}.`,
        );
      }
      if (prerequisiteId === stage.id) {
        throw new ComponentInvariantError(
          "SELF_COMPETITION_PREREQUISITE",
          `Stage ${stage.id} cannot require itself.`,
        );
      }
    }
  }
}

export function createCompetitionTrackState(
  definition: CompetitionTrackDefinition,
): CompetitionTrackState {
  validateCompetitionTrack(definition);
  return {
    trackId: definition.id,
    completedStageIds: [],
  };
}

export function isCompetitionStageEligible(
  definition: CompetitionTrackDefinition,
  state: CompetitionTrackState,
  stageId: string,
): boolean {
  if (state.completedStageIds.includes(stageId)) {
    return false;
  }

  const stage = definition.stages.find((candidate) => candidate.id === stageId);
  if (stage === undefined) {
    throw new ComponentInvariantError(
      "UNKNOWN_COMPETITION_STAGE",
      `Competition track ${definition.id} does not contain stage ${stageId}.`,
    );
  }

  return stage.prerequisiteStageIds.every((id) => state.completedStageIds.includes(id));
}

export function canCompleteCompetitionStage(
  definition: CompetitionTrackDefinition,
  state: CompetitionTrackState,
  stageId: string,
  satisfiedRequirementIds: ReadonlySet<string>,
): boolean {
  if (!isCompetitionStageEligible(definition, state, stageId)) {
    return false;
  }

  const stage = definition.stages.find((candidate) => candidate.id === stageId);
  if (stage === undefined) {
    return false;
  }

  return stage.requirementIds.every((requirementId) => satisfiedRequirementIds.has(requirementId));
}

export function completeCompetitionStage(
  definition: CompetitionTrackDefinition,
  state: CompetitionTrackState,
  stageId: string,
  satisfiedRequirementIds: ReadonlySet<string>,
): CompetitionTrackState {
  if (!canCompleteCompetitionStage(definition, state, stageId, satisfiedRequirementIds)) {
    throw new ComponentInvariantError(
      "COMPETITION_STAGE_NOT_COMPLETABLE",
      `Competition stage ${stageId} is not currently completable.`,
    );
  }

  return {
    ...state,
    completedStageIds: [...state.completedStageIds, stageId],
  };
}
