type InterviewProgressInput = {
  finishTime: Date | null;
  currentStep: number;
  stageCount: number;
};

/**
 * Progress for an interview row, kept in step with @codaco/interview.
 *
 * Completion is determined by finishTime, not currentStep: the finish flow
 * records finishTime but does not reliably advance currentStep to the end.
 *
 * For in-progress interviews the denominator is stageCount + 1, because the
 * package indexes currentStep against [...protocolStages, finishStage] — the
 * appended finish screen makes the true step total one greater than the
 * protocol's stage count.
 */
export function computeInterviewProgress({
  finishTime,
  currentStep,
  stageCount,
}: InterviewProgressInput): number {
  if (finishTime) return 100;
  return (currentStep / (stageCount + 1)) * 100;
}
