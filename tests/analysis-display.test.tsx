// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AnalysisDisplay } from '../components/AnalysisDisplay';

afterEach(() => {
  cleanup();
});

describe('AnalysisDisplay', () => {
  it('allows editing analysis content', async () => {
    const user = userEvent.setup();
    render(
      <AnalysisDisplay
        initialAnalysis={'Báo cáo phân tích chạy (Analysis by AI)\nNội dung ban đầu'}
        metadata={{
          distance: 10.5,
          pace: "5'40\"/km",
          time: '00:42:35',
          avg_hr: 145,
          max_hr: 162,
          cadence_spm: 175,
          calories: 520,
          elevation_gain_m: 45
        }}
        onReset={vi.fn()}
      />
    );

    const textarea = screen.getByLabelText(/analysis text/i);
    await user.clear(textarea);
    await user.type(textarea, 'Đây là nội dung đã chỉnh sửa');

    expect(textarea).toHaveValue('Đây là nội dung đã chỉnh sửa');
  });

  it('copies edited text to clipboard and shows feedback', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText
      },
      configurable: true
    });

    render(
      <AnalysisDisplay
        initialAnalysis={'Báo cáo phân tích chạy (Analysis by AI)\nNội dung ban đầu'}
        metadata={{
          distance: 10.5,
          pace: "5'40\"/km",
          time: '00:42:35',
          avg_hr: 145,
          max_hr: 162,
          cadence_spm: 175,
          calories: 520,
          elevation_gain_m: 45
        }}
        onReset={vi.fn()}
      />
    );

    const textarea = screen.getByLabelText(/analysis text/i);
    await user.clear(textarea);
    await user.type(textarea, 'Nội dung đã sửa để copy');

    await user.click(screen.getByRole('button', { name: /copy to clipboard/i }));

    expect(writeText).toHaveBeenCalledWith('Nội dung đã sửa để copy');
    expect(screen.getByText(/Copied!/i)).toBeInTheDocument();
  });

  it('triggers reset action', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();

    render(
      <AnalysisDisplay
        initialAnalysis={'Báo cáo phân tích chạy (Analysis by AI)\nNội dung ban đầu'}
        metadata={{
          distance: 10.5,
          pace: "5'40\"/km",
          time: '00:42:35',
          avg_hr: 145,
          max_hr: 162,
          cadence_spm: 175,
          calories: 520,
          elevation_gain_m: 45
        }}
        onReset={onReset}
      />
    );

    await user.click(screen.getByRole('button', { name: /analyze another run/i }));

    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
