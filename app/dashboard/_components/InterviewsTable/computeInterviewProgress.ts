type InterviewProgressInput = {
  finishTime: Date | null;
  currentStep: number;
  stageCount: number;
};

/**
 * Completion is determined by finishTime, not currentStep. A finished interview
 * never advances currentStep to stageCount because the finish screen is an
 * appended stage that isn't counted and the finish flow only records finishTime,
 * so deriving progress from currentStep alone caps it below 100%.
 */
export function computeInterviewProgress({
  finishTime,
  currentStep,
  stageCount,
}: InterviewProgressInput): number {
  if (finishTime) return 100;
  return stageCount > 0 ? (currentStep / stageCount) * 100 : 0;
}
