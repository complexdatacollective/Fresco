import { describe, expect, it } from 'vitest';
import { computeInterviewProgress } from '../computeInterviewProgress';

describe('computeInterviewProgress', () => {
  it('returns 100 for a finished interview even when currentStep is below stageCount', () => {
    // Completion is determined by finishTime, not currentStep: the finish flow
    // records finishTime but does not reliably advance currentStep to the end.
    expect(
      computeInterviewProgress({
        finishTime: new Date(),
        currentStep: 11,
        stageCount: 12,
      }),
    ).toBe(100);
  });

  it('returns 100 for a finished interview regardless of stageCount', () => {
    expect(
      computeInterviewProgress({
        finishTime: new Date(),
        currentStep: 0,
        stageCount: 0,
      }),
    ).toBe(100);
  });

  it('divides by stageCount + 1 to match the package, which appends a finish stage', () => {
    // @codaco/interview indexes currentStep against [...protocolStages, finish],
    // so the true step total is stageCount + 1.
    expect(
      computeInterviewProgress({
        finishTime: null,
        currentStep: 1,
        stageCount: 3,
      }),
    ).toBe(25);
  });

  it('reports an unfinished interview parked on the finish screen below 100%', () => {
    // currentStep === stageCount means the participant reached the appended
    // finish screen but has not finished; finishTime is the only 100% signal.
    expect(
      computeInterviewProgress({
        finishTime: null,
        currentStep: 12,
        stageCount: 12,
      }),
    ).toBeCloseTo((12 / 13) * 100);
  });

  it('returns 0 for a not-started interview', () => {
    expect(
      computeInterviewProgress({
        finishTime: null,
        currentStep: 0,
        stageCount: 12,
      }),
    ).toBe(0);
  });

  it('returns 0 for a not-started interview when stageCount is 0', () => {
    expect(
      computeInterviewProgress({
        finishTime: null,
        currentStep: 0,
        stageCount: 0,
      }),
    ).toBe(0);
  });
});
