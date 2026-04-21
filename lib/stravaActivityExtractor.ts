import type {
	AthleteProfile,
	StravaActivity,
	StravaExtractedActivity,
	StravaStreamsByType,
} from "./stravaTypes";

export function extractStravaActivityData(
	activity: StravaActivity,
	streams: StravaStreamsByType,
	profile?: AthleteProfile | null,
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

	let totalCalories = Math.round(activity.calories ?? 0);

	// Task 2: If calories missing, estimate based on HR, weight, age, time
	if (totalCalories <= 0 && profile) {
		const avgHR = Math.round(activity.average_heartrate ?? average(heartRates));
		if (avgHR > 0 && profile.weightKg && profile.age) {
			// standard formula for calorie burn based on HR (Male/Female generic approximation)
			// Male: Calories = [(Age x 0.2017) + (Weight x 0.1988) + (Heart Rate x 0.6309) - 55.0969] x Time / 4.184
			// Female: Calories = [(Age x 0.074) - (Weight x 0.1263) + (Heart Rate x 0.4472) - 20.4022] x Time / 4.184
			// Using a blended/simplified version since gender is not explicitly in profile
			const durationMin = movingTimeSec / 60;
			const weightLbs = profile.weightKg * 2.20462;

			// Generic formula often used in fitness trackers
			// Cal/min = (0.6309 * HR + 0.1988 * W + 0.2017 * A - 55.0969) / 4.184
			const estimated =
				((0.6309 * avgHR +
					0.1988 * weightLbs +
					0.2017 * profile.age -
					55.0969) /
					4.184) *
				durationMin;

			if (estimated > 0) {
				totalCalories = Math.round(estimated);
			}
		} else if (profile.weightKg) {
			// Fallback: simple MET based estimation if HR missing
			// Running ~8-10 METs
			const met = 8.5;
			const estimated = met * profile.weightKg * (movingTimeSec / 3600);
			totalCalories = Math.round(estimated);
		}
	}

	return {
		session: {
			activityId: activity.id,
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
			totalCalories,
			totalAscent: Math.round(activity.total_elevation_gain ?? 0),
			startTime: activity.start_date_local ?? activity.start_date,
			activityName: activity.name,
			device_name: activity.device_name,
			average_speed: activity.average_speed,
			max_speed: activity.max_speed,
			elev_high: activity.elev_high,
			elev_low: activity.elev_low,
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
