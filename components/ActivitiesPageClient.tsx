"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Activity, CheckCircle2 } from "lucide-react";
import { AthleteProfileForm } from "./AthleteProfileForm";
import { ActivityList } from "./ActivityList";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { parseStravaSessionFromSearch } from "../lib/stravaAuth";
import { buildStravaMonthlyWeeklyContext } from "../lib/stravaContextBuilder";
import type {
	AthleteProfile,
	StravaActivity,
	StravaAthleteStats,
} from "../lib/stravaTypes";
import { useAuthStore } from "../stores/authStore";
import { useProfileStore } from "../stores/profileStore";
import { useStravaStore } from "../stores/stravaStore";

import { useStravaToken } from "../hooks/useStravaToken";

export function ActivitiesPageClient() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const athlete = useAuthStore((s) => s.athlete);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const setSession = useAuthStore((s) => s.setSession);
	const clearSession = useAuthStore((s) => s.clearSession);

	const { ensureToken } = useStravaToken();

	const profile = useProfileStore((s) => s.profile);
	const athleteStats = useProfileStore((s) => s.athleteStats);
	const isProfileComplete = useProfileStore((s) => s.isProfileComplete);
	const setProfile = useProfileStore((s) => s.setProfile);
	const setAthleteStats = useProfileStore((s) => s.setAthleteStats);
	const clearProfile = useProfileStore((s) => s.clearProfile);

	const activities = useStravaStore((s) => s.activities);
	const monthlyContext = useStravaStore((s) => s.monthlyContext);
	const weeklyContext = useStravaStore((s) => s.weeklyContext);
	const fetchingActivities = useStravaStore((s) => s.fetchingActivities);
	const setActivities = useStravaStore((s) => s.setActivities);
	const setContexts = useStravaStore((s) => s.setContexts);
	const setSelectedActivity = useStravaStore((s) => s.setSelectedActivity);
	const setFetchingActivities = useStravaStore((s) => s.setFetchingActivities);
	const resetStravaStore = useStravaStore((s) => s.reset);

	const [bootstrapped, setBootstrapped] = useState(false);

	const showError = useCallback((message: string) => {
		toast.error(message);
	}, []);

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

	const fetchStats = useCallback(
		async (token: string, athleteId: number) => {
			const response = await fetch(
				`/api/strava/athlete-stats?athleteId=${athleteId}`,
				{ headers: { authorization: `Bearer ${token}` } },
			);

			const payload = await response.json();
			if (!response.ok) return;

			setAthleteStats(payload.stats as StravaAthleteStats);
		},
		[setAthleteStats],
	);

	const onConnectStrava = useCallback(async () => {
		const response = await fetch("/api/strava/auth-url");
		const payload = await response.json();
		if (!response.ok || !payload.url) {
			showError(payload.error ?? "Không thể khởi tạo Strava OAuth.");
			return;
		}

		window.location.assign(payload.url);
	}, [showError]);

	const onFetchActivities = useCallback(async () => {
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
		setFetchingActivities,
		showError,
	]);

	useEffect(() => {
		if (!bootstrapped || !isAuthenticated || !isProfileComplete) return;
		if (fetchingActivities || activities.length > 0) return;

		void onFetchActivities();
	}, [
		activities.length,
		bootstrapped,
		fetchingActivities,
		isAuthenticated,
		isProfileComplete,
		onFetchActivities,
	]);

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
			<main
				style={{ maxWidth: 1200, margin: "0 auto", padding: "2.5rem 1.5rem" }}
			>
				<section style={{ maxWidth: 760, margin: "0 auto" }}>
					<h1
						style={{
							margin: "0 0 1rem",
							fontWeight: 800,
							fontSize: "clamp(2rem, 5vw, 3rem)",
							color: "#fff",
							letterSpacing: "-0.03em",
						}}
					>
						Activities Dashboard
					</h1>
					<p
						style={{ margin: "0 0 1.5rem", color: "#94a3b8", lineHeight: 1.7 }}
					>
						Đăng nhập Strava để xem danh sách hoạt động gần đây và tiếp tục tới
						màn hình phân tích chi tiết.
					</p>

					<Card style={{ border: "2px solid #f97316", borderRadius: 20 }}>
						<CardHeader>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "0.75rem",
								}}
							>
								<div
									style={{
										width: 44,
										height: 44,
										borderRadius: 12,
										background: "linear-gradient(135deg,#f97316,#f59e0b)",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									<Activity size={22} color="#fff" />
								</div>
								<div>
									<CardTitle style={{ fontSize: "1.2rem", margin: 0 }}>
										Login with Strava
									</CardTitle>
									<CardDescription>
										Authorize your account to continue.
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<Button
								type="button"
								onClick={onConnectStrava}
								style={{
									width: "100%",
									padding: "0.9rem 1.25rem",
									fontWeight: 700,
									background: "linear-gradient(135deg,#f97316,#f59e0b)",
									border: "none",
									borderRadius: 12,
								}}
							>
								Login to Strava
							</Button>
						</CardContent>
					</Card>
				</section>
			</main>
		);
	}

	return (
		<main
			style={{ maxWidth: 1280, margin: "0 auto", padding: "2.5rem 1.5rem" }}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: "1rem",
					flexWrap: "wrap",
					marginBottom: "1.5rem",
				}}
			>
				<h1
					style={{
						margin: 0,
						fontWeight: 800,
						fontSize: "clamp(2rem, 5vw, 3rem)",
						color: "#fff",
						letterSpacing: "-0.03em",
					}}
				>
					Activities Dashboard
				</h1>

				<div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
					{isProfileComplete ? (
						<div
							style={{
								display: "inline-flex",
								alignItems: "center",
								gap: "0.5rem",
								padding: "0.55rem 0.9rem",
								borderRadius: 999,
								background: "rgba(15,23,42,0.55)",
								border: "1px solid rgba(255,255,255,0.1)",
							}}
						>
							<CheckCircle2 size={16} color="#22c55e" />
							<span style={{ fontSize: "0.85rem", color: "#e2e8f0" }}>
								Strava Connected
								{athlete?.firstname ? ` · ${athlete.firstname}` : ""}
							</span>
						</div>
					) : null}
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
			</div>

			{!isProfileComplete ? (
				<section style={{ maxWidth: 860, margin: "0 auto 1.5rem" }}>
					<p style={{ margin: "0 0 1rem", color: "#94a3b8", lineHeight: 1.7 }}>
						Hoàn thiện athlete profile trước để tiếp tục vào danh sách hoạt
						động.
					</p>
					<AthleteProfileForm
						defaultValue={profileDefault}
						onSubmit={(value: AthleteProfile) => {
							setProfile(value);
							toast.success("Lưu profile thành công.");
						}}
					/>
				</section>
			) : (
				<>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							gap: "1rem",
							flexWrap: "wrap",
							marginBottom: "1.25rem",
						}}
					>
						<div>
							<p style={{ margin: 0, fontSize: "0.9rem", color: "#94a3b8" }}>
								Recent activities load automatically when you open this page.
							</p>
							{monthlyContext && weeklyContext ? (
								<p
									style={{
										margin: "0.5rem 0 0",
										fontSize: "0.8rem",
										color: "#94a3b8",
									}}
								>
									Tuần này: {weeklyContext.runsThisWeek} buổi ·{" "}
									{weeklyContext.totalDistanceKm} km · pace{" "}
									{weeklyContext.avgPacePerKm} — Tháng này:{" "}
									{monthlyContext.totalRuns} buổi ·{" "}
									{monthlyContext.totalDistanceKm} km.
								</p>
							) : athleteStats ? (
								<p
									style={{
										margin: "0.5rem 0 0",
										fontSize: "0.8rem",
										color: "#94a3b8",
									}}
								>
									YTD runs: {athleteStats.ytd_run_totals?.count ?? 0} ·{" "}
									{(
										(athleteStats.ytd_run_totals?.distance ?? 0) / 1000
									).toFixed(1)}{" "}
									km
								</p>
							) : null}
						</div>
						<div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
							<Link href="/profile" style={{ textDecoration: "none" }}>
								<Button type="button" variant="secondary">
									View Profile
								</Button>
							</Link>
							<Button
								type="button"
								onClick={onFetchActivities}
								disabled={fetchingActivities}
								style={{
									padding: "0.7rem 1.15rem",
									fontWeight: 700,
									background: "linear-gradient(135deg,#f97316,#f59e0b)",
									border: "none",
									borderRadius: 12,
								}}
							>
								{fetchingActivities
									? "Đang tải hoạt động..."
									: "Refresh Activities"}
							</Button>
						</div>
					</div>

					<ActivityList
						activities={activities}
						onAnalyze={(activity) => {
							setSelectedActivity(activity);
							router.push(`/activities/${activity.id}`);
						}}
						onSyncDescription={() => undefined}
						analyzingActivityId={null}
						syncingActivityId={null}
						activityAnalysisById={{}}
						syncStatusById={{}}
						primaryActionLabel="See details & Analyze"
					/>
				</>
			)}
		</main>
	);
}
