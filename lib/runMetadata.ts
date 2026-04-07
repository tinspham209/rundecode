import type { ParsedSession } from "./fitParser";

export type RunMetadata = {
	distance: number;
	pace: string;
	time: string;
	avg_hr: number;
	max_hr: number;
	cadence_spm: number;
	calories: number;
	elevation_gain_m: number;
	start_time?: string;
};

export function toRunMetadata(session: ParsedSession): RunMetadata {
	return {
		distance: session.totalDistance,
		pace: session.avgPace,
		time: session.totalTime,
		avg_hr: session.avgHeartRate,
		max_hr: session.maxHeartRate,
		cadence_spm: session.avgCadence,
		calories: session.totalCalories,
		elevation_gain_m: session.totalAscent,
		start_time: session.startTime,
	};
}
