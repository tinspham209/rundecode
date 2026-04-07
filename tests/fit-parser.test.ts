import { describe, expect, it } from 'vitest';
import { ParseValidationError, parseDecodedFitMessages } from '../lib/fitParser';

describe('fit parser', () => {
  it('parses session metrics and converts units', () => {
    const parsed = parseDecodedFitMessages({
      sessions: [
        {
          total_distance: 10500,
          total_timer_time: 2555,
          avg_heart_rate: 145,
          max_heart_rate: 162,
          total_calories: 520,
          avg_cadence: 87.5,
          enhanced_avg_speed: 2.95,
          total_ascent: 45
        }
      ],
      laps: [],
      records: []
    });

    expect(parsed.session.totalDistance).toBe(10.5);
    expect(parsed.session.totalTime).toBe('00:42:35');
    expect(parsed.session.avgHeartRate).toBe(145);
    expect(parsed.session.maxHeartRate).toBe(162);
    expect(parsed.session.avgCadence).toBe(175);
    expect(parsed.session.avgPace).toBe("5'39\"/km");
  });

  it('parses lap messages in order', () => {
    const parsed = parseDecodedFitMessages({
      sessions: [
        {
          total_distance: 10000,
          total_timer_time: 2500,
          avg_heart_rate: 145,
          max_heart_rate: 162,
          total_calories: 500,
          avg_cadence: 87,
          enhanced_avg_speed: 3,
          total_ascent: 40
        }
      ],
      laps: [
        {
          total_distance: 5300,
          total_timer_time: 1280,
          avg_heart_rate: 148,
          enhanced_avg_speed: 2.97,
          avg_cadence: 88,
          message_index: 2
        },
        {
          total_distance: 4700,
          total_timer_time: 1220,
          avg_heart_rate: 142,
          enhanced_avg_speed: 3.02,
          avg_cadence: 86,
          message_index: 1
        }
      ],
      records: []
    });

    expect(parsed.laps).toHaveLength(2);
    expect(parsed.laps[0].lapNumber).toBe(1);
    expect(parsed.laps[1].lapNumber).toBe(2);
  });

  it('throws validation error when distance is zero', () => {
    expect(() =>
      parseDecodedFitMessages({
        sessions: [
          {
            total_distance: 0,
            total_timer_time: 2555,
            avg_heart_rate: 145,
            max_heart_rate: 162,
            total_calories: 520,
            avg_cadence: 87,
            enhanced_avg_speed: 2.95,
            total_ascent: 45
          }
        ],
        laps: [],
        records: []
      })
    ).toThrow(ParseValidationError);
  });

  it('throws validation error when avg heart rate out of allowed range', () => {
    expect(() =>
      parseDecodedFitMessages({
        sessions: [
          {
            total_distance: 10500,
            total_timer_time: 2555,
            avg_heart_rate: 201,
            max_heart_rate: 210,
            total_calories: 520,
            avg_cadence: 87,
            enhanced_avg_speed: 2.95,
            total_ascent: 45
          }
        ],
        laps: [],
        records: []
      })
    ).toThrow(ParseValidationError);
  });

  it('keeps output free of gps and device identifiers', () => {
    const parsed = parseDecodedFitMessages({
      sessions: [
        {
          total_distance: 10500,
          total_timer_time: 2555,
          avg_heart_rate: 145,
          max_heart_rate: 162,
          total_calories: 520,
          avg_cadence: 87,
          enhanced_avg_speed: 2.95,
          total_ascent: 45
        }
      ],
      laps: [],
      records: [
        {
          position_lat: 123456,
          position_long: 654321,
          heart_rate: 145,
          cadence: 88,
          enhanced_speed: 2.95,
          timestamp: '2026-04-07T10:00:00Z'
        }
      ],
      device_infos: [{ serial_number: 12345, device_index: 0 }]
    });

    expect('device_infos' in (parsed as unknown as Record<string, unknown>)).toBe(false);
    expect('records' in (parsed as unknown as Record<string, unknown>)).toBe(false);
    expect(parsed.derived.pauseSummary.pauseCount).toBe(0);
  });
});
