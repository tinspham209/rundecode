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
			<div
				style={{
					height: 360,
					borderRadius: 16,
					background: "rgba(255,255,255,0.04)",
					border: "1px solid rgba(255,255,255,0.08)",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					color: "#94a3b8",
				}}
			>
				Đang tải bản đồ...
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
					showError(payload.error ?? "Không thể tải lại danh sách hoạt động.");
					return;
				}

				if (cancelled) return;
				setActivities((payload.activities ?? []) as StravaActivity[]);
			} catch {
				if (!cancelled) {
					showError("Lỗi mạng khi tải hoạt động Strava.");
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
					showError(payload.error ?? "Không thể tải activity detail.");
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
					showError("Lỗi mạng khi tải activity detail.");
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
				showError("Bạn chưa đăng nhập Strava.");
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
			toast.success("AI analysis đã sẵn sàng.");
		} catch (err) {
			if (err instanceof Error && err.name === "AbortError") return;
			showError("Lỗi mạng khi phân tích hoạt động Strava.");
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
			showError("Vui lòng phân tích hoạt động trước khi sync lên Strava.");
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
				showError("Bạn chưa đăng nhập Strava.");
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
				showError(payload.error ?? "Không thể sync mô tả lên Strava.");
				setSyncStatus(activity.id, "error");
				return;
			}

			updateActivityDescription(activity.id, analysisEntry.analysis);
			setSyncStatus(activity.id, "success");
			toast.success("Đã sync mô tả lên Strava.");
		} catch (err) {
			if (err instanceof Error && err.name === "AbortError") return;
			showError("Lỗi mạng khi sync mô tả lên Strava.");
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
			<main
				style={{ maxWidth: 960, margin: "0 auto", padding: "2.5rem 1.5rem" }}
			>
				<p style={{ color: "#94a3b8" }}>
					Bạn cần đăng nhập Strava trước.{" "}
					<Link href="/activities">Quay lại activities</Link>
				</p>
			</main>
		);
	}

	if (!Number.isFinite(id)) {
		return (
			<main
				style={{ maxWidth: 960, margin: "0 auto", padding: "2.5rem 1.5rem" }}
			>
				<p style={{ color: "#fda4af" }}>Activity id không hợp lệ.</p>
			</main>
		);
	}

	if (!activity) {
		return (
			<main
				style={{ maxWidth: 960, margin: "0 auto", padding: "2.5rem 1.5rem" }}
			>
				<Link
					href="/activities"
					style={{ color: "#f8fafc", textDecoration: "none" }}
				>
					<ArrowLeft
						size={16}
						style={{ verticalAlign: "middle", marginRight: 8 }}
					/>
					Back to activities
				</Link>
				<p style={{ marginTop: "1rem", color: "#94a3b8" }}>
					{fetchingFallback || fetchingDetail
						? "Đang tải hoạt động..."
						: "Không tìm thấy hoạt động này trong danh sách gần đây."}
				</p>
			</main>
		);
	}

	return (
		<main
			style={{
				maxWidth: 1320,
				margin: "0 auto",
				padding: "2rem 1.5rem 2.5rem",
			}}
		>
			<div style={{ marginBottom: "1.5rem" }}>
				<Link
					href="/activities"
					style={{
						display: "inline-flex",
						alignItems: "center",
						gap: "0.5rem",
						color: "#e2e8f0",
						textDecoration: "none",
						fontWeight: 600,
					}}
				>
					<ArrowLeft size={16} />
					Back to activities
				</Link>
			</div>

			<header
				style={{
					display: "grid",
					gap: "0.85rem",
					marginBottom: "1.5rem",
				}}
			>
				<div
					style={{
						display: "inline-flex",
						alignItems: "center",
						gap: "0.5rem",
						padding: "0.45rem 0.8rem",
						borderRadius: 999,
						background: "rgba(249,115,22,0.16)",
						border: "1px solid rgba(249,115,22,0.24)",
						color: "#fdba74",
						fontSize: "0.82rem",
						fontWeight: 700,
						width: "fit-content",
					}}
				>
					{formatSportType(activity)}
				</div>
				<div>
					<h1
						style={{
							margin: 0,
							fontWeight: 800,
							fontSize: "clamp(2rem, 4vw, 3rem)",
							color: "#fff",
							letterSpacing: "-0.03em",
						}}
					>
						{activity.name}
					</h1>
					<p
						style={{ margin: "0.55rem 0 0", color: "#94a3b8", lineHeight: 1.7 }}
					>
						{formatDateTimeGmt7(activity)} · Activity detail synced from Strava.
					</p>
					{activity.description ? (
						<p
							style={{
								margin: "0.75rem 0 0",
								color: "#cbd5e1",
								lineHeight: 1.7,
							}}
						>
							{activity.description}
						</p>
					) : null}
				</div>
			</header>

			<section
				className="activity-detail-grid"
				style={{ display: "grid", gap: "1.5rem", alignItems: "start" }}
			>
				<div
					className="activity-visual-stack"
					style={{ display: "grid", gap: "1rem" }}
				>
					<Card style={{ padding: "1rem", borderRadius: 18 }}>
						{routeCoordinates.length >= 2 ? (
							<div style={{ borderRadius: 16, overflow: "hidden" }}>
								<DynamicRouteMap coordinates={routeCoordinates} />
							</div>
						) : (
							<div
								style={{
									height: 360,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									color: "#94a3b8",
								}}
							>
								Indoor run / không có polyline route
							</div>
						)}
					</Card>

					<div
						className="activity-metrics-grid"
						style={{
							display: "grid",
							gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
							gap: "1rem",
						}}
					>
						<DetailMetric
							label="Distance"
							value={`${(activity.distance / 1000).toFixed(2)} km`}
						/>
						<DetailMetric
							label="Pace"
							value={toPace(activity.distance / 1000, activity.moving_time)}
						/>
						<DetailMetric
							label="Elevation Gain"
							value={`${Math.round(activity.total_elevation_gain)} m`}
						/>
						<DetailMetric
							label="Avg HR"
							value={formatHeartRate(activity.average_heartrate)}
						/>
						<DetailMetric
							label="Avg Cadence"
							value={formatCadence(activity.average_cadence)}
						/>
						<DetailMetric label="Calories" value={formatCalories(activity)} />
					</div>

					<Card style={{ padding: "1.25rem", borderRadius: 18 }}>
						<h2
							style={{
								margin: 0,
								color: "#fff",
								fontSize: "1.15rem",
								fontWeight: 700,
							}}
						>
							Additional activity data
						</h2>
						<div
							className="activity-extra-grid"
							style={{
								display: "grid",
								gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
								gap: "0.85rem 1rem",
								marginTop: "1rem",
							}}
						>
							<DetailMetaRow
								label="Sport type"
								value={formatSportType(activity)}
							/>
							<DetailMetaRow
								label="Local time (GMT+7)"
								value={formatDateTimeGmt7(activity)}
							/>
							<DetailMetaRow
								label="Avg speed"
								value={formatSpeedAsPace(activity.average_speed)}
							/>
							<DetailMetaRow
								label="Max speed"
								value={formatSpeedAsPace(activity.max_speed)}
							/>
							<DetailMetaRow
								label="Avg watts"
								value={formatWatts(activity.average_watts)}
							/>
							<DetailMetaRow
								label="Max watts"
								value={formatWatts(activity.max_watts)}
							/>
							<DetailMetaRow
								label="Max HR"
								value={formatHeartRate(activity.max_heartrate)}
							/>
							<DetailMetaRow
								label="Elevation high"
								value={formatMeters(activity.elev_high)}
							/>
							<DetailMetaRow
								label="Elevation low"
								value={formatMeters(activity.elev_low)}
							/>
							<DetailMetaRow
								label="Elapsed time"
								value={formatDuration(activity.elapsed_time)}
							/>
						</div>
					</Card>
				</div>

				<Card
					className="analysis-panel"
					style={{ padding: "1.25rem", borderRadius: 18 }}
				>
					<h2
						style={{
							margin: "0 0 1rem",
							color: "#fff",
							fontSize: "1.7rem",
							fontWeight: 700,
						}}
					>
						AI Analysis
					</h2>

					<label
						htmlFor="ai-model-select"
						style={{
							display: "block",
							marginBottom: "0.5rem",
							color: "#cbd5e1",
							fontSize: "0.9rem",
						}}
					>
						Select AI Model
					</label>
					<select
						id="ai-model-select"
						value={selectedModel}
						onChange={(event) => setSelectedModel(event.target.value)}
						style={{
							width: "100%",
							padding: "0.8rem 1rem",
							borderRadius: 12,
							border: "1px solid rgba(255,255,255,0.12)",
							background: "rgba(15,23,42,0.72)",
							color: "#e2e8f0",
							fontSize: "0.95rem",
							marginBottom: "1rem",
						}}
					>
						{FREE_MODELS.map((model) => (
							<option key={model} value={model}>
								{model}
							</option>
						))}
					</select>

					<Button
						type="button"
						onClick={onAnalyze}
						disabled={loading}
						style={{
							width: "100%",
							padding: "0.95rem 1.2rem",
							fontWeight: 700,
							background: "linear-gradient(135deg,#f97316,#f59e0b)",
							border: "none",
							borderRadius: 12,
							marginBottom: "1.25rem",
						}}
					>
						{loading ? "Generating..." : "Generate Report"}
					</Button>

					{loading ? (
						<LoadingSpinner message="AI đang phân tích dữ liệu chạy..." />
					) : (
						<div
							style={{
								borderRadius: 16,
								border: "1px solid rgba(255,255,255,0.08)",
								background: "rgba(2,6,23,0.45)",
								padding: "1rem",
							}}
						>
							<textarea
								aria-label="Activity analysis"
								readOnly
								value={
									analysisEntry?.analysis ??
									"Generate a report to see your AI analysis here."
								}
								style={{
									width: "100%",
									minHeight: 320,
									border: "none",
									outline: "none",
									resize: "vertical",
									background: "transparent",
									color: "#e2e8f0",
									fontSize: "0.95rem",
									lineHeight: 1.7,
									fontFamily: "inherit",
								}}
							/>
						</div>
					)}

					<Button
						type="button"
						onClick={onSyncDescription}
						disabled={
							!analysisEntry?.analysis || syncingActivityId === activity.id
						}
						style={{
							width: "100%",
							padding: "0.95rem 1.2rem",
							fontWeight: 700,
							background: "linear-gradient(135deg,#f97316,#f43f5e)",
							border: "none",
							borderRadius: 12,
							marginTop: "1rem",
						}}
					>
						{syncingActivityId === activity.id
							? "Đang sync..."
							: "Sync to Strava"}
					</Button>

					{syncStatusById[activity.id] === "success" ? (
						<p
							style={{
								margin: "0.75rem 0 0",
								color: "#6ee7b7",
								fontSize: "0.82rem",
							}}
						>
							Đã sync mô tả thành công.
						</p>
					) : null}
					{syncStatusById[activity.id] === "error" ? (
						<p
							style={{
								margin: "0.75rem 0 0",
								color: "#fda4af",
								fontSize: "0.82rem",
							}}
						>
							Sync thất bại, vui lòng thử lại.
						</p>
					) : null}
				</Card>
			</section>

			<style>{`
				.activity-detail-grid {
					grid-template-columns: minmax(0, 1fr) minmax(360px, 0.95fr);
				}

				@media (max-width: 960px) {
					.activity-detail-grid {
						grid-template-columns: 1fr;
					}

					.analysis-panel {
						order: -1;
					}

					.activity-metrics-grid {
						grid-template-columns: repeat(2, minmax(0, 1fr));
					}

					.activity-extra-grid {
						grid-template-columns: 1fr 1fr;
					}
				}

				@media (max-width: 640px) {
					.activity-metrics-grid {
						grid-template-columns: 1fr 1fr;
					}

					.activity-extra-grid {
						grid-template-columns: 1fr;
					}
				}
			`}</style>
		</main>
	);
}

function DetailMetric({ label, value }: { label: string; value: string }) {
	return (
		<Card style={{ padding: "1rem", borderRadius: 16 }}>
			<p style={{ margin: 0, fontSize: "0.82rem", color: "#94a3b8" }}>
				{label}
			</p>
			<p
				style={{
					margin: "0.35rem 0 0",
					fontSize: "1.6rem",
					fontWeight: 800,
					color: "#fff",
				}}
			>
				{value}
			</p>
		</Card>
	);
}

function DetailMetaRow({ label, value }: { label: string; value: string }) {
	return (
		<div
			style={{
				padding: "0.85rem 0.95rem",
				borderRadius: 14,
				background: "rgba(15,23,42,0.45)",
				border: "1px solid rgba(255,255,255,0.08)",
			}}
		>
			<p style={{ margin: 0, fontSize: "0.78rem", color: "#94a3b8" }}>
				{label}
			</p>
			<p
				style={{
					margin: "0.35rem 0 0",
					fontSize: "0.95rem",
					fontWeight: 600,
					color: "#e2e8f0",
					lineHeight: 1.5,
				}}
			>
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

function formatWatts(value?: number): string {
	return Number.isFinite(value) ? `${Math.round(value ?? 0)} W` : "N/A";
}

function formatMeters(value?: number): string {
	return Number.isFinite(value) ? `${Math.round(value ?? 0)} m` : "N/A";
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
