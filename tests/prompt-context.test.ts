import { describe, expect, it } from 'vitest';
import { RUN_ANALYSIS_SYSTEM_PROMPT } from '../src/prompts/runAnalysisSystemPrompt';
import { buildPromptSegments } from '../lib/buildPromptContext';

describe('prompt context assembly', () => {
  it('assembles prompt in strict order: system, data, guardrails', () => {
    const parsed = {
      session: {
        totalDistance: 10.5,
        totalTime: '00:42:35',
        avgHeartRate: 145,
        maxHeartRate: 162,
        totalCalories: 520,
        avgCadence: 175,
        avgPace: "5'40\"/km",
        totalAscent: 45
      },
      laps: [
        {
          lapNumber: 1,
          distance: 5.2,
          time: '00:21:15',
          avgHeartRate: 142,
          avgPace: "5'44\"/km",
          avgCadence: 173
        }
      ],
      derived: {
        pauseSummary: {
          pauseCount: 0,
          totalPauseSeconds: 0
        }
      }
    };

    const segments = buildPromptSegments(parsed);

    expect(segments).toHaveLength(3);
    expect(segments[0]).toBe(RUN_ANALYSIS_SYSTEM_PROMPT);
    expect(segments[1]).toMatch(/Dữ liệu chạy hôm nay/i);
    expect(segments[2]).toMatch(/Báo cáo phân tích chạy \(Analysis by AI\)/);
  });
});
