/**
 * Integration tests using the real Zepp .fit file.
 * These tests validate actual parser output against known truths extracted from the binary file.
 * All e2e scenarios covered: @parsing @session @lap @privacy @resilience @parsing @record-derived
 */

import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { parseFitFile } from "../lib/fitParser";

const sampleFilePath = join(
	__dirname,
	"..",
	"examples",
	"Zepp20260406192022.fit",
);

describe("real FIT file integration – Zepp20260406192022", () => {
	it("parses without throwing", async () => {
		const buf = readFileSync(sampleFilePath);
		const parsed = await parseFitFile(buf);
		expect(parsed).toBeDefined();
	});

	it("session distance is ~6.11 km", async () => {
		const buf = readFileSync(sampleFilePath);
		const { session } = await parseFitFile(buf);
		expect(session.totalDistance).toBe(6.11);
	});

	it("session time is 00:41:00", async () => {
		const buf = readFileSync(sampleFilePath);
		const { session } = await parseFitFile(buf);
		expect(session.totalTime).toBe("00:41:00");
	});

	it("session heart rate is 148 avg / 169 max", async () => {
		const buf = readFileSync(sampleFilePath);
		const { session } = await parseFitFile(buf);
		expect(session.avgHeartRate).toBe(148);
		expect(session.maxHeartRate).toBe(169);
	});

	it("session calories is 449 kcal", async () => {
		const buf = readFileSync(sampleFilePath);
		const { session } = await parseFitFile(buf);
		expect(session.totalCalories).toBe(449);
	});

	it("session elevation gain is 21m", async () => {
		const buf = readFileSync(sampleFilePath);
		const { session } = await parseFitFile(buf);
		expect(session.totalAscent).toBe(21);
	});

	it("session elevation descent is 25m", async () => {
		const buf = readFileSync(sampleFilePath);
		const { session } = await parseFitFile(buf);
		expect(session.totalDescent).toBe(25);
	});

	it("session min heart rate is 110 bpm", async () => {
		const buf = readFileSync(sampleFilePath);
		const { session } = await parseFitFile(buf);
		expect(session.minHeartRate).toBe(110);
	});

	it("session avg step length is 90 cm", async () => {
		const buf = readFileSync(sampleFilePath);
		const { session } = await parseFitFile(buf);
		expect(session.avgStepLengthCm).toBe(90);
	});

	it("session training effect is 3", async () => {
		const buf = readFileSync(sampleFilePath);
		const { session } = await parseFitFile(buf);
		expect(session.trainingEffect).toBe(3);
	});

	it("session start time is a non-empty ISO string", async () => {
		const buf = readFileSync(sampleFilePath);
		const { session } = await parseFitFile(buf);
		expect(session.startTime).toBeTruthy();
		expect(new Date(session.startTime).getFullYear()).toBe(2026);
	});

	it("avg cadence is derived from records and is plausible (> 0 spm)", async () => {
		const buf = readFileSync(sampleFilePath);
		const { session } = await parseFitFile(buf);
		// Zepp file has no avg_cadence in session – must come from record fallback
		expect(session.avgCadence).toBeGreaterThan(0);
		expect(session.avgCadence).toBeGreaterThanOrEqual(140);
		expect(session.avgCadence).toBeLessThanOrEqual(220);
	});

	it("avg pace is derived and formatted", async () => {
		const buf = readFileSync(sampleFilePath);
		const { session } = await parseFitFile(buf);
		// Zepp file has no avg_speed in session – must use distance/time fallback
		expect(session.avgPace).toMatch(/^\d+'\d{2}"\/km$/);
		// ~6min/km pace range for this run
		const minPart = parseInt(session.avgPace.split("'")[0], 10);
		expect(minPart).toBeGreaterThanOrEqual(5);
		expect(minPart).toBeLessThanOrEqual(8);
	});

	it("has exactly 1 lap", async () => {
		const buf = readFileSync(sampleFilePath);
		const { laps } = await parseFitFile(buf);
		expect(laps).toHaveLength(1);
	});

	it("lap 1 has plausible distance and time", async () => {
		const buf = readFileSync(sampleFilePath);
		const { laps } = await parseFitFile(buf);
		expect(laps[0].lapNumber).toBe(1);
		expect(laps[0].distance).toBe(6.11);
		expect(laps[0].time).toBe("00:41:00");
	});

	it("lap 1 has derived avg HR from records", async () => {
		const buf = readFileSync(sampleFilePath);
		const { laps } = await parseFitFile(buf);
		// Zepp does not put avg_heart_rate in lap summary; must derive from lap.records[]
		expect(laps[0].avgHeartRate).toBe(148);
	});

	it("lap 1 has derived avg pace formatted correctly", async () => {
		const buf = readFileSync(sampleFilePath);
		const { laps } = await parseFitFile(buf);
		expect(laps[0].avgPace).toMatch(/^\d+'\d{2}"\/km$/);
		const minPart = parseInt(laps[0].avgPace.split("'")[0], 10);
		expect(minPart).toBeGreaterThanOrEqual(5);
		expect(minPart).toBeLessThanOrEqual(8);
	});

	it("lap 1 has derived avg cadence > 0 spm", async () => {
		const buf = readFileSync(sampleFilePath);
		const { laps } = await parseFitFile(buf);
		expect(laps[0].avgCadence).toBeGreaterThan(0);
		expect(laps[0].avgCadence).toBeGreaterThanOrEqual(140);
		expect(laps[0].avgCadence).toBeLessThanOrEqual(220);
	});

	it("lap 1 has ascent 21m and descent 25m", async () => {
		const buf = readFileSync(sampleFilePath);
		const { laps } = await parseFitFile(buf);
		expect(laps[0].totalAscent).toBe(21);
		expect(laps[0].totalDescent).toBe(25);
	});

	it("detects 2 pause events with non-zero pause duration", async () => {
		const buf = readFileSync(sampleFilePath);
		const { derived } = await parseFitFile(buf);
		expect(derived.pauseSummary.pauseCount).toBe(2);
		expect(derived.pauseSummary.totalPauseSeconds).toBeGreaterThan(0);
		// Approx 59 + 63 = 122 seconds
		expect(derived.pauseSummary.totalPauseSeconds).toBeGreaterThanOrEqual(100);
		expect(derived.pauseSummary.totalPauseSeconds).toBeLessThanOrEqual(200);
	});

	it("output contains no GPS coordinates (privacy)", async () => {
		const buf = readFileSync(sampleFilePath);
		const parsed = await parseFitFile(buf);
		const stringified = JSON.stringify(parsed);

		// latitude/longitude field names must not appear in the output
		expect(stringified).not.toMatch(/position_lat/);
		expect(stringified).not.toMatch(/position_long/);
		// No raw numeric lat/long near known coordinate range of Da Nang
		expect(stringified).not.toMatch(/16\.04/);
		expect(stringified).not.toMatch(/108\.22/);
	});

	it("output contains no device identifiers", async () => {
		const buf = readFileSync(sampleFilePath);
		const parsed = await parseFitFile(buf);
		const stringified = JSON.stringify(parsed);

		expect(stringified).not.toMatch(/serial_number/);
		expect(stringified).not.toMatch(/device_index/);
	});
});

describe("real FIT file integration – multi-file smoke", () => {
	const allSamples = [
		"Zepp20260311183004.fit",
		"Zepp20260316193113.fit",
		"Zepp20260317190643.fit",
		"Zepp20260318182436.fit",
		"Zepp20260320190253.fit",
		"Zepp20260323190524.fit",
		"Zepp20260324181121.fit",
		"Zepp20260325174932.fit",
		"Zepp20260326184653.fit",
		"Zepp20260404055415.fit",
		"Zepp20260406192022.fit",
	];

	for (const filename of allSamples) {
		it(`parses ${filename} without throwing and passes basic sanity checks`, async () => {
			const buf = readFileSync(join(__dirname, "..", "examples", filename));
			const parsed = await parseFitFile(buf);

			expect(parsed.session.totalDistance).toBeGreaterThan(0);
			expect(parsed.session.totalTime).toMatch(/^\d{2}:\d{2}:\d{2}$/);
			expect(parsed.session.avgHeartRate).toBeGreaterThanOrEqual(40);
			expect(parsed.session.avgHeartRate).toBeLessThanOrEqual(200);
			expect(parsed.session.minHeartRate).toBeGreaterThan(0);
			expect(parsed.session.minHeartRate).toBeLessThanOrEqual(
				parsed.session.avgHeartRate,
			);
			expect(parsed.session.avgPace).toMatch(/^\d+'\d{2}"\/km$/);
			expect(parsed.session.avgCadence).toBeGreaterThanOrEqual(0);
			expect(parsed.session.avgStepLengthCm).toBeGreaterThan(0);
			expect(parsed.session.trainingEffect).toBeGreaterThanOrEqual(0);
			expect(parsed.session.startTime).toBeTruthy();
			expect(parsed.laps.length).toBeGreaterThanOrEqual(1);
			// Lap-derived HR must be non-zero
			expect(parsed.laps[0].avgHeartRate).toBeGreaterThan(0);

			const out = JSON.stringify(parsed);
			expect(out).not.toMatch(/position_lat/);
			expect(out).not.toMatch(/position_long/);
		});
	}
});
