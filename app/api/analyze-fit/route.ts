import { NextResponse } from "next/server";
import { generateAnalysis, FREE_MODELS } from "../../../lib/aiAnalyzer";
import { buildPromptSegments } from "../../../lib/buildPromptContext";
import { parseFitFile, ParseValidationError } from "../../../lib/fitParser";
import { validateFitUpload } from "../../../lib/fitUploadValidation";
import type { AthleteProfile } from "../../../lib/stravaTypes";

type JsonError = { error: string };

function asRecord(value: unknown): Record<string, unknown> {
	return typeof value === "object" && value !== null
		? (value as Record<string, unknown>)
		: {};
}

function firstString(...values: unknown[]): string | undefined {
	for (const value of values) {
		if (typeof value === "string" && value.trim().length > 0) {
			return value;
		}
	}
	return undefined;
}

function extractProviderRawMessage(error: unknown): string | undefined {
	const root = asRecord(error);
	const rootError = asRecord(root.error);
	const rootMetadata = asRecord(root.metadata);
	const rootErrorMetadata = asRecord(rootError.metadata);
	const cause = asRecord(root.cause);
	const causeError = asRecord(cause.error);
	const causeMetadata = asRecord(cause.metadata);
	const causeErrorMetadata = asRecord(causeError.metadata);

	return firstString(
		rootMetadata.raw,
		rootErrorMetadata.raw,
		causeMetadata.raw,
		causeErrorMetadata.raw,
	);
}

function extractErrorCode(error: unknown): number | undefined {
	const root = asRecord(error);
	const rootError = asRecord(root.error);

	const fromRoot = root.code;
	if (typeof fromRoot === "number") {
		return fromRoot;
	}

	const fromNested = rootError.code;
	if (typeof fromNested === "number") {
		return fromNested;
	}

	return undefined;
}

export async function POST(request: Request) {
	try {
		const formData = await request.formData();
		const files = formData.getAll("file");
		const modelParam = formData.get("model") as string | null;
		const profileParam = formData.get("profile") as string | null;
		const profile = safeParseProfile(profileParam);
		const model =
			modelParam && FREE_MODELS.includes(modelParam)
				? modelParam
				: FREE_MODELS[0];

		if (files.length === 0) {
			return NextResponse.json<JsonError>(
				{ error: "File is required." },
				{ status: 400 },
			);
		}

		if (files.length > 1) {
			return NextResponse.json<JsonError>(
				{ error: "Only one file is supported." },
				{ status: 400 },
			);
		}

		const fileEntry = files[0];
		if (!(fileEntry instanceof File)) {
			return NextResponse.json<JsonError>(
				{ error: "Invalid file payload." },
				{ status: 400 },
			);
		}

		const fileBuffer = Buffer.from(await fileEntry.arrayBuffer());
		const validation = validateFitUpload({
			fileName: fileEntry.name,
			mimeType: fileEntry.type,
			fileSize: fileEntry.size,
			fileBytes: fileBuffer,
		});

		if (!validation.ok) {
			return NextResponse.json<JsonError>(
				{ error: validation.error },
				{ status: validation.status },
			);
		}

		const parsed = await parseFitFile(fileBuffer);
		const [systemPrompt, structuredContext, guardrails] = buildPromptSegments(
			parsed,
			profile,
		);
		const analysisResponse = await generateAnalysis(
			`${structuredContext}\n\n${guardrails}`,
			undefined,
			model,
			systemPrompt,
		);

		return NextResponse.json({
			analysis: analysisResponse.analysis,
			intensityScore: analysisResponse.intensityScore,
			recoveryHours: analysisResponse.recoveryHours,
			coachingFlags: analysisResponse.coachingFlags,
			trainingIntentMatch: analysisResponse.trainingIntentMatch,
			metadata: {
				distance: parsed.session.totalDistance,
				pace: parsed.session.avgPace,
				time: parsed.session.totalTime,
				avg_hr: parsed.session.avgHeartRate,
				max_hr: parsed.session.maxHeartRate,
				cadence_spm: parsed.session.avgCadence,
				calories: parsed.session.totalCalories,
				elevation_gain_m: parsed.session.totalAscent,
				start_time: parsed.session.startTime,
			},
			model: analysisResponse.model,
			tokensUsed: analysisResponse.tokensUsed ?? null,
			availableModels: FREE_MODELS,
		});
	} catch (error) {
		if (error instanceof ParseValidationError) {
			return NextResponse.json<JsonError>(
				{ error: error.message },
				{ status: 422 },
			);
		}
		console.log("🫁 ~ POST ~ error:", error);

		const rawProviderMessage = extractProviderRawMessage(error);
		const fallbackError =
			error instanceof Error ? error.message : "Không rõ nguyên nhân";
		const uiMessage =
			rawProviderMessage ??
			`Không thể phân tích lúc này. Vui lòng thử lại sau. Error: ${fallbackError}`;

		const errorCode = extractErrorCode(error);
		const status =
			errorCode === 429 ||
			/429|rate\s*limit|temporarily rate-limited/i.test(uiMessage)
				? 429
				: 500;

		return NextResponse.json<JsonError>({ error: uiMessage }, { status });
	}
}

function safeParseProfile(raw: string | null): AthleteProfile | null {
	if (!raw) {
		return null;
	}

	try {
		const parsed = JSON.parse(raw) as AthleteProfile;
		if (typeof parsed !== "object" || parsed === null) {
			return null;
		}
		return parsed;
	} catch {
		return null;
	}
}
