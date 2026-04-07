import { beforeEach, describe, expect, it, vi } from "vitest";

const parseFitFile = vi.fn();

vi.mock("../lib/fitParser", () => ({
	parseFitFile,
}));

describe("POST /api/parse-fit", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns 400 when file is missing", async () => {
		const { POST } = await import("../app/api/parse-fit/route");
		const formData = new FormData();
		const request = new Request("http://localhost/api/parse-fit", {
			method: "POST",
			body: formData,
		});

		const response = await POST(request);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body.error).toMatch(/required/i);
	});

	it("returns 400 when multiple files are provided", async () => {
		const { POST } = await import("../app/api/parse-fit/route");
		const formData = new FormData();
		const fileA = new File(
			[
				Buffer.from([
					0x0e, 0x10, 0x5d, 0x08, 0, 0, 0, 0, 0x2e, 0x46, 0x49, 0x54,
				]),
			],
			"a.fit",
			{
				type: "application/octet-stream",
			},
		);
		const fileB = new File(
			[
				Buffer.from([
					0x0e, 0x10, 0x5d, 0x08, 0, 0, 0, 0, 0x2e, 0x46, 0x49, 0x54,
				]),
			],
			"b.fit",
			{
				type: "application/octet-stream",
			},
		);

		formData.append("file", fileA);
		formData.append("file", fileB);

		const request = new Request("http://localhost/api/parse-fit", {
			method: "POST",
			body: formData,
		});

		const response = await POST(request);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body.error).toMatch(/only one file/i);
	});

	it("returns 400 for invalid extension", async () => {
		const { POST } = await import("../app/api/parse-fit/route");
		const formData = new FormData();
		const invalidFile = new File(
			[
				Buffer.from([
					0x0e, 0x10, 0x5d, 0x08, 0, 0, 0, 0, 0x2e, 0x46, 0x49, 0x54,
				]),
			],
			"run.tcx",
			{
				type: "application/octet-stream",
			},
		);

		formData.append("file", invalidFile);

		const request = new Request("http://localhost/api/parse-fit", {
			method: "POST",
			body: formData,
		});

		const response = await POST(request);
		expect(response.status).toBe(400);
	});

	it("returns metadata preview for valid file", async () => {
		const { POST } = await import("../app/api/parse-fit/route");

		parseFitFile.mockResolvedValue({
			session: {
				totalDistance: 6.11,
				totalTime: "00:41:00",
				startTime: "2026-04-06T12:20:22.000Z",
				avgHeartRate: 148,
				maxHeartRate: 169,
				totalCalories: 449,
				avgCadence: 168,
				avgPace: "6'42\"/km",
				totalAscent: 21,
			},
		});

		const validFile = new File(
			[
				Buffer.from([
					0x0e, 0x10, 0x5d, 0x08, 0, 0, 0, 0, 0x2e, 0x46, 0x49, 0x54,
				]),
			],
			"run.fit",
			{
				type: "application/octet-stream",
			},
		);
		const formData = new FormData();
		formData.append("file", validFile);

		const request = new Request("http://localhost/api/parse-fit", {
			method: "POST",
			body: formData,
		});

		const response = await POST(request);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.analysis).toBeUndefined();
		expect(body.metadata.distance).toBe(6.11);
		expect(body.metadata.pace).toBe("6'42\"/km");
		expect(body.metadata.time).toBe("00:41:00");
		expect(body.metadata.avg_hr).toBe(148);
		expect(body.metadata.max_hr).toBe(169);
		expect(body.metadata.cadence_spm).toBe(168);
		expect(body.metadata.calories).toBe(449);
		expect(body.metadata.elevation_gain_m).toBe(21);
		expect(body.metadata.start_time).toBe("2026-04-06T12:20:22.000Z");
	});
});
