import { RUN_ANALYSIS_SYSTEM_PROMPT } from "../src/prompts/runAnalysisSystemPrompt";
import type { ParsedFitData } from "./fitParser";

const ADDITIONAL_GUARDRAILS = [
	"Luôn giữ nội dung ở dạng plain text, không markdown.",
	"Giữ báo cáo ngắn gọn nhưng đủ ý cho Strava.",
	"Bắt buộc giữ attribution header: Analysis report by https://rundecode.tinspham.dev, AI model: [insert_correct_your_ai_model_name]",
	"Không bao giờ tự ý thêm disclaimer về độ chính xác hoặc giới hạn của AI, trừ khi có yêu cầu cụ thể từ user.",
].join("\n");

export function buildPromptContext(parsed: ParsedFitData): string {
	return buildPromptSegments(parsed)[1];
}

export function buildPromptSegments(
	parsed: ParsedFitData,
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

	return [RUN_ANALYSIS_SYSTEM_PROMPT, structuredContext, ADDITIONAL_GUARDRAILS];
}
