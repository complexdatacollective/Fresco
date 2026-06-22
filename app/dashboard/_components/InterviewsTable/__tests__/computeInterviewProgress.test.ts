import { describe, expect, it } from 'vitest';
import { computeInterviewProgress } from '../computeInterviewProgress';

describe('computeInterviewProgress', () => {
  it('returns 100 for a finished interview even when currentStep is below stageCount', () => {
    // A finished interview never advances currentStep to stageCount: the finish
    // screen is an appended stage that is not counted, and the finish flow only
    // records finishTime. Completion is determined by finishTime, not currentStep.
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

  it('returns the proportional percentage for an in-progress interview', () => {
    expect(
      computeInterviewProgress({
        finishTime: null,
        currentStep: 3,
        stageCount: 12,
      }),
    ).toBe(25);
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

  it('returns 0 when stageCount is 0 and the interview is unfinished', () => {
    expect(
      computeInterviewProgress({
        finishTime: null,
        currentStep: 0,
        stageCount: 0,
      }),
    ).toBe(0);
  });
});
