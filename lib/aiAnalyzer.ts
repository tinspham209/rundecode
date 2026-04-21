import { OpenRouter } from "@openrouter/sdk";
import { RUN_ANALYSIS_SYSTEM_PROMPT } from "../src/prompts/runAnalysisSystemPrompt";

// List of free models to try in order
export const FREE_MODELS = [
	"openrouter/free",
	"openai/gpt-oss-120b:free",
	"openai/gpt-oss-20b:free",
	"google/gemma-4-31b-it:free",
	"meta-llama/llama-3.3-70b-instruct:free",
	"google/gemma-4-26b-a4b-it:free",
	"google/gemma-3-27b-it:free",
	"qwen/qwen3-next-80b-a3b-instruct:free",
	"z-ai/glm-4.5-air:free",
	"minimax/minimax-m2.5:free",
	"qwen/qwen3-coder:free",
];

const DEFAULT_MODEL = FREE_MODELS[0];

export type AnalysisResponse = {
	analysis: string;
	intensityScore: number;
	recoveryHours: number;
	coachingFlags: string[];
	trainingIntentMatch: boolean;
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

	try {
		// Clean up potential markdown blocks if the model ignored instructions
		let jsonStr = content.trim();

		// Handle cases where AI might add text before or after the JSON block
		const firstBrace = jsonStr.indexOf("{");
		const lastBrace = jsonStr.lastIndexOf("}");

		if (firstBrace !== -1 && lastBrace !== -1) {
			jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
		}

		// Remove markdown code block markers
		jsonStr = jsonStr.replace(/^```json\s*|\s*```$/g, "").trim();

		const parsed = JSON.parse(jsonStr);

		return {
			analysis: parsed.analysisText || content,
			intensityScore: parsed.intensityScore || 0,
			recoveryHours: parsed.recoveryHours || 0,
			coachingFlags: parsed.coachingFlags || [],
			trainingIntentMatch: typeof parsed.trainingIntentMatch === "boolean"
				? parsed.trainingIntentMatch
				: !!parsed.trainingIntentMatch,
			model,
			tokensUsed: totalTokens,
		};
	} catch (e) {
		console.error("Failed to parse AI response as JSON:", e, "Content was:", content);
		// Fallback for legacy or non-conforming responses
		return {
			analysis: content,
			intensityScore: 0,
			recoveryHours: 0,
			coachingFlags: [],
			trainingIntentMatch: false,
			model,
			tokensUsed: totalTokens,
		};
	}
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
