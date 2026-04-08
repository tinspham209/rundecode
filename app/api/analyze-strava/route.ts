import { NextResponse } from "next/server";
import { generateAnalysis, FREE_MODELS } from "../../../lib/aiAnalyzer";
import { buildStravaPromptSegments } from "../../../lib/buildPromptContext";
import type {
	AthleteProfile,
	MonthlyContext,
	StravaAthleteStats,
	StravaExtractedActivity,
	WeeklyContext,
} from "../../../lib/stravaTypes";

type JsonError = { error: string };

type AnalyzeStravaBody = {
	model?: string;
	profile?: AthleteProfile | null;
	athleteStats?: StravaAthleteStats | null;
	monthlyContext?: MonthlyContext | null;
	weeklyContext?: WeeklyContext | null;
	activity?: StravaExtractedActivity;
};

function toPace(distanceKm: number, movingTimeSec: number): string {
	if (distanceKm <= 0 || movingTimeSec <= 0) {
		return "0'00\"/km";
	}
	const secPerKm = movingTimeSec / distanceKm;
	const minutes = Math.floor(secPerKm / 60);
	const seconds = Math.round(secPerKm % 60)
		.toString()
		.padStart(2, "0");
	return `${minutes}'${seconds}"/km`;
}

function secondsToClock(value: number): string {
	const safe = Math.max(0, Math.round(value));
	const hh = Math.floor(safe / 3600)
		.toString()
		.padStart(2, "0");
	const mm = Math.floor((safe % 3600) / 60)
		.toString()
		.padStart(2, "0");
	const ss = Math.floor(safe % 60)
		.toString()
		.padStart(2, "0");
	return `${hh}:${mm}:${ss}`;
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as AnalyzeStravaBody;
		const activity = body.activity;

		if (!activity) {
			return NextResponse.json<JsonError>(
				{ error: "Missing activity payload." },
				{ status: 400 },
			);
		}

		const model =
			body.model && FREE_MODELS.includes(body.model)
				? body.model
				: FREE_MODELS[0];

		const [systemPrompt, structuredContext, guardrails] =
			buildStravaPromptSegments({
				profile: body.profile ?? null,
				athleteStats: body.athleteStats ?? null,
				monthlyContext: body.monthlyContext ?? null,
				weeklyContext: body.weeklyContext ?? null,
				activity,
			});

		const analysisResponse = await generateAnalysis(
			`${structuredContext}\n\n${guardrails}`,
			undefined,
			model,
			systemPrompt,
		);

		return NextResponse.json({
			analysis: analysisResponse.analysis,
			metadata: {
				distance: activity.session.totalDistanceKm,
				pace: toPace(
					activity.session.totalDistanceKm,
					activity.session.movingTimeSec,
				),
				time: secondsToClock(activity.session.movingTimeSec),
				avg_hr: activity.session.avgHeartRate,
				max_hr: activity.session.maxHeartRate,
				cadence_spm: activity.session.avgCadenceSpm,
				calories: activity.session.totalCalories,
				elevation_gain_m: activity.session.totalAscent,
				start_time: activity.session.startTime,
			},
			model: analysisResponse.model,
			tokensUsed: analysisResponse.tokensUsed ?? null,
			availableModels: FREE_MODELS,
		});
	} catch (error) {
		console.log("🫁 ~ POST ~ error:", error);

		const message =
			error instanceof Error
				? error.message
				: "Không thể phân tích hoạt động Strava lúc này.";

		const status = /429|rate\s*limit/i.test(message) ? 429 : 500;
		return NextResponse.json<JsonError>({ error: message }, { status });
	}
}
