"use client";

import React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { AthleteProfileForm } from "./AthleteProfileForm";
import { ActivityList } from "./ActivityList";
import { FREE_MODELS } from "../lib/aiAnalyzer";
import {
	parseStravaSessionFromSearch,
	shouldRefreshToken,
} from "../lib/stravaAuth";
import { buildStravaMonthlyWeeklyContext } from "../lib/stravaContextBuilder";
import { extractStravaActivityData } from "../lib/stravaActivityExtractor";
import type {
	AthleteProfile,
	StravaActivity,
	StravaAthleteStats,
	StravaStreamsByType,
} from "../lib/stravaTypes";
import { useAnalysisStore } from "../stores/analysisStore";
import { useAuthStore } from "../stores/authStore";
import { useProfileStore } from "../stores/profileStore";
import { useStravaStore } from "../stores/stravaStore";

export function StravaPanel() {
	const searchParams = useSearchParams();

	const athlete = useAuthStore((s) => s.athlete);
	const accessToken = useAuthStore((s) => s.accessToken);
	const refreshToken = useAuthStore((s) => s.refreshToken);
	const expiresAt = useAuthStore((s) => s.expiresAt);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const setSession = useAuthStore((s) => s.setSession);
	const clearSession = useAuthStore((s) => s.clearSession);

	const profile = useProfileStore((s) => s.profile);
	const athleteStats = useProfileStore((s) => s.athleteStats);
	const setProfile = useProfileStore((s) => s.setProfile);
	const setAthleteStats = useProfileStore((s) => s.setAthleteStats);
	const clearProfile = useProfileStore((s) => s.clearProfile);

	const activities = useStravaStore((s) => s.activities);
	const monthlyContext = useStravaStore((s) => s.monthlyContext);
	const weeklyContext = useStravaStore((s) => s.weeklyContext);
	const fetchingActivities = useStravaStore((s) => s.fetchingActivities);
	const analyzingActivityId = useStravaStore((s) => s.analyzingActivityId);
	const setActivities = useStravaStore((s) => s.setActivities);
	const setContexts = useStravaStore((s) => s.setContexts);
	const setSelectedActivity = useStravaStore((s) => s.setSelectedActivity);
	const setExtractedActivity = useStravaStore((s) => s.setExtractedActivity);
	const setFetchingActivities = useStravaStore((s) => s.setFetchingActivities);
	const setAnalyzingActivityId = useStravaStore(
		(s) => s.setAnalyzingActivityId,
	);
	const syncingActivityId = useStravaStore((s) => s.syncingActivityId);
	const activityAnalysisById = useStravaStore((s) => s.activityAnalysisById);
	const syncStatusById = useStravaStore((s) => s.syncStatusById);
	const setSyncingActivityId = useStravaStore((s) => s.setSyncingActivityId);
	const setActivityAnalysis = useStravaStore((s) => s.setActivityAnalysis);
	const setSyncStatus = useStravaStore((s) => s.setSyncStatus);
	const updateActivityDescription = useStravaStore(
		(s) => s.updateActivityDescription,
	);
	const resetStravaStore = useStravaStore((s) => s.reset);

	const selectedModel = useAnalysisStore((s) => s.selectedModel);
	const setSelectedModel = useAnalysisStore((s) => s.setSelectedModel);
	const setLoading = useAnalysisStore((s) => s.setLoading);
	const setResult = useAnalysisStore((s) => s.setResult);
	const setError = useAnalysisStore((s) => s.setError);

	const [bootstrapped, setBootstrapped] = useState(false);
	const [profileFormVisible, setProfileFormVisible] = useState(() => !profile);

	useEffect(() => {
		setProfileFormVisible(!profile);
	}, [profile]);

	const showError = useCallback(
		(message: string) => {
			setError(message);
			toast.error(message);
		},
		[setError],
	);

	useEffect(() => {
		if (bootstrapped) return;

		const session = parseStravaSessionFromSearch(searchParams);
		if (session) {
			setSession(session);
			setBootstrapped(true);
			window.history.replaceState({}, "", window.location.pathname);
			return;
		}

		if (searchParams?.get("strava_auth") === "error") {
			showError("Xác thực Strava thất bại. Vui lòng thử lại.");
			window.history.replaceState({}, "", window.location.pathname);
		}

		setBootstrapped(true);
	}, [bootstrapped, searchParams, setSession, showError]);

	const ensureToken = useCallback(async (): Promise<string | null> => {
		if (!accessToken) return null;
		if (!shouldRefreshToken(expiresAt)) return accessToken;
		if (!refreshToken) return accessToken;

		const response = await fetch("/api/strava/refresh", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ refreshToken }),
		});

		const payload = await response.json();
		if (!response.ok) {
			showError(payload.error ?? "Không thể refresh Strava token.");
			return accessToken;
		}

		setSession({
			athlete,
			accessToken: payload.accessToken,
			refreshToken: payload.refreshToken,
			expiresAt: payload.expiresAt,
		});

		return payload.accessToken;
	}, [accessToken, athlete, expiresAt, refreshToken, setSession, showError]);

	const fetchStats = useCallback(
		async (token: string, athleteId: number) => {
			const response = await fetch(
				`/api/strava/athlete-stats?athleteId=${athleteId}`,
				{
					headers: { authorization: `Bearer ${token}` },
				},
			);

			const payload = await response.json();
			if (!response.ok) return;

			setAthleteStats(payload.stats as StravaAthleteStats);
		},
		[setAthleteStats],
	);

	const onConnectStrava = useCallback(async () => {
		setError(null);
		const response = await fetch("/api/strava/auth-url");
		const payload = await response.json();
		if (!response.ok || !payload.url) {
			showError(payload.error ?? "Không thể khởi tạo Strava OAuth.");
			return;
		}

		window.location.assign(payload.url);
	}, [setError, showError]);

	const onFetchActivities = useCallback(async () => {
		setError(null);
		setFetchingActivities(true);

		try {
			const token = await ensureToken();
			if (!token) {
				showError("Bạn chưa đăng nhập Strava.");
				return;
			}

			const [listRes, contextRes] = await Promise.all([
				fetch("/api/strava/activities?mode=list", {
					headers: { authorization: `Bearer ${token}` },
				}),
				fetch("/api/strava/activities?mode=context", {
					headers: { authorization: `Bearer ${token}` },
				}),
			]);

			const listPayload = await listRes.json();
			const contextPayload = await contextRes.json();

			if (!listRes.ok) {
				showError(listPayload.error ?? "Không thể lấy danh sách hoạt động.");
				return;
			}
			if (!contextRes.ok) {
				showError(contextPayload.error ?? "Không thể lấy dữ liệu context.");
				return;
			}

			const listActivities = (listPayload.activities ?? []) as StravaActivity[];
			const contextActivities = (contextPayload.activities ??
				[]) as StravaActivity[];

			setActivities(listActivities);
			const context = buildStravaMonthlyWeeklyContext(contextActivities);
			setContexts(context.monthly, context.weekly);

			if (athlete?.id) {
				void fetchStats(token, athlete.id);
			}
		} catch {
			showError("Lỗi mạng khi tải hoạt động Strava.");
		} finally {
			setFetchingActivities(false);
		}
	}, [
		athlete?.id,
		ensureToken,
		fetchStats,
		setActivities,
		setContexts,
		setError,
		setFetchingActivities,
		showError,
	]);

	const onAnalyze = useCallback(
		async (activity: StravaActivity) => {
			setError(null);
			setSelectedActivity(activity);
			setAnalyzingActivityId(activity.id);

			try {
				const token = await ensureToken();
				if (!token) {
					showError("Bạn chưa đăng nhập Strava.");
					return;
				}

				const streamsRes = await fetch(
					`/api/strava/streams?id=${activity.id}`,
					{
						headers: { authorization: `Bearer ${token}` },
					},
				);

				const streamsPayload = await streamsRes.json();
				if (!streamsRes.ok) {
					showError(streamsPayload.error ?? "Không thể tải stream dữ liệu.");
					return;
				}

				const normalizedStreams = normalizeStreams(streamsPayload.streams);
				const extracted = extractStravaActivityData(
					activity,
					normalizedStreams,
				);
				setExtractedActivity(extracted);

				setLoading(true);
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
				});

				const analyzePayload = await analyzeRes.json();
				if (!analyzeRes.ok) {
					showError(analyzePayload.error ?? "Không thể phân tích hoạt động.");
					return;
				}

				setResult(analyzePayload.analysis, analyzePayload.metadata);
				setActivityAnalysis(
					activity.id,
					analyzePayload.analysis,
					analyzePayload.metadata,
				);
			} catch {
				showError("Lỗi mạng khi phân tích hoạt động Strava.");
			} finally {
				setLoading(false);
				setAnalyzingActivityId(null);
			}
		},
		[
			athleteStats,
			ensureToken,
			monthlyContext,
			profile,
			selectedModel,
			setAnalyzingActivityId,
			setError,
			setExtractedActivity,
			setLoading,
			setResult,
			setActivityAnalysis,
			setSelectedActivity,
			showError,
			weeklyContext,
		],
	);

	const onSyncDescription = useCallback(
		async (activity: StravaActivity) => {
			const analysisText = activityAnalysisById[activity.id]?.analysis;
			if (!analysisText) {
				showError("Vui lòng phân tích hoạt động trước khi sync lên Strava.");
				return;
			}

			setError(null);
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
						description: analysisText,
					}),
				});

				const payload = await response.json();
				if (!response.ok) {
					showError(payload.error ?? "Không thể sync mô tả lên Strava.");
					setSyncStatus(activity.id, "error");
					return;
				}

				updateActivityDescription(activity.id, analysisText);
				setSyncStatus(activity.id, "success");
				toast.success("Đã sync mô tả lên Strava.");
			} catch {
				showError("Lỗi mạng khi sync mô tả lên Strava.");
				setSyncStatus(activity.id, "error");
			} finally {
				setSyncingActivityId(null);
			}
		},
		[
			activityAnalysisById,
			ensureToken,
			setError,
			setSyncStatus,
			setSyncingActivityId,
			showError,
			updateActivityDescription,
		],
	);

	const profileDefault = useMemo(() => {
		if (profile) return profile;
		return {
			name: athlete?.firstname ?? "",
			location: [athlete?.city, athlete?.country].filter(Boolean).join(", "),
			runningLevel: "intermediate" as const,
		};
	}, [athlete?.city, athlete?.country, athlete?.firstname, profile]);

	if (!isAuthenticated) {
		return (
			<Card style={{ marginBottom: "1.5rem" }}>
				<CardHeader>
					<CardTitle>Strava integration</CardTitle>
					<CardDescription>
						Kết nối Strava để lấy hoạt động gần đây và phân tích trực tiếp.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button type="button" onClick={onConnectStrava}>
						Login with Strava
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<section style={{ marginBottom: "1.5rem" }}>
			<Card style={{ marginBottom: "1rem" }}>
				<CardHeader>
					<CardTitle>
						Strava đã kết nối{" "}
						{athlete?.firstname ? `· ${athlete.firstname}` : ""}
					</CardTitle>
					<CardDescription>
						Chọn model, tải hoạt động và phân tích từng buổi chạy.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div
						style={{
							display: "flex",
							gap: "0.6rem",
							flexWrap: "wrap",
							alignItems: "center",
						}}
					>
						<select
							value={selectedModel}
							onChange={(event) => setSelectedModel(event.target.value)}
							style={{
								padding: "0.6rem 0.8rem",
								borderRadius: 10,
								border: "1px solid rgba(255,255,255,0.1)",
								background: "rgba(255,255,255,0.04)",
								color: "#e2e8f0",
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
							onClick={onFetchActivities}
							disabled={fetchingActivities}
						>
							{fetchingActivities
								? "Đang tải hoạt động..."
								: "Fetch recent activities"}
						</Button>

						<Button
							type="button"
							variant="secondary"
							onClick={() => {
								clearSession();
								clearProfile();
								resetStravaStore();
							}}
						>
							Disconnect
						</Button>
					</div>

					{monthlyContext && weeklyContext ? (
						<p
							style={{
								margin: "0.75rem 0 0",
								fontSize: "0.78rem",
								color: "#94a3b8",
							}}
						>
							Tuần này: {weeklyContext.runsThisWeek} buổi ·{" "}
							{weeklyContext.totalDistanceKm} km · pace{" "}
							{weeklyContext.avgPacePerKm} — Tháng này:{" "}
							{monthlyContext.totalRuns} buổi · {monthlyContext.totalDistanceKm}{" "}
							km.
						</p>
					) : null}
				</CardContent>
			</Card>

			{profileFormVisible ? (
				<AthleteProfileForm
					defaultValue={profileDefault}
					onSubmit={(value: AthleteProfile) => {
						setProfile(value);
						setProfileFormVisible(false);
						toast.success("Lưu profile thành công.");
					}}
				/>
			) : (
				<div style={{ marginBottom: "1rem" }}>
					<Button
						type="button"
						variant="secondary"
						onClick={() => setProfileFormVisible(true)}
					>
						Edit Profile
					</Button>
				</div>
			)}

			{fetchingActivities ? (
				<p
					style={{
						margin: "0 0 0.75rem",
						color: "#94a3b8",
						fontSize: "0.84rem",
					}}
				>
					Đang tải danh sách hoạt động gần đây...
				</p>
			) : null}

			<ActivityList
				activities={activities}
				onAnalyze={onAnalyze}
				onSyncDescription={onSyncDescription}
				analyzingActivityId={analyzingActivityId}
				syncingActivityId={syncingActivityId}
				activityAnalysisById={activityAnalysisById}
				syncStatusById={syncStatusById}
			/>
		</section>
	);
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
