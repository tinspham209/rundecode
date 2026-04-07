import FitParser from "fit-file-parser";

type DecodedFitMessages = {
	sessions?: Array<Record<string, unknown>>;
	laps?: Array<Record<string, unknown>>;
	records?: Array<Record<string, unknown>>;
	events?: Array<Record<string, unknown>>;
	device_infos?: Array<Record<string, unknown>>;
};

export type ParsedSession = {
	totalDistance: number;
	totalTime: string;
	startTime: string;
	avgHeartRate: number;
	maxHeartRate: number;
	minHeartRate: number;
	totalCalories: number;
	avgCadence: number;
	avgPace: string;
	totalAscent: number;
	totalDescent: number;
	avgStepLengthCm: number;
	trainingEffect: number;
};

export type ParsedLap = {
	lapNumber: number;
	distance: number;
	time: string;
	avgHeartRate: number;
	avgPace: string;
	avgCadence: number;
	totalAscent: number;
	totalDescent: number;
};

export type ParsedDerived = {
	pauseSummary: {
		pauseCount: number;
		totalPauseSeconds: number;
	};
};

export type ParsedFitData = {
	session: ParsedSession;
	laps: ParsedLap[];
	derived: ParsedDerived;
};

export class ParseValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ParseValidationError";
	}
}

export async function parseFitFile(input: Buffer): Promise<ParsedFitData> {
	const decoded = await decodeFit(input);
	return parseDecodedFitMessages(decoded);
}

export function parseDecodedFitMessages(
	decoded: DecodedFitMessages,
): ParsedFitData {
	const sessionSource = decoded.sessions?.[0];

	if (!sessionSource) {
		throw new ParseValidationError(
			"Không tìm thấy session data trong file FIT.",
		);
	}

	const totalDistanceKm = metersToKilometers(
		numberOrZero(sessionSource.total_distance),
	);
	if (totalDistanceKm <= 0) {
		throw new ParseValidationError(
			"Parse validation failed: total distance must be greater than zero.",
		);
	}

	const avgHeartRate = Math.round(numberOrZero(sessionSource.avg_heart_rate));
	if (avgHeartRate < 40 || avgHeartRate > 200) {
		throw new ParseValidationError(
			"Parse validation failed: average heart rate is out of range (40-200).",
		);
	}

	// Speed: prefer session summary fields, fall back to distance ÷ time
	const avgSpeedMs =
		numberOrZero(sessionSource.enhanced_avg_speed ?? sessionSource.avg_speed) ||
		deriveSpeedFromSession(sessionSource);

	// Cadence: prefer session summary, fall back to average over records
	const rawCadenceHalfSteps =
		numberOrZero(sessionSource.avg_cadence) ||
		deriveAvgCadenceFromRecords(decoded.records ?? []);

	const session: ParsedSession = {
		totalDistance: round(totalDistanceKm, 2),
		totalTime: secondsToClock(numberOrZero(sessionSource.total_timer_time)),
		startTime: sessionSource.start_time ? String(sessionSource.start_time) : "",
		avgHeartRate,
		maxHeartRate: Math.round(numberOrZero(sessionSource.max_heart_rate)),
		minHeartRate: Math.round(numberOrZero(sessionSource.min_heart_rate)),
		totalCalories: Math.round(numberOrZero(sessionSource.total_calories)),
		avgCadence: Math.round(rawCadenceHalfSteps * 2),
		avgPace: speedToPace(avgSpeedMs),
		totalAscent: Math.round(numberOrZero(sessionSource.total_ascent)),
		totalDescent: Math.round(numberOrZero(sessionSource.total_descent)),
		avgStepLengthCm: Math.round(
			numberOrZero(sessionSource.avg_step_length) / 10,
		),
		trainingEffect: numberOrZero(sessionSource.total_training_effect),
	};

	const laps = (decoded.laps ?? [])
		.slice()
		.sort(
			(a, b) => numberOrZero(a.message_index) - numberOrZero(b.message_index),
		)
		.map((lap, index) => {
			const lapRecs = (lap.records as Array<Record<string, unknown>>) ?? [];
			// Zepp does not emit summary fields on lap messages; derive from nested records
			const lapSpeedMs =
				numberOrZero(lap.enhanced_avg_speed ?? lap.avg_speed) ||
				deriveAvgSpeedFromRecords(lapRecs);
			const lapHR =
				Math.round(numberOrZero(lap.avg_heart_rate)) ||
				deriveAvgHRFromRecords(lapRecs);
			const lapCadenceSpm =
				Math.round(numberOrZero(lap.avg_cadence) * 2) ||
				Math.round(deriveAvgCadenceFromRecords(lapRecs) * 2);
			return {
				lapNumber: index + 1,
				distance: round(
					metersToKilometers(numberOrZero(lap.total_distance)),
					2,
				),
				time: secondsToClock(
					numberOrZero(lap.total_timer_time ?? lap.total_elapsed_time),
				),
				avgHeartRate: lapHR,
				avgPace: speedToPace(lapSpeedMs),
				avgCadence: lapCadenceSpm,
				totalAscent: Math.round(numberOrZero(lap.total_ascent)),
				totalDescent: Math.round(numberOrZero(lap.total_descent)),
			};
		});

	const derived: ParsedDerived = {
		pauseSummary: derivePauseSummary(decoded.events ?? []),
	};

	return {
		session,
		laps,
		derived,
	};
}

function decodeFit(input: Buffer): Promise<DecodedFitMessages> {
	const fitParser = new FitParser({
		force: true,
		speedUnit: "m/s",
		lengthUnit: "m",
		elapsedRecordField: true,
		mode: "both",
	});

	return new Promise((resolve, reject) => {
		fitParser.parse(
			input as unknown as Buffer<ArrayBuffer>,
			(error: string | undefined, data: unknown) => {
				if (error) {
					reject(new Error(error));
					return;
				}

				if (!data) {
					reject(new Error("No parsed FIT data returned by decoder."));
					return;
				}

				resolve(data as DecodedFitMessages);
			},
		);
	});
}

function derivePauseSummary(events: Array<Record<string, unknown>>) {
	let pauseCount = 0;
	let totalPauseSeconds = 0;
	let lastStopTime: number | null = null;

	for (const event of events) {
		const type = String(event.event_type ?? "");
		const timestamp = event.timestamp
			? Date.parse(String(event.timestamp))
			: NaN;

		if (type === "stop_all" || type === "stop") {
			if (Number.isFinite(timestamp)) {
				lastStopTime = timestamp;
			}
		}

		// Only count as a real pause when a stop is followed by a start (not the final activity stop)
		if (
			(type === "start" || type === "start_resume") &&
			lastStopTime !== null &&
			Number.isFinite(timestamp)
		) {
			pauseCount += 1;
			totalPauseSeconds += Math.max(
				0,
				Math.round((timestamp - lastStopTime) / 1000),
			);
			lastStopTime = null;
		}
	}

	return {
		pauseCount,
		totalPauseSeconds,
	};
}

function deriveSpeedFromSession(source: Record<string, unknown>): number {
	const distMeters = numberOrZero(source.total_distance);
	const timeSeconds = numberOrZero(source.total_timer_time);
	if (distMeters > 0 && timeSeconds > 0) {
		return distMeters / timeSeconds;
	}
	return 0;
}

function deriveAvgCadenceFromRecords(
	records: Array<Record<string, unknown>>,
): number {
	const values = records
		.map((r) => numberOrZero(r.cadence))
		.filter((v) => v > 0);
	if (values.length === 0) return 0;
	return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function deriveAvgSpeedFromRecords(
	records: Array<Record<string, unknown>>,
): number {
	const values = records.map((r) => numberOrZero(r.speed)).filter((v) => v > 0);
	if (values.length === 0) return 0;
	return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function deriveAvgHRFromRecords(
	records: Array<Record<string, unknown>>,
): number {
	const values = records
		.map((r) => numberOrZero(r.heart_rate))
		.filter((v) => v > 0);
	if (values.length === 0) return 0;
	return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

function metersToKilometers(meters: number) {
	return meters / 1000;
}

function secondsToClock(secondsInput: number): string {
	const seconds = Math.max(0, Math.round(secondsInput));
	const h = Math.floor(seconds / 3600)
		.toString()
		.padStart(2, "0");
	const m = Math.floor((seconds % 3600) / 60)
		.toString()
		.padStart(2, "0");
	const s = Math.floor(seconds % 60)
		.toString()
		.padStart(2, "0");
	return `${h}:${m}:${s}`;
}

function speedToPace(speedMs: number): string {
	if (speedMs <= 0) {
		return "0'00\"/km";
	}

	let roundedSecPerKm = Math.round(1000 / speedMs);
	const minute = Math.floor(roundedSecPerKm / 60);
	roundedSecPerKm %= 60;

	const second = roundedSecPerKm.toString().padStart(2, "0");

	return `${minute}'${second}"/km`;
}

function numberOrZero(value: unknown): number {
	return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function round(value: number, digits: number): number {
	const factor = 10 ** digits;
	return Math.round(value * factor) / factor;
}
