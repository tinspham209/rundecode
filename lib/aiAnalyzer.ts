import { OpenRouter } from "@openrouter/sdk";
import { RUN_ANALYSIS_SYSTEM_PROMPT } from "../src/prompts/runAnalysisSystemPrompt";

// List of free models to try in order
export const FREE_MODELS = [
	"qwen/qwen3.6-plus:free",
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
];

const DEFAULT_MODEL = FREE_MODELS[0];

export type AnalysisResponse = {
	analysis: string;
	tokensUsed?: number;
	model: string;
};

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
): Promise<AnalysisResponse> {
	const c = client ?? createClient();

	const messages = [
		{ role: "system" as const, content: RUN_ANALYSIS_SYSTEM_PROMPT },
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
	response: any,
	model: string = DEFAULT_MODEL,
): AnalysisResponse {
	const content =
		(response as any)?.chatResult?.choices?.[0]?.message?.content ??
		(response as any)?.choices?.[0]?.message?.content;

	if (!content) {
		throw new Error("No content in OpenRouter response");
	}

	return {
		analysis: content,
		model,
		tokensUsed: response.usage?.total_tokens,
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
