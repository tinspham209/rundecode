"use client";

import React, {
	useCallback,
	useEffect,
	useMemo,
	useState,
	useRef,
} from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import polyline from "@mapbox/polyline";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { LoadingSpinner } from "./LoadingSpinner";
import { FREE_MODELS } from "../lib/aiAnalyzer";
import { extractStravaActivityData } from "../lib/stravaActivityExtractor";
import type { StravaActivity, StravaStreamsByType } from "../lib/stravaTypes";
import { useAnalysisStore } from "../stores/analysisStore";
import { useAuthStore } from "../stores/authStore";
import { useProfileStore } from "../stores/profileStore";
import { useStravaStore } from "../stores/stravaStore";
import { useStravaToken } from "../hooks/useStravaToken";

const DynamicRouteMap = dynamic(
	() => import("./ActivityRouteMap").then((mod) => mod.ActivityRouteMap),
	{
		ssr: false,
		loading: () => (
			<div className="h-[360px] rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
				Loading map...
			</div>
		),
	},
);

type ActivityDetailPageClientProps = {
	activityId: string;
};

export function ActivityDetailPageClient({
	activityId,
}: ActivityDetailPageClientProps) {
	const id = Number(activityId);
	const abortControllerRef = useRef<AbortController | null>(null);

	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const { ensureToken } = useStravaToken();

	const profile = useProfileStore((s) => s.profile);
	const athleteStats = useProfileStore((s) => s.athleteStats);

	const activities = useStravaStore((s) => s.activities);
	const selectedActivity = useStravaStore((s) => s.selectedActivity);
	const monthlyContext = useStravaStore((s) => s.monthlyContext);
	const weeklyContext = useStravaStore((s) => s.weeklyContext);
	const syncingActivityId = useStravaStore((s) => s.syncingActivityId);
	const activityAnalysisById = useStravaStore((s) => s.activityAnalysisById);
	const syncStatusById = useStravaStore((s) => s.syncStatusById);
	const setActivities = useStravaStore((s) => s.setActivities);
	const setSelectedActivity = useStravaStore((s) => s.setSelectedActivity);
	const setExtractedActivity = useStravaStore((s) => s.setExtractedActivity);
	const setSyncingActivityId = useStravaStore((s) => s.setSyncingActivityId);
	const setActivityAnalysis = useStravaStore((s) => s.setActivityAnalysis);
	const setSyncStatus = useStravaStore((s) => s.setSyncStatus);
	const updateActivityDescription = useStravaStore(
		(s) => s.updateActivityDescription,
	);

	const selectedModel = useAnalysisStore((s) => s.selectedModel);
	const setSelectedModel = useAnalysisStore((s) => s.setSelectedModel);
	const setLoading = useAnalysisStore((s) => s.setLoading);
	const loading = useAnalysisStore((s) => s.loading);

	const [activityDetail, setActivityDetail] = useState<StravaActivity | null>(
		null,
	);
	const [fetchingFallback, setFetchingFallback] = useState(false);
	const [fetchingDetail, setFetchingDetail] = useState(false);

	const baseActivity = useMemo(
		() =>
			activities.find((item) => item.id === id) ??
			(selectedActivity?.id === id ? selectedActivity : null),
		[activities, id, selectedActivity],
	);

	const activity = useMemo(
		() => (activityDetail?.id === id ? activityDetail : baseActivity),
		[activityDetail, baseActivity, id],
	);

	const analysisEntry = activityAnalysisById[id];
	const routeCoordinates = useMemo(
		() => decodePolyline(activity?.map?.summary_polyline ?? null),
		[activity?.map?.summary_polyline],
	);

	const showError = useCallback((message: string) => {
		toast.error(message);
	}, []);

	useEffect(() => {
		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, []);

	useEffect(() => {
		if (!isAuthenticated || baseActivity || !Number.isFinite(id)) return;

		let cancelled = false;

		const hydrateActivity = async () => {
			setFetchingFallback(true);
			try {
				const token = await ensureToken();
				if (!token) return;

				const response = await fetch("/api/strava/activities?mode=list", {
					headers: { authorization: `Bearer ${token}` },
				});
				const payload = await response.json();
				if (!response.ok) {
					showError(payload.error ?? "Failed to reload activity list.");
					return;
				}

				if (cancelled) return;
				setActivities((payload.activities ?? []) as StravaActivity[]);
			} catch {
				if (!cancelled) {
					showError("Network error while loading Strava activities.");
				}
			} finally {
				if (!cancelled) {
					setFetchingFallback(false);
				}
			}
		};

		void hydrateActivity();

		return () => {
			cancelled = true;
		};
	}, [
		baseActivity,
		ensureToken,
		id,
		isAuthenticated,
		setActivities,
		showError,
	]);

	useEffect(() => {
		if (!isAuthenticated || !Number.isFinite(id)) return;
		if (activityDetail?.id === id || fetchingDetail) return;

		let cancelled = false;

		const hydrateDetail = async () => {
			setFetchingDetail(true);
			try {
				const token = await ensureToken();
				if (!token) return;

				const response = await fetch(`/api/strava/activities/${id}`, {
					headers: { authorization: `Bearer ${token}` },
				});
				const payload = await response.json();
				if (!response.ok) {
					showError(payload.error ?? "Failed to load activity detail.");
					return;
				}

				if (cancelled) return;
				const detail = payload.activity as StravaActivity;
				setActivityDetail(detail);
				setSelectedActivity(detail);
				if (activities.some((item) => item.id === detail.id)) {
					setActivities(
						activities.map((item) =>
							item.id === detail.id ? { ...item, ...detail } : item,
						),
					);
				}
			} catch {
				if (!cancelled) {
					showError("Network error while loading activity detail.");
				}
			} finally {
				if (!cancelled) {
					setFetchingDetail(false);
				}
			}
		};

		void hydrateDetail();

		return () => {
			cancelled = true;
		};
	}, [
		activities,
		activityDetail?.id,
		ensureToken,
		fetchingDetail,
		id,
		isAuthenticated,
		setActivities,
		setSelectedActivity,
		showError,
	]);

	const onAnalyze = useCallback(async () => {
		if (!activity) return;

		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}
		const controller = new AbortController();
		abortControllerRef.current = controller;

		try {
			const token = await ensureToken();
			if (!token) {
				showError("You are not logged in to Strava.");
				return;
			}

			setLoading(true);

			const streamsRes = await fetch(`/api/strava/streams?id=${activity.id}`, {
				headers: { authorization: `Bearer ${token}` },
				signal: controller.signal,
			});
			const streamsPayload = await streamsRes.json();
			if (!streamsRes.ok) {
				showError(streamsPayload.error ?? "Không thể tải stream dữ liệu.");
				return;
			}

			const normalizedStreams = normalizeStreams(streamsPayload.streams);
			const extracted = extractStravaActivityData(activity, normalizedStreams);
			setExtractedActivity(extracted);

			const analyzeRes = await fetch("/api/analyze-strava", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					model: selectedModel,
					profile,
					athleteStats,
					monthlyContext,
					weeklyContext,
					activity: extracted,
				}),
				signal: controller.signal,
			});
			const analyzePayload = await analyzeRes.json();
			if (!analyzeRes.ok) {
				showError(analyzePayload.error ?? "Không thể phân tích hoạt động.");
				return;
			}

			setActivityAnalysis(
				activity.id,
				analyzePayload.analysis,
				analyzePayload.metadata,
			);
			toast.success("AI analysis is ready.");
		} catch (err) {
			if (err instanceof Error && err.name === "AbortError") return;
			showError("Network error while analyzing Strava activity.");
		} finally {
			if (!controller.signal.aborted) {
				setLoading(false);
			}
		}
	}, [
		activity,
		athleteStats,
		ensureToken,
		monthlyContext,
		profile,
		selectedModel,
		setActivityAnalysis,
		setExtractedActivity,
		setLoading,
		showError,
		weeklyContext,
	]);

	const onSyncDescription = useCallback(async () => {
		if (!activity || !analysisEntry?.analysis) {
			showError("Please analyze the activity before syncing to Strava.");
			return;
		}

		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}
		const controller = new AbortController();
		abortControllerRef.current = controller;

		setSyncingActivityId(activity.id);
		setSyncStatus(activity.id, "idle");

		try {
			const token = await ensureToken();
			if (!token) {
				showError("You are not logged in to Strava.");
				setSyncStatus(activity.id, "error");
				return;
			}

			const response = await fetch("/api/strava/activity-description", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					activityId: activity.id,
					description: analysisEntry.analysis,
				}),
				signal: controller.signal,
			});
			const payload = await response.json();
			if (!response.ok) {
				showError(payload.error ?? "Failed to sync description to Strava.");
				setSyncStatus(activity.id, "error");
				return;
			}

			updateActivityDescription(activity.id, analysisEntry.analysis);
			setSyncStatus(activity.id, "success");
			toast.success("Description synced to Strava.");
		} catch (err) {
			if (err instanceof Error && err.name === "AbortError") return;
			showError("Network error while syncing to Strava.");
			setSyncStatus(activity.id, "error");
		} finally {
			if (!controller.signal.aborted) {
				setSyncingActivityId(null);
			}
		}
	}, [
		activity,
		analysisEntry?.analysis,
		ensureToken,
		setSyncStatus,
		setSyncingActivityId,
		showError,
		updateActivityDescription,
	]);

	if (!isAuthenticated) {
		return (
			<main className="max-w-[960px] mx-auto px-6 py-10">
				<p className="text-slate-400">
					You need to log in to Strava first.{" "}
					<Link href="/activities" className="text-orange-500 hover:underline">
						Back to activities
					</Link>
				</p>
			</main>
		);
	}

	if (!Number.isFinite(id)) {
		return (
			<main className="max-w-[960px] mx-auto px-6 py-10">
				<p className="text-rose-300">Invalid activity ID.</p>
			</main>
		);
	}

	if (!activity) {
		return (
			<main className="max-w-[960px] mx-auto px-6 py-10">
				<Link
					href="/activities"
					className="text-slate-200 no-underline flex items-center gap-2 hover:text-white transition-colors"
				>
					<ArrowLeft size={16} />
					Back to activities
				</Link>
				<p className="mt-4 text-slate-400">
					{fetchingFallback || fetchingDetail
						? "Loading activity..."
						: "Activity not found in recent list."}
				</p>
			</main>
		);
	}

	return (
		<main className="max-w-[1320px] mx-auto px-6 py-8 pb-10">
			<div className="mb-6">
				<Link
					href="/activities"
					className="inline-flex items-center gap-2 text-slate-200 no-underline font-semibold hover:text-white transition-colors"
				>
					<ArrowLeft size={16} />
					Back to activities
				</Link>
			</div>

			<header className="grid gap-3 mb-6">
				<div>
					<div className="flex flex-row gap-2 flex-wrap items-center">
						<div className="inline-flex justify-center items-center gap-2 p-1 rounded-md bg-orange-500/15 border border-orange-500/25 text-orange-300 text-xs font-bold w-fit h-fit">
							{formatSportType(activity)}
						</div>
						<h1 className="m-0 font-extrabold text-[clamp(2rem,4vw,3rem)] text-white tracking-tight leading-none">
							{activity.name}
						</h1>
					</div>
					<p className="mt-2 text-slate-400 leading-relaxed">
						{formatDateTimeGmt7(activity)} · Activity detail synced from Strava.
					</p>
					{activity.description ? (
						<p className="mt-3 text-slate-300 leading-relaxed">
							{activity.description}
						</p>
					) : null}
				</div>
			</header>

			<section className="grid gap-6 items-start lg:grid-cols-[1fr_560px]">
				{/* Side Column: Activity Context */}
				<div className="flex flex-col gap-6 order-2 lg:order-1">
					<Card className="p-4 rounded-[22px] border-white/10 bg-slate-900/40 overflow-hidden shadow-lg">
						<div className="flex items-center justify-between mb-3 px-1">
							<h3 className="text-white text-sm font-bold uppercase tracking-wider text-slate-400">
								Route Map
							</h3>
						</div>
						{routeCoordinates.length >= 2 ? (
							<div className="rounded-xl overflow-hidden border border-white/5">
								<DynamicRouteMap coordinates={routeCoordinates} />
							</div>
						) : (
							<div className="h-[240px] flex items-center justify-center text-slate-500 text-sm italic border border-dashed border-white/10 rounded-xl">
								No GPS data available
							</div>
						)}
					</Card>

					<div className="grid grid-cols-2 gap-3">
						<DetailMetric
							label="Distance"
							value={`${(activity.distance / 1000).toFixed(2)} km`}
						/>
						<DetailMetric
							label="Pace"
							value={toPace(activity.distance / 1000, activity.moving_time)}
						/>
						<DetailMetric
							label="Elevation"
							value={`${Math.round(activity.total_elevation_gain)} m`}
						/>
						<DetailMetric
							label="Avg HR"
							value={formatHeartRate(activity.average_heartrate)}
						/>
					</div>

					<Card className="p-5 rounded-[22px] border-white/10 bg-slate-900/40 shadow-lg">
						<h3 className="m-0 text-white text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
							Performance Details
						</h3>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<DetailMetaRow
								label="Sport type"
								value={activity.sport_type || "N/A"}
							/>
							<DetailMetaRow
								label="Date time"
								value={formatDateTimeGmt7(activity) || "N/A"}
							/>
							<DetailMetaRow
								label="Avg Cadence"
								value={formatCadence(activity.average_cadence)}
							/>
							<DetailMetaRow
								label="Calories"
								value={formatCalories(activity)}
							/>
							<DetailMetaRow
								label="Max HR"
								value={formatHeartRate(activity.max_heartrate)}
							/>
							<DetailMetaRow
								label="Avg Speed"
								value={formatSpeedAsPace(activity.average_speed)}
							/>
							<DetailMetaRow
								label="Avg watts"
								value={`${activity.average_watts?.toFixed(2) || "N/A"} W`}
							/>

							<DetailMetaRow
								label="Elapsed"
								value={formatDuration(activity.elapsed_time)}
							/>
						</div>
					</Card>
				</div>
				{/* Main Column: AI Analysis */}
				<div className="flex flex-col gap-4 order-1 lg:order-2">
					<Card className="p-5 sm:p-6 rounded-[22px] border-white/10 bg-slate-900/20 backdrop-blur-sm shadow-xl">
						<div className="flex flex-wrap items-center justify-between gap-4 mb-6">
							<h2 className="text-white text-2xl sm:text-3xl font-extrabold tracking-tight">
								AI Analysis
							</h2>

							<div className="flex items-center gap-3">
								<label
									htmlFor="ai-model-select"
									className="hidden sm:block text-slate-400 text-sm font-medium"
								>
									Model:
								</label>
								<select
									id="ai-model-select"
									value={selectedModel}
									onChange={(event) => setSelectedModel(event.target.value)}
									className="px-3 py-2 rounded-xl border border-white/15 bg-slate-900/70 text-slate-200 text-xs sm:text-sm focus:ring-1 focus:ring-orange-500/50 outline-none transition-all"
								>
									{FREE_MODELS.map((model) => (
										<option key={model} value={model}>
											{model.split("/").pop()}
										</option>
									))}
								</select>
							</div>
						</div>

						<Button
							type="button"
							onClick={onAnalyze}
							disabled={loading}
							className="w-full py-4 mb-6 font-bold text-lg bg-gradient-to-br from-orange-500 to-amber-500 border-none rounded-2xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 active:scale-[0.99] transition-all"
						>
							{loading ? "Generating analysis..." : "Generate AI Report"}
						</Button>

						<div className="relative min-h-[400px] lg:min-h-[500px]">
							{loading ? (
								<div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl backdrop-blur-[2px] z-10">
									<LoadingSpinner message="AI is decoding your performance..." />
								</div>
							) : null}

							<div className="rounded-2xl border border-white/10 bg-black/40 p-5 shadow-inner">
								<textarea
									aria-label="Activity analysis"
									readOnly
									value={
										analysisEntry?.analysis ??
										"Select a model and click 'Generate AI Report' to start your analysis."
									}
									className="w-full min-h-[300px] bg-transparent border-none outline-none resize-y text-slate-200 text-base sm:text-lg leading-relaxed font-sans scrollbar-thin scrollbar-thumb-white/10"
								/>
							</div>
						</div>

						<div className="mt-6 flex flex-col sm:flex-row gap-3">
							<Button
								type="button"
								onClick={onSyncDescription}
								disabled={
									!analysisEntry?.analysis || syncingActivityId === activity.id
								}
								className="flex-1 py-4 font-bold bg-gradient-to-br from-orange-600 to-rose-500 border-none rounded-xl shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
							>
								{syncingActivityId === activity.id
									? "Syncing to Strava..."
									: "Sync to Strava Description"}
							</Button>
						</div>

						{syncStatusById[activity.id] === "success" ? (
							<p className="mt-3 text-emerald-400 text-sm text-center font-semibold animate-in fade-in slide-in-from-top-1">
								✓ Sync successful!
							</p>
						) : null}
						{syncStatusById[activity.id] === "error" ? (
							<p className="mt-3 text-rose-300 text-sm text-center font-semibold">
								✕ Sync failed. Please try again.
							</p>
						) : null}
					</Card>
				</div>
			</section>
		</main>
	);
}

function DetailMetric({ label, value }: { label: string; value: string }) {
	return (
		<Card className="p-4 rounded-2xl border-white/10 bg-white/5">
			<p className="m-0 text-xs text-slate-400">{label}</p>
			<p className="mt-1.5 text-2xl font-extrabold text-white">{value}</p>
		</Card>
	);
}

function DetailMetaRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="p-3.5 rounded-xl bg-slate-900/45 border border-white/5">
			<p className="m-0 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
				{label}
			</p>
			<p className="mt-1 text-sm font-semibold text-slate-200 leading-snug">
				{value}
			</p>
		</div>
	);
}

function decodePolyline(value: string | null): [number, number][] {
	if (!value) return [];
	try {
		const decoded = polyline.decode(value) as [number, number][];
		return decoded.map((point) => [point[0], point[1]]);
	} catch {
		return [];
	}
}

function normalizeStreams(raw: unknown): StravaStreamsByType {
	const safe = Array.isArray(raw) ? raw : [];
	const byType = {
		time: [] as number[],
		distance: [] as number[],
		heartrate: [] as number[],
		cadence: [] as number[],
		altitude: [] as number[],
		velocity_smooth: [] as number[],
	};

	for (const stream of safe) {
		if (!stream || typeof stream !== "object") continue;
		const type = (stream as { type?: string }).type;
		const data = (stream as { data?: unknown }).data;
		if (!type || !Array.isArray(data)) continue;

		if (type in byType) {
			(byType as Record<string, number[]>)[type] = data
				.map((value) => Number(value))
				.filter((value) => Number.isFinite(value));
		}
	}

	return byType;
}

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

function formatDateTimeGmt7(activity: StravaActivity): string {
	const date = new Date(activity.start_date);
	if (Number.isNaN(date.getTime())) return "N/A";
	return date.toLocaleString("vi-VN", {
		timeZone: "Asia/Ho_Chi_Minh",
		dateStyle: "medium",
		timeStyle: "short",
	});
}

function formatSportType(activity: StravaActivity): string {
	return activity.sport_type || activity.type || "Run";
}

function formatHeartRate(value?: number): string {
	return Number.isFinite(value) ? `${Math.round(value ?? 0)} bpm` : "N/A";
}

function formatCadence(value?: number): string {
	return Number.isFinite(value) ? `${Math.round((value ?? 0) * 2)} spm` : "N/A";
}

function formatCalories(activity: StravaActivity): string {
	const calories = activity.calories ?? activity.kilojoules;
	return Number.isFinite(calories)
		? `${Math.round(calories ?? 0)} kcal`
		: "N/A";
}

function formatSpeedAsPace(value?: number): string {
	if (!Number.isFinite(value) || (value ?? 0) <= 0) return "N/A";
	const speedKmh = (value ?? 0) * 3.6;
	const paceMinPerKm = 60 / speedKmh;
	const minutes = Math.floor(paceMinPerKm);
	const seconds = Math.round((paceMinPerKm - minutes) * 60)
		.toString()
		.padStart(2, "0");
	return `${minutes}'${seconds}"/km`;
}

function formatDuration(seconds?: number): string {
	if (!Number.isFinite(seconds) || (seconds ?? 0) <= 0) return "N/A";
	const total = Math.round(seconds ?? 0);
	const hours = Math.floor(total / 3600);
	const minutes = Math.floor((total % 3600) / 60);
	const remain = total % 60;
	if (hours > 0) {
		return `${hours}h ${minutes}m ${remain}s`;
	}
	return `${minutes}m ${remain}s`;
}
