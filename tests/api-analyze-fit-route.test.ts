import { beforeEach, describe, expect, it, vi } from "vitest";

const parseFitFile = vi.fn();
const buildPromptSegments = vi.fn();
const generateAnalysis = vi.fn();
class MockParseValidationError extends Error {}

vi.mock("../lib/fitParser", () => ({
	parseFitFile,
	ParseValidationError: MockParseValidationError,
}));

vi.mock("../lib/buildPromptContext", () => ({
	buildPromptSegments,
}));

vi.mock("../lib/aiAnalyzer", () => ({
	generateAnalysis,
	FREE_MODELS: [
		"qwen/qwen3.6-plus:free",
		"minimax/minimax-m2.5:free",
		"openai/gpt-oss-120b:free",
		"qwen/qwen3-coder:free",
	],
}));

describe("POST /api/analyze-fit", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns 400 when file is missing", async () => {
		const { POST } = await import("../app/api/analyze-fit/route");
		const formData = new FormData();
		const request = new Request("http://localhost/api/analyze-fit", {
			method: "POST",
			body: formData,
		});

		const response = await POST(request);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body.error).toMatch(/required/i);
	});

	it("returns 400 when multiple files are provided", async () => {
		const { POST } = await import("../app/api/analyze-fit/route");
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

		const request = new Request("http://localhost/api/analyze-fit", {
			method: "POST",
			body: formData,
		});

		const response = await POST(request);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body.error).toMatch(/only one file/i);
	});

	it("returns 400 for invalid extension", async () => {
		const { POST } = await import("../app/api/analyze-fit/route");
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

		const request = new Request("http://localhost/api/analyze-fit", {
			method: "POST",
			body: formData,
		});

		const response = await POST(request);

		expect(response.status).toBe(400);
	});

	it("returns 200 and response contract for valid file", async () => {
		const { POST } = await import("../app/api/analyze-fit/route");

		parseFitFile.mockResolvedValue({
			session: {
				totalDistance: 10.5,
				totalTime: "00:42:35",
				startTime: "2026-04-06T12:20:22.000Z",
				avgHeartRate: 145,
				maxHeartRate: 162,
				totalCalories: 520,
				avgCadence: 175,
				avgPace: "5'40\"/km",
				totalAscent: 45,
			},
			laps: [],
		});

		buildPromptSegments.mockReturnValue(["system", "context", "guardrails"]);

		generateAnalysis.mockResolvedValue({
			analysis: "Báo cáo phân tích chạy (Analysis by AI)\nNội dung",
			model: "qwen/qwen3.6-plus:free",
			tokensUsed: 1234,
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

		const request = new Request("http://localhost/api/analyze-fit", {
			method: "POST",
			body: formData,
		});

		const response = await POST(request);
		const body = await response.json();

		expect(generateAnalysis).toHaveBeenCalledWith(
			"context\n\nguardrails",
			undefined,
			"qwen/qwen3.6-plus:free",
			"system",
		);

		expect(response.status).toBe(200);
		expect(body.analysis).toBeTypeOf("string");
		expect(body.metadata).toBeDefined();
		expect(body.metadata.distance).toBe(10.5);
		expect(body.metadata.pace).toBe("5'40\"/km");
		expect(body.metadata.time).toBe("00:42:35");
		expect(body.metadata.avg_hr).toBe(145);
		expect(body.metadata.max_hr).toBe(162);
		expect(body.metadata.cadence_spm).toBe(175);
		expect(body.metadata.calories).toBe(520);
		expect(body.metadata.elevation_gain_m).toBe(45);
		expect(body.metadata.start_time).toBe("2026-04-06T12:20:22.000Z");
		expect(body.model).toBe("qwen/qwen3.6-plus:free");
		expect(body.tokensUsed).toBe(1234);
	});

	it("returns provider raw message for structured OpenRouter 429 errors", async () => {
		const { POST } = await import("../app/api/analyze-fit/route");

		parseFitFile.mockResolvedValue({
			session: {
				totalDistance: 10.5,
				totalTime: "00:42:35",
				startTime: "2026-04-06T12:20:22.000Z",
				avgHeartRate: 145,
				maxHeartRate: 162,
				totalCalories: 520,
				avgCadence: 175,
				avgPace: "5'40\"/km",
				totalAscent: 45,
			},
			laps: [],
		});

		buildPromptSegments.mockReturnValue(["system", "context", "guardrails"]);

		generateAnalysis.mockRejectedValue({
			code: 429,
			message: "Provider returned error",
			metadata: {
				raw: "qwen/qwen3.6-plus:free is temporarily rate-limited upstream. Please retry shortly.",
				provider_name: "Alibaba",
				is_byok: false,
			},
		});

		const validFile = new File(
			[
				Buffer.from([
					0x0e, 0x10, 0x5d, 0x08, 0, 0, 0, 0, 0x2e, 0x46, 0x49, 0x54,
				]),
			],
			"run.fit",
			{ type: "application/octet-stream" },
		);

		const formData = new FormData();
		formData.append("file", validFile);

		const request = new Request("http://localhost/api/analyze-fit", {
			method: "POST",
			body: formData,
		});

		const response = await POST(request);
		const body = await response.json();

		expect(response.status).toBe(429);
		expect(body.error).toContain("temporarily rate-limited upstream");
	});
});
