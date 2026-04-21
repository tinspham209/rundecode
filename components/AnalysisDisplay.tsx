"use client";

import React, { useMemo, useState } from "react";
import {
	CheckCircle2,
	Copy,
	RotateCcw,
	Zap,
	Timer,
	Activity,
	AlertCircle,
	Target,
	ThumbsUp,
	ThumbsDown,
	MessageSquare,
	RefreshCw,
} from "lucide-react";
import { MetadataSidebar, type Metadata } from "./MetadataSidebar";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useAuthStore } from "../stores/authStore";
import { useStravaStore } from "../stores/stravaStore";
import { useStravaToken } from "../hooks/useStravaToken";
import toast from "react-hot-toast";

type AnalysisDisplayProps = {
	analysis: string;
	intensityScore: number | null;
	recoveryHours: number | null;
	coachingFlags: string[];
	trainingIntentMatch: boolean | null;
	metadata: Metadata;
	onReset: () => void;
};

export function AnalysisDisplay({
	analysis,
	intensityScore,
	recoveryHours,
	coachingFlags,
	trainingIntentMatch,
	metadata,
	onReset,
}: AnalysisDisplayProps) {
	const [analysisText, setAnalysisText] = useState(analysis);

	// Update local state when analysis prop changes (e.g., after new AI generation)
	React.useEffect(() => {
		setAnalysisText(analysis);
	}, [analysis]);
	const [copied, setCopied] = useState(false);
	const [feedback, setFeedback] = useState<"positive" | "negative" | null>(
		null,
	);
	const [feedbackText, setFeedbackText] = useState("");
	const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState(false);
	const [isSyncing, setIsSyncing] = useState(false);

	const { ensureToken } = useStravaToken();
	const updateActivityDetails = useStravaStore((s) => s.updateActivityDetails);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

	const charCount = useMemo(() => analysisText.length, [analysisText]);

	const handleSyncToStrava = async () => {
		if (!metadata.activityId) {
			toast.error("Không tìm thấy activity ID để sync.");
			return;
		}

		if (!isAuthenticated) {
			toast.error("Bạn cần đăng nhập Strava để sync.");
			return;
		}

		setIsSyncing(true);
		try {
			const token = await ensureToken();
			if (!token) {
				toast.error("Không thể lấy token Strava.");
				return;
			}

			// 1. Determine time of day
			const startDate = metadata.start_time
				? new Date(metadata.start_time)
				: new Date();
			const hour = startDate.getHours();
			let timeOfDay = "Morning";
			if (hour >= 4 && hour < 11) timeOfDay = "Morning";
			else if (hour >= 11 && hour < 14) timeOfDay = "Noon";
			else if (hour >= 14 && hour < 18) timeOfDay = "Afternoon";
			else if (hour >= 18 && hour < 22) timeOfDay = "Evening";
			else timeOfDay = "Night";

			// 2. Determine run type from intensity score
			let runType = "Run";
			if (intensityScore !== null) {
				if (intensityScore <= 3) runType = "Easy Run";
				else if (intensityScore <= 5) runType = "Steady Run";
				else if (intensityScore <= 7) runType = "Tempo Run";
				else if (intensityScore <= 9) runType = "Interval Run";
				else runType = "Hard Run";
			}

			const newTitle = `${timeOfDay} ${runType}`;

			const response = await fetch("/api/strava/activity-description", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					activityId: metadata.activityId,
					name: newTitle,
					description: analysisText,
				}),
			});

			const result = await response.json();
			if (!response.ok) {
				throw new Error(result.error || "Failed to sync to Strava");
			}

			updateActivityDetails(metadata.activityId, newTitle, analysisText);
			toast.success("Đã cập nhật tiêu đề và nội dung lên Strava!");
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Lỗi khi sync lên Strava.";
			console.error("Sync error:", error);
			toast.error(message);
		} finally {
			setIsSyncing(false);
		}
	};

	const handleFeedback = (type: "positive" | "negative") => {
		setFeedback(type);
		// In a real app, we would send this to an API
		console.log(`Feedback received: ${type}`);
	};

	const submitDetailedFeedback = () => {
		// In a real app, we would send this to an API
		console.log(`Detailed feedback: ${feedbackText}`);
		setIsFeedbackSubmitted(true);
	};

	const copyToClipboard = async () => {
		await navigator.clipboard.writeText(analysisText);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const getIntensityColor = (score: number) => {
		if (score >= 8) return "text-rose-400 bg-rose-500/10 border-rose-500/20";
		if (score >= 5) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
		return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
	};

	return (
		<section className="flex flex-col gap-6" aria-label="Analysis panel">
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				{intensityScore !== null && (
					<div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2">
						<div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
							<span>Intensity</span>
							<Activity size={14} />
						</div>
						<div className="flex items-baseline gap-2">
							<span className="text-2xl font-black text-white">
								{intensityScore}
							</span>
							<span className="text-slate-500 text-xs">/ 10</span>
						</div>
						<div
							className={`mt-1 text-[10px] px-2 py-0.5 rounded-full border w-fit font-bold ${getIntensityColor(intensityScore)}`}
						>
							{intensityScore >= 8
								? "HIGH"
								: intensityScore >= 5
									? "MODERATE"
									: "LOW"}
						</div>
					</div>
				)}

				{recoveryHours !== null && (
					<div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2">
						<div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
							<span>Recovery</span>
							<Timer size={14} />
						</div>
						<div className="flex items-baseline gap-2">
							<span className="text-2xl font-black text-white">
								{recoveryHours}
							</span>
							<span className="text-slate-500 text-xs">hours</span>
						</div>
					</div>
				)}

				{trainingIntentMatch !== null && (
					<div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2">
						<div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
							<span>Intent Match</span>
							<Target size={14} />
						</div>
						<div className="flex items-center gap-2">
							{trainingIntentMatch ? (
								<Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
									MATCHED
								</Badge>
							) : (
								<Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30">
									MISMATCHED
								</Badge>
							)}
						</div>
					</div>
				)}

				{coachingFlags.length > 0 && (
					<div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2">
						<div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
							<span>AI Flags</span>
							<AlertCircle size={14} />
						</div>
						<div className="flex flex-wrap gap-1">
							{coachingFlags.slice(0, 3).map((flag) => (
								<span
									key={flag}
									className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-slate-300 border border-white/5 uppercase"
								>
									{flag.replace("_", " ")}
								</span>
							))}
							{coachingFlags.length > 3 && (
								<span className="text-[10px] font-bold px-1.5 py-0.5 text-slate-500">
									+{coachingFlags.length - 3}
								</span>
							)}
						</div>
					</div>
				)}
			</div>

			<div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/90 to-slate-950/95 shadow-2xl overflow-hidden">
				<div className="p-6 pb-4">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="m-0 font-bold text-base text-white">
								Báo cáo phân tích chạy (Analysis by AI)
							</h2>
							<p className="mt-1 text-[13px] text-slate-400">
								Có thể chỉnh sửa trước khi copy lên Strava.
							</p>
						</div>
						<Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20">
							<Zap size={10} className="mr-1" />
							PROMPT V2
						</Badge>
					</div>
				</div>

				<div className="px-6 pb-6">
					<label htmlFor="analysis-text" className="sr-only">
						Analysis text
					</label>
					<textarea
						id="analysis-text"
						aria-label="Analysis text"
						value={analysisText}
						onChange={(event) => setAnalysisText(event.target.value)}
						className="w-full min-h-[280px] rounded-xl border border-white/10 bg-black/30 text-slate-200 p-4 text-[14.4px] leading-relaxed resize-vertical focus-visible:ring-2 focus-visible:ring-orange-500/50 outline-none transition-all box-border font-inherit"
					/>

					<div className="mt-4 flex flex-wrap items-center justify-between gap-3">
						<p className="m-0 text-[12px] text-slate-500">{charCount} ký tự</p>
						<div className="flex gap-2">
							<Button
								type="button"
								onClick={handleSyncToStrava}
								disabled={isSyncing}
								className="bg-orange-600 hover:bg-orange-700 text-white border-none"
							>
								{isSyncing ? (
									<RefreshCw size={14} className="mr-2 animate-spin" />
								) : (
									<Zap size={14} className="mr-2" />
								)}
								Sync to Strava
							</Button>
							<Button type="button" onClick={copyToClipboard}>
								<Copy size={14} className="mr-2" />
								Copy to Clipboard
							</Button>
							<Button type="button" variant="secondary" onClick={onReset}>
								<RotateCcw size={14} className="mr-2" />
								Analyze Another Run
							</Button>
						</div>
					</div>

					{copied ? (
						<p
							style={{
								marginTop: "0.625rem",
								fontSize: "0.83rem",
								fontWeight: 600,
								color: "#6ee7b7",
								display: "inline-flex",
								alignItems: "center",
								gap: "0.375rem",
							}}
						>
							<CheckCircle2 size={14} />
							Copied!
						</p>
					) : null}

					{/* Feedback Loop Section */}
					<div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-4">
						{!isFeedbackSubmitted ? (
							<>
								<div className="flex items-center justify-between">
									<p className="text-sm text-slate-400 font-medium">
										Was this analysis accurate?
									</p>
									<div className="flex gap-2">
										<Button
											variant="secondary"
											size="sm"
											className={`h-8 w-8 p-0 rounded-full ${feedback === "positive" ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-slate-400"}`}
											onClick={() => handleFeedback("positive")}
										>
											<ThumbsUp size={14} />
										</Button>
										<Button
											variant="secondary"
											size="sm"
											className={`h-8 w-8 p-0 rounded-full ${feedback === "negative" ? "bg-rose-500/20 text-rose-400" : "bg-white/5 text-slate-400"}`}
											onClick={() => handleFeedback("negative")}
										>
											<ThumbsDown size={14} />
										</Button>
									</div>
								</div>

								{feedback === "negative" && (
									<div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
										<textarea
											placeholder="What was wrong? Help us improve..."
											value={feedbackText}
											onChange={(e) => setFeedbackText(e.target.value)}
											className="w-full min-h-[80px] rounded-lg bg-black/40 border border-white/10 p-3 text-sm text-slate-200 outline-none focus:border-white/20 transition-colors"
										/>
										<Button
											size="sm"
											onClick={submitDetailedFeedback}
											className="self-end"
										>
											<MessageSquare size={14} className="mr-2" />
											Submit Feedback
										</Button>
									</div>
								)}
							</>
						) : (
							<div className="flex items-center gap-2 text-emerald-400 text-sm font-medium animate-in zoom-in-95">
								<CheckCircle2 size={16} />
								Thank you for your feedback!
							</div>
						)}
					</div>
				</div>
			</div>

			<MetadataSidebar metadata={metadata} />
		</section>
	);
}
