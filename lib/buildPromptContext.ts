import {
	RUN_ANALYSIS_SYSTEM_PROMPT,
	buildRunAnalysisSystemPrompt,
} from "../src/prompts/runAnalysisSystemPrompt";
import type { ParsedFitData } from "./fitParser";
import {
	getExpectedIntentForDay,
	guessTrainingIntent,
} from "./stravaContextBuilder";
import type {
	AthleteProfile,
	MonthlyContext,
	StravaAthleteStats,
	StravaExtractedActivity,
	WeeklyContext,
} from "./stravaTypes";

const ADDITIONAL_GUARDRAILS = [
	"Luôn giữ nội dung ở dạng plain text, không markdown.",
	"Giữ báo cáo ngắn gọn nhưng đủ ý cho Strava.",
	"Giữ tiêu đề mở đầu: Analysis report by https://rundecode.tinspham.dev",
	"Bắt buộc giữ attribution header: AI model: [insert_correct_your_ai_model_name]",
	"Không bao giờ tự ý thêm disclaimer về độ chính xác hoặc giới hạn của AI, trừ khi có yêu cầu cụ thể từ user.",
].join("\n");

export function buildPromptContext(
	parsed: ParsedFitData,
	profile?: AthleteProfile | null,
): string {
	return buildPromptSegments(parsed, profile)[1];
}

export function buildPromptSegments(
	parsed: ParsedFitData,
	profile?: AthleteProfile | null,
): [string, string, string] {
	const session = parsed.session;
	const lapLines = parsed.laps.map(
		(lap) =>
			`Lap ${lap.lapNumber}: ${lap.distance.toFixed(2)} km, ${lap.time}, HR ${lap.avgHeartRate} bpm, Pace ${lap.avgPace}, Cadence ${lap.avgCadence} spm, Ascent ${lap.totalAscent}m, Descent ${lap.totalDescent}m`,
	);

	const structuredContext = [
		"Dữ liệu chạy hôm nay:",
		`- Thời điểm xuất phát: ${session.startTime}`,
		`- Quãng đường: ${session.totalDistance.toFixed(2)} km`,
		`- Thời gian: ${session.totalTime}`,
		`- Nhịp tim trung bình: ${session.avgHeartRate} bpm (max: ${session.maxHeartRate} bpm, min: ${session.minHeartRate} bpm)`,
		`- Nhịp chân: ${session.avgCadence} spm`,
		`- Chiều dài sải chân trung bình: ${session.avgStepLengthCm} cm`,
		`- Pace trung bình: ${session.avgPace}`,
		`- Calories: ${session.totalCalories} kcal`,
		`- Elevation gain: ${session.totalAscent} m, descent: ${session.totalDescent} m`,
		`- Training effect: ${session.trainingEffect}`,
		`- Pause count: ${parsed.derived.pauseSummary.pauseCount}`,
		`- Pause duration: ${parsed.derived.pauseSummary.totalPauseSeconds} giây`,
		"",
		"Dữ liệu từng lap:",
		...(lapLines.length > 0
			? lapLines
			: ["- Không có dữ liệu lap, ưu tiên phân tích session-level."]),
	].join("\n");

	return [
		profile
			? buildRunAnalysisSystemPrompt(profile, {
					calories: parsed.session.totalCalories,
				})
			: RUN_ANALYSIS_SYSTEM_PROMPT,
		structuredContext,
		ADDITIONAL_GUARDRAILS,
	];
}

export function buildStravaPromptSegments(input: {
	profile: AthleteProfile | null;
	athleteStats: StravaAthleteStats | null;
	monthlyContext: MonthlyContext | null;
	weeklyContext: WeeklyContext | null;
	activity: StravaExtractedActivity;
}): [string, string, string] {
	const activity = input.activity;

	const profileBlock = input.profile
		? [
				"Thông tin runner:",
				`- Tên: ${input.profile.name}`,
				`- Địa điểm: ${input.profile.location}`,
				`- Trình độ chạy: ${input.profile.runningLevel}`,
				`- Tuổi: ${input.profile.age ?? "N/A"}`,
				`- Cân nặng: ${input.profile.weightKg ?? "N/A"} kg`,
				`- Chiều cao: ${input.profile.heightCm ?? "N/A"} cm`,
				`- Max HR: ${input.profile.maxHr ?? "N/A"}`,
				`- Resting HR: ${input.profile.restingHr ?? "N/A"}`,
				`- VO2Max: ${input.profile.vo2max ?? "N/A"}`,
				`- HR Zones: Z1 ${input.profile.hrZones?.z1 ?? "N/A"}, Z2 ${input.profile.hrZones?.z2 ?? "N/A"}, Z3 ${input.profile.hrZones?.z3 ?? "N/A"}, Z4 ${input.profile.hrZones?.z4 ?? "N/A"}, Z5 ${input.profile.hrZones?.z5 ?? "N/A"}`,
			]
		: ["Thông tin runner: chưa có profile đầy đủ."];

	const stats = input.athleteStats;
	const statsBlock = stats
		? [
				"Tổng quan training load:",
				`- 4 tuần gần nhất: ${stats.recent_run_totals?.count ?? 0} buổi, ${((stats.recent_run_totals?.distance ?? 0) / 1000).toFixed(1)} km`,
				`- YTD: ${stats.ytd_run_totals?.count ?? 0} buổi, ${((stats.ytd_run_totals?.distance ?? 0) / 1000).toFixed(1)} km`,
				`- All-time: ${stats.all_run_totals?.count ?? 0} buổi, ${((stats.all_run_totals?.distance ?? 0) / 1000).toFixed(1)} km`,
			]
		: ["Tổng quan training load: chưa có athlete stats."];

	const monthly = input.monthlyContext;
	const weekly = input.weeklyContext;

	const contextBlock = [
		"Ngữ cảnh gần đây:",
		`- Tháng này: ${monthly?.totalRuns ?? 0} buổi, ${monthly?.totalDistanceKm ?? 0} km, pace TB ${monthly?.avgPacePerKm ?? "0'00\"/km"}`,
		`- Tuần này: ${weekly?.runsThisWeek ?? 0} buổi, ${weekly?.totalDistanceKm ?? 0} km, pace TB ${weekly?.avgPacePerKm ?? "0'00\"/km"}`,
		`- ACWR (Acute:Chronic Workload Ratio): ${weekly?.acwr ?? "N/A"} (Ngưỡng an toàn: 0.8 - 1.3)`,
	];

	const session = activity.session;
	const startTime = new Date(session.startTime);
	const expectedIntent = getExpectedIntentForDay(startTime);
	const guessedIntent = guessTrainingIntent(activity);

	const activityBlock = [
		"Dữ liệu buổi chạy được chọn:",
		`- Tên bài: ${session.activityName}`,
		`- Thiết bị: ${session.device_name ?? "N/A"}`,
		`- Thời điểm bắt đầu: ${session.startTime}`,
		`- Dự định tập luyện (theo ngày): ${expectedIntent}`,
		`- Phân loại thực tế (AI đoán): ${guessedIntent}`,
		`- Quãng đường: ${session.totalDistanceKm.toFixed(2)} km`,
		`- Moving time: ${session.movingTimeSec} giây`,
		`- Elapsed time: ${session.elapsedTimeSec} giây`,
		`- HR TB/Max: ${session.avgHeartRate}/${session.maxHeartRate} bpm`,
		`- Cadence TB: ${session.avgCadenceSpm} spm`,
		`- Pace TB: ${session.avgPacePerKm}`,
		`- Tốc độ TB/Max: ${session.average_speed ? (session.average_speed * 3.6).toFixed(2) : "N/A"} / ${session.max_speed ? (session.max_speed * 3.6).toFixed(2) : "N/A"} km/h`,
		`- Calories: ${session.totalCalories}`,
		`- Độ cao (Gain/High/Low): ${session.totalAscent}m / ${session.elev_high ?? "N/A"}m / ${session.elev_low ?? "N/A"}m`,
		`- HR drift: ${activity.derived.hrDrift}`,
		`- Pace variability: ${activity.derived.paceVariability}`,
		`- Cadence variability: ${activity.derived.cadenceVariability}`,
		`- Pause count: ${activity.derived.pauseCount}`,
		`- Pause duration: ${activity.derived.pauseDurationSec} giây`,
	];

	const structuredContext = [
		...profileBlock,
		"",
		...statsBlock,
		"",
		...contextBlock,
		"",
		...activityBlock,
	].join("\n");

	return [
		buildRunAnalysisSystemPrompt(input.profile, {
			calories: activity.session.totalCalories,
		}),
		structuredContext,
		ADDITIONAL_GUARDRAILS,
	];
}
