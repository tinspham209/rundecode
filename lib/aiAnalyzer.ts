import { OpenRouter } from "@openrouter/sdk";
import { RUN_ANALYSIS_SYSTEM_PROMPT } from "../src/prompts/runAnalysisSystemPrompt";

// List of free models to try in order
export const FREE_MODELS = [
	"openai/gpt-oss-120b:free",
	"openai/gpt-oss-20b:free",
	"minimax/minimax-m2.5:free",
	"stepfun/step-3.5-flash:free",
	"nvidia/nemotron-3-super-120b-a12b:free",
	"arcee-ai/trinity-large-preview:free",
	"z-ai/glm-4.5-air:free",
	"qwen/qwen3-coder:free",
	"google/gemma-3-27b-it:free",
	"meta-llama/llama-3.3-70b-instruct:free",
	"openrouter/free",
	"qwen/qwen3.6-plus:free",
];

const DEFAULT_MODEL = FREE_MODELS[0];

export type AnalysisResponse = {
	analysis: string;
	tokensUsed?: number;
	model: string;
};

type ChatMessageContent = {
	message?: {
		content?: string;
	};
};

function asRecord(value: unknown): Record<string, unknown> {
	return typeof value === "object" && value !== null
		? (value as Record<string, unknown>)
		: {};
}

function createClient(): OpenRouter {
	const apiKey = process.env.OPENROUTER_API_KEY;

	if (!apiKey) {
		throw new Error(
			"Missing OPENROUTER_API_KEY environment variable. Get one at https://openrouter.ai/keys",
		);
	}

	return new OpenRouter({ apiKey });
}

export async function generateAnalysis(
	promptContext: string,
	client?: OpenRouter,
	model: string = DEFAULT_MODEL,
	systemPrompt: string = RUN_ANALYSIS_SYSTEM_PROMPT,
): Promise<AnalysisResponse> {
	const c = client ?? createClient();

	const messages = [
		{ role: "system" as const, content: systemPrompt },
		{ role: "user" as const, content: promptContext },
	];

	try {
		const response = await c.chat.send({
			chatRequest: {
				model,
				messages,
				temperature: 0.7,
				topP: 0.9,
				maxTokens: 2000,
				stream: false,
			},
		});

		return toAnalysisResponse(response, model);
	} catch (error) {
		if (!isRateLimitError(error)) {
			throw error;
		}

		// Retry once on rate limit
		const retryResponse = await c.chat.send({
			chatRequest: {
				model,
				messages,
				temperature: 0.7,
				topP: 0.9,
				maxTokens: 2000,
				stream: false,
			},
		});

		return toAnalysisResponse(retryResponse, model);
	}
}

function toAnalysisResponse(
	response: unknown,
	model: string = DEFAULT_MODEL,
): AnalysisResponse {
	const responseRecord = asRecord(response);
	const chatResult = asRecord(responseRecord.chatResult);
	const choices = Array.isArray(chatResult.choices)
		? (chatResult.choices as ChatMessageContent[])
		: Array.isArray(responseRecord.choices)
			? (responseRecord.choices as ChatMessageContent[])
			: [];
	const content = choices[0]?.message?.content;
	const usage = asRecord(responseRecord.usage);
	const totalTokens =
		typeof usage.total_tokens === "number" ? usage.total_tokens : undefined;

	if (!content) {
		throw new Error("No content in OpenRouter response");
	}

	return {
		analysis: content,
		model,
		tokensUsed: totalTokens,
	};
}

function isRateLimitError(error: unknown): boolean {
	if (!(error instanceof Error)) {
		return false;
	}

	const errorMessage = error.message.toLowerCase();
	return (
		errorMessage.includes("429") ||
		errorMessage.includes("rate limit") ||
		errorMessage.includes("too many requests")
	);
}
