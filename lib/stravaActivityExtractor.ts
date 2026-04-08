import type {
	StravaActivity,
	StravaExtractedActivity,
	StravaStreamsByType,
} from "./stravaTypes";

export function extractStravaActivityData(
	activity: StravaActivity,
	streams: StravaStreamsByType,
): StravaExtractedActivity {
	const distanceKm = activity.distance / 1000;
	const movingTimeSec = activity.moving_time;
	const elapsedTimeSec = activity.elapsed_time;

	const heartRates = streams.heartrate.filter((value) => value > 0);
	const cadences = streams.cadence
		.filter((value) => value > 0)
		.map((value) => value * 2);
	const speeds = streams.velocity_smooth.filter((value) => value > 0);

	const hrDrift = computeHrDrift(heartRates);
	const pauseSummary = computePauseSummary(
		streams.time,
		streams.velocity_smooth,
	);

	return {
		session: {
			totalDistanceKm: round(distanceKm, 2),
			movingTimeSec,
			elapsedTimeSec,
			avgHeartRate: Math.round(
				activity.average_heartrate ?? average(heartRates),
			),
			maxHeartRate: Math.round(
				activity.max_heartrate ?? Math.max(0, ...heartRates),
			),
			avgCadenceSpm: Math.round(
				(activity.average_cadence ?? average(streams.cadence)) * 2,
			),
			avgPacePerKm: toPace(distanceKm, movingTimeSec),
			totalCalories: Math.round(activity.calories ?? 0),
			totalAscent: Math.round(activity.total_elevation_gain ?? 0),
			startTime: activity.start_date_local ?? activity.start_date,
			activityName: activity.name,
		},
		laps: [],
		derived: {
			hrDrift: round(hrDrift, 2),
			paceVariability: round(standardDeviation(speeds), 2),
			cadenceVariability: round(standardDeviation(cadences), 2),
			pauseCount: pauseSummary.pauseCount,
			pauseDurationSec: pauseSummary.pauseDurationSec,
		},
	};
}

function computeHrDrift(heartRates: number[]): number {
	if (heartRates.length < 10) return 0;

	const chunk = Math.max(1, Math.floor(heartRates.length * 0.2));
	const first = heartRates.slice(0, chunk);
	const last = heartRates.slice(-chunk);

	return average(last) - average(first);
}

function computePauseSummary(times: number[], speeds: number[]) {
	if (times.length < 2 || speeds.length < 2) {
		return { pauseCount: 0, pauseDurationSec: 0 };
	}

	let pauseCount = 0;
	let pauseDurationSec = 0;
	let inPause = false;

	const len = Math.min(times.length, speeds.length);
	for (let i = 1; i < len; i += 1) {
		const currentSpeed = speeds[i] ?? 0;
		const prevTime = times[i - 1] ?? 0;
		const currentTime = times[i] ?? prevTime;
		const delta = Math.max(0, currentTime - prevTime);

		if (currentSpeed < 0.3) {
			pauseDurationSec += delta;
			if (!inPause) {
				pauseCount += 1;
				inPause = true;
			}
		} else {
			inPause = false;
		}
	}

	return { pauseCount, pauseDurationSec: Math.round(pauseDurationSec) };
}

function toPace(distanceKm: number, movingTimeSec: number): string {
	if (distanceKm <= 0 || movingTimeSec <= 0) {
		return "0'00\"/km";
	}

	const secPerKm = movingTimeSec / distanceKm;
	const minutes = Math.floor(secPerKm / 60);
	const seconds = Math.round(secPerKm % 60)
		.toString()
		.padStart(2, "0");

	return `${minutes}'${seconds}"/km`;
}

function average(values: number[]): number {
	if (values.length === 0) return 0;
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]): number {
	if (values.length === 0) return 0;
	const avg = average(values);
	const variance =
		values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;
	return Math.sqrt(variance);
}

function round(value: number, digits: number): number {
	const factor = 10 ** digits;
	return Math.round(value * factor) / factor;
}
