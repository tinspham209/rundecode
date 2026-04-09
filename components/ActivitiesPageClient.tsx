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

		const hashFragment = window.location.hash.slice(1);
		const hashParams = new URLSearchParams(hashFragment);

		const session = parseStravaSessionFromSearch(hashParams);
		if (session) {
			setSession(session);
			setBootstrapped(true);
			window.history.replaceState({}, "", window.location.pathname);
			return;
		}

		if (
			hashParams?.get("strava_auth") === "error" ||
			searchParams?.get("strava_auth") === "error"
		) {
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
			<main className="max-w-300 mx-auto px-6 py-10">
				<section className="max-w-190 mx-auto">
					<h1 className="mb-4 font-extrabold text-[clamp(2rem,5vw,3rem)] text-white tracking-tight">
						Activities Dashboard
					</h1>
					<p className="mb-6 text-slate-400 leading-relaxed">
						Log in with Strava to view your recent activities and proceed to
						detailed analysis.
					</p>

					<Card className="border-2 border-orange-500 rounded-[20px] overflow-hidden">
						<CardHeader>
							<div className="flex items-center gap-3">
								<div className="w-11 h-11 rounded-xl bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center">
									<Activity size={22} className="text-white" />
								</div>
								<div>
									<CardTitle className="text-lg m-0">
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
								className="w-full py-6 font-bold bg-linear-to-br from-orange-500 to-amber-500 border-none rounded-xl"
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
		<main className="max-w-[1280px] mx-auto px-6 py-10">
			<div className="flex flex-wrap items-center justify-between gap-4 mb-6">
				<h1 className="m-0 font-extrabold text-[clamp(2rem,5vw,3rem)] text-white tracking-tight">
					Activities Dashboard
				</h1>

				<div className="flex flex-wrap gap-3">
					{isProfileComplete ? (
						<div className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-slate-900/55 border border-white/10">
							<CheckCircle2 size={16} className="text-emerald-500" />
							<span className="text-xs text-slate-200">
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
				<section className="max-w-[860px] mx-auto mb-6">
					<p className="mb-4 text-slate-400 leading-relaxed">
						Please complete your athlete profile to view your activity list.
					</p>
					<AthleteProfileForm
						defaultValue={profileDefault}
						onSubmit={(value: AthleteProfile) => {
							setProfile(value);
							toast.success("Profile saved successfully.");
						}}
					/>
				</section>
			) : (
				<>
					<div className="flex flex-wrap items-center justify-between gap-4 mb-5">
						<div>
							<p className="m-0 text-sm text-slate-400">
								Recent activities load automatically when you open this page.
							</p>
							{monthlyContext && weeklyContext ? (
								<p className="mt-2 text-xs text-slate-400">
									This week: {weeklyContext.runsThisWeek} runs ·{" "}
									{weeklyContext.totalDistanceKm} km · pace{" "}
									{weeklyContext.avgPacePerKm} — This month:{" "}
									{monthlyContext.totalRuns} runs ·{" "}
									{monthlyContext.totalDistanceKm} km.
								</p>
							) : athleteStats ? (
								<p className="mt-2 text-xs text-slate-400">
									YTD runs: {athleteStats.ytd_run_totals?.count ?? 0} ·{" "}
									{(
										(athleteStats.ytd_run_totals?.distance ?? 0) / 1000
									).toFixed(1)}{" "}
									km
								</p>
							) : null}
						</div>
						<div className="flex flex-wrap gap-3">
							<Link href="/profile" className="no-underline">
								<Button type="button" variant="secondary">
									View Profile
								</Button>
							</Link>
							<Button
								type="button"
								onClick={onFetchActivities}
								disabled={fetchingActivities}
								className="px-4.5 py-3 font-bold bg-gradient-to-br from-orange-500 to-amber-500 border-none rounded-xl"
							>
								{fetchingActivities
									? "Loading activities..."
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
