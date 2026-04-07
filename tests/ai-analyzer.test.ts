import { describe, expect, it, vi, beforeEach } from "vitest";
import { generateAnalysis } from "../lib/aiAnalyzer";

describe("aiAnalyzer", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.OPENROUTER_API_KEY = "test-key-123";
	});

	it("uses qwen/qwen3.6-plus:free and returns analysis with metadata", async () => {
		const mockChatSend = vi.fn().mockResolvedValue({
			choices: [
				{
					message: {
						content:
							"Báo cáo phân tích chạy (Analysis by AI)\nTest phân tích chi tiết",
					},
				},
			],
			usage: {
				total_tokens: 999,
			},
		});

		const mockClient = {
			chat: { send: mockChatSend },
		};

		const result = await generateAnalysis("test context", mockClient as any);

		expect(mockChatSend).toHaveBeenCalledWith(
			expect.objectContaining({
				chatRequest: expect.objectContaining({
					model: "qwen/qwen3.6-plus:free",
				}),
			}),
		);

		expect(result.model).toBe("qwen/qwen3.6-plus:free");
		expect(result.tokensUsed).toBe(999);
		expect(result.analysis).toContain("Báo cáo phân tích chạy");
	});

	it("retries once on rate-limit errors", async () => {
		const error = new Error("429 rate limit exceeded");

		const mockChatSend = vi
			.fn()
			.mockRejectedValueOnce(error)
			.mockResolvedValueOnce({
				choices: [
					{
						message: {
							content: "Báo cáo phân tích chạy sau retry",
						},
					},
				],
				usage: {
					total_tokens: 500,
				},
			});

		const mockClient = {
			chat: { send: mockChatSend },
		};

		const result = await generateAnalysis("test context", mockClient as any);

		// Should have called send twice (initial + retry)
		expect(mockChatSend).toHaveBeenCalledTimes(2);
		expect(result.analysis).toContain("Báo cáo phân tích chạy sau retry");
	});

	it("throws after retry if provider still fails", async () => {
		const mockChatSend = vi
			.fn()
			.mockRejectedValueOnce(new Error("429 rate limit"))
			.mockRejectedValueOnce(new Error("429 rate limit again"));

		const mockClient = {
			chat: { send: mockChatSend },
		};

		await expect(
			generateAnalysis("test context", mockClient as any),
		).rejects.toThrow(/rate limit/i);
		expect(mockChatSend).toHaveBeenCalledTimes(2);
	});

	it("throws error when OPENROUTER_API_KEY is missing", async () => {
		process.env.OPENROUTER_API_KEY = "";
		await expect(generateAnalysis("context")).rejects.toThrow(
			/OPENROUTER_API_KEY/,
		);
	});

	it("throws error when response has no choices", async () => {
		const mockClient = {
			chat: {
				send: vi.fn().mockResolvedValue({
					choices: [],
					usage: { total_tokens: 0 },
				}),
			},
		};

		await expect(
			generateAnalysis("context", mockClient as any),
		).rejects.toThrow(/No content in OpenRouter response/);
	});
});
