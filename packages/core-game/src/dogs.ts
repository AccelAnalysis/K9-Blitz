export type DogAttributeValue = string | number | boolean;

export interface DogSkillDefinition {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
}

export interface DogDefinition {
  readonly id: string;
  readonly name: string;
  readonly breed?: string;
  readonly portraitAssetId?: string;
  readonly cardFrontAssetId?: string;
  readonly cardBackAssetId?: string;
  readonly attributes: Readonly<Record<string, DogAttributeValue>>;
  readonly skills: readonly DogSkillDefinition[];
  readonly specialAbilityIds: readonly string[];
}

export interface DogProgressState {
  readonly dogId: string;
  readonly ownerPlayerId: string;
  readonly completedTrainingIds: readonly string[];
  readonly achievementIds: readonly string[];
}

export function createDogProgressState(dogId: string, ownerPlayerId: string): DogProgressState {
  return {
    dogId,
    ownerPlayerId,
    completedTrainingIds: [],
    achievementIds: [],
  };
}

export function completeDogTraining(
  state: DogProgressState,
  trainingId: string,
): DogProgressState {
  if (state.completedTrainingIds.includes(trainingId)) {
    return state;
  }

  return {
    ...state,
    completedTrainingIds: [...state.completedTrainingIds, trainingId],
  };
}

export function awardDogAchievement(
  state: DogProgressState,
  achievementId: string,
): DogProgressState {
  if (state.achievementIds.includes(achievementId)) {
    return state;
  }

  return {
    ...state,
    achievementIds: [...state.achievementIds, achievementId],
  };
}
