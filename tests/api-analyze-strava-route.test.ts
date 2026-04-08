import { beforeEach, describe, expect, it, vi } from "vitest";

const buildStravaPromptSegments = vi.fn();
const generateAnalysis = vi.fn();

vi.mock("../lib/buildPromptContext", () => ({
	buildStravaPromptSegments,
}));

vi.mock("../lib/aiAnalyzer", () => ({
	generateAnalysis,
	FREE_MODELS: [
		"qwen/qwen3.6-plus:free",
		"minimax/minimax-m2.5:free",
		"openai/gpt-oss-120b:free",
	],
}));

const sampleActivity = {
	session: {
		totalDistanceKm: 10,
		movingTimeSec: 3600,
		elapsedTimeSec: 3660,
		avgHeartRate: 150,
		maxHeartRate: 172,
		avgCadenceSpm: 176,
		avgPacePerKm: `6'00"/km`,
		totalCalories: 700,
		totalAscent: 50,
		startTime: "2026-04-06T06:32:00.000Z",
		activityName: "Morning Run",
	},
	laps: [],
	derived: {
		hrDrift: 7.5,
		paceVariability: 0.12,
		cadenceVariability: 3.2,
		pauseCount: 1,
		pauseDurationSec: 30,
	},
};

describe("POST /api/analyze-strava", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns 400 when activity payload is missing", async () => {
		const { POST } = await import("../app/api/analyze-strava/route");
		const request = new Request("http://localhost/api/analyze-strava", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({}),
		});

		const response = await POST(request);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body.error).toMatch(/missing activity payload/i);
	});

	it("returns normalized analysis contract for valid payload", async () => {
		const { POST } = await import("../app/api/analyze-strava/route");

		buildStravaPromptSegments.mockReturnValue(["system", "context", "guardrails"]);
		generateAnalysis.mockResolvedValue({
			analysis: "Báo cáo phân tích chạy (Analysis by AI)\nNội dung Strava",
			model: "qwen/qwen3.6-plus:free",
			tokensUsed: 456,
		});

		const request = new Request("http://localhost/api/analyze-strava", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				model: "qwen/qwen3.6-plus:free",
				activity: sampleActivity,
			}),
		});

		const response = await POST(request);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(buildStravaPromptSegments).toHaveBeenCalled();
		expect(generateAnalysis).toHaveBeenCalledWith(
			"context\n\nguardrails",
			undefined,
			"qwen/qwen3.6-plus:free",
			"system",
		);
		expect(body.analysis).toContain("Nội dung Strava");
		expect(body.metadata.distance).toBe(10);
		expect(body.metadata.pace).toBe(`6'00"/km`);
		expect(body.metadata.time).toBe("01:00:00");
		expect(body.metadata.avg_hr).toBe(150);
		expect(body.metadata.max_hr).toBe(172);
		expect(body.metadata.cadence_spm).toBe(176);
		expect(body.metadata.calories).toBe(700);
		expect(body.metadata.elevation_gain_m).toBe(50);
		expect(body.model).toBe("qwen/qwen3.6-plus:free");
		expect(body.tokensUsed).toBe(456);
	});

	it("falls back to default model for unknown model input", async () => {
		const { POST } = await import("../app/api/analyze-strava/route");

		buildStravaPromptSegments.mockReturnValue(["system", "context", "guardrails"]);
		generateAnalysis.mockResolvedValue({
			analysis: "ok",
			model: "qwen/qwen3.6-plus:free",
		});

		const request = new Request("http://localhost/api/analyze-strava", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ model: "unknown-model", activity: sampleActivity }),
		});

		await POST(request);

		expect(generateAnalysis).toHaveBeenCalledWith(
			"context\n\nguardrails",
			undefined,
			"qwen/qwen3.6-plus:free",
			"system",
		);
	});

	it("maps rate limit style errors to 429", async () => {
		const { POST } = await import("../app/api/analyze-strava/route");

		buildStravaPromptSegments.mockReturnValue(["system", "context", "guardrails"]);
		generateAnalysis.mockRejectedValue(
			new Error("Provider 429 rate limit exceeded"),
		);

		const request = new Request("http://localhost/api/analyze-strava", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ activity: sampleActivity }),
		});

		const response = await POST(request);
		const body = await response.json();

		expect(response.status).toBe(429);
		expect(body.error).toMatch(/rate limit/i);
	});
});
