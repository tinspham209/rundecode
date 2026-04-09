"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, BarChart3, UserRound } from "lucide-react";
import { AthleteProfileForm } from "./AthleteProfileForm";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useAuthStore } from "../stores/authStore";
import { useProfileStore } from "../stores/profileStore";
import { useStravaToken } from "../hooks/useStravaToken";
import type { AthleteProfile, StravaAthleteStats } from "../lib/stravaTypes";

export function ProfilePageClient() {
	const athlete = useAuthStore((s) => s.athlete);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

	const { ensureToken } = useStravaToken();

	const profile = useProfileStore((s) => s.profile);
	const athleteStats = useProfileStore((s) => s.athleteStats);
	const setProfile = useProfileStore((s) => s.setProfile);
	const setAthleteStats = useProfileStore((s) => s.setAthleteStats);

	const [loadingStats, setLoadingStats] = useState(false);

	const showError = useCallback((message: string) => {
		toast.error(message);
	}, []);

	useEffect(() => {
		if (!isAuthenticated || !athlete?.id || athleteStats || loadingStats)
			return;

		let cancelled = false;

		const fetchStats = async () => {
			setLoadingStats(true);
			try {
				const token = await ensureToken();
				if (!token) return;

				const response = await fetch(
					`/api/strava/athlete-stats?athleteId=${athlete.id}`,
					{ headers: { authorization: `Bearer ${token}` } },
				);
				const payload = await response.json();
				if (!response.ok) {
					showError(payload.error ?? "Không thể tải athlete stats.");
					return;
				}

				if (!cancelled) {
					setAthleteStats(payload.stats as StravaAthleteStats);
				}
			} catch {
				if (!cancelled) {
					showError("Lỗi mạng khi tải athlete stats.");
				}
			} finally {
				if (!cancelled) {
					setLoadingStats(false);
				}
			}
		};

		void fetchStats();

		return () => {
			cancelled = true;
		};
	}, [
		athlete?.id,
		athleteStats,
		ensureToken,
		isAuthenticated,
		loadingStats,
		setAthleteStats,
		showError,
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
				style={{ maxWidth: 960, margin: "0 auto", padding: "2.5rem 1.5rem" }}
			>
				<p style={{ color: "#94a3b8" }}>
					Bạn cần đăng nhập Strava trước.{" "}
					<Link href="/activities">Quay lại activities</Link>
				</p>
			</main>
		);
	}

	return (
		<main
			style={{ maxWidth: 1200, margin: "0 auto", padding: "2.5rem 1.5rem" }}
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

			<div style={{ display: "grid", gap: "1.5rem" }}>
				<div>
					<h1
						style={{
							margin: 0,
							fontWeight: 800,
							fontSize: "clamp(2rem, 5vw, 3rem)",
							color: "#fff",
							letterSpacing: "-0.03em",
						}}
					>
						Athlete Profile
					</h1>
					<p
						style={{ margin: "0.75rem 0 0", color: "#94a3b8", lineHeight: 1.7 }}
					>
						Chỉnh sửa hồ sơ runner của bạn tại đây. Strava athlete stats bên
						dưới là dữ liệu chỉ đọc để bạn tham chiếu nhanh.
					</p>
				</div>

				<section
					className="profile-layout"
					style={{ display: "grid", gap: "1.5rem", alignItems: "start" }}
				>
					<div style={{ display: "grid", gap: "1rem" }}>
						<Card style={{ padding: "1.25rem", borderRadius: 18 }}>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "0.75rem",
									marginBottom: "1rem",
								}}
							>
								<div
									style={{
										width: 42,
										height: 42,
										borderRadius: 12,
										background: "linear-gradient(135deg,#f97316,#f59e0b)",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									<UserRound size={20} color="#fff" />
								</div>
								<div>
									<h2
										style={{
											margin: 0,
											color: "#fff",
											fontSize: "1.3rem",
											fontWeight: 700,
										}}
									>
										Edit profile
									</h2>
									<p
										style={{
											margin: "0.25rem 0 0",
											color: "#94a3b8",
											fontSize: "0.9rem",
										}}
									>
										Cập nhật thông tin cơ bản và vùng nhịp tim để AI phân tích
										sát hơn.
									</p>
								</div>
							</div>

							<AthleteProfileForm
								defaultValue={profileDefault}
								onSubmit={(value: AthleteProfile) => {
									setProfile(value);
									toast.success("Lưu profile thành công.");
								}}
							/>
						</Card>
					</div>

					<div style={{ display: "grid", gap: "1rem" }}>
						<Card style={{ padding: "1.25rem", borderRadius: 18 }}>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "0.75rem",
									marginBottom: "1rem",
								}}
							>
								<div
									style={{
										width: 42,
										height: 42,
										borderRadius: 12,
										background: "rgba(249,115,22,0.16)",
										border: "1px solid rgba(249,115,22,0.24)",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									<BarChart3 size={20} color="#f97316" />
								</div>
								<div>
									<h2
										style={{
											margin: 0,
											color: "#fff",
											fontSize: "1.3rem",
											fontWeight: 700,
										}}
									>
										Strava athlete stats
									</h2>
									<p
										style={{
											margin: "0.25rem 0 0",
											color: "#94a3b8",
											fontSize: "0.9rem",
										}}
									>
										Read-only summary synced from Strava.
									</p>
								</div>
							</div>

							{loadingStats && !athleteStats ? (
								<p style={{ margin: 0, color: "#94a3b8" }}>
									Đang tải athlete stats...
								</p>
							) : athleteStats ? (
								<div
									className="profile-stats-grid"
									style={{
										display: "grid",
										gap: "0.85rem",
										gridTemplateColumns: "1fr",
									}}
								>
									<StatsCard
										title="Recent runs"
										totals={athleteStats.recent_run_totals}
									/>
									<StatsCard
										title="Year to date"
										totals={athleteStats.ytd_run_totals}
									/>
									<StatsCard
										title="All-time runs"
										totals={athleteStats.all_run_totals}
									/>
								</div>
							) : (
								<p style={{ margin: 0, color: "#94a3b8" }}>
									Chưa có athlete stats từ Strava cho tài khoản này.
								</p>
							)}
						</Card>

						<Link href="/activities" style={{ textDecoration: "none" }}>
							<Button type="button" style={{ width: "100%", borderRadius: 12 }}>
								Return to Activities
							</Button>
						</Link>
					</div>
				</section>
			</div>

			<style>{`
				.profile-layout {
					grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
				}

				@media (max-width: 960px) {
					.profile-layout {
						grid-template-columns: 1fr;
					}
				}
			`}</style>
		</main>
	);
}

type Totals = {
	count: number;
	distance: number;
	moving_time: number;
	elevation_gain: number;
};

function StatsCard({ title, totals }: { title: string; totals?: Totals }) {
	return (
		<div
			style={{
				padding: "1rem",
				borderRadius: 14,
				background: "rgba(15,23,42,0.45)",
				border: "1px solid rgba(255,255,255,0.08)",
			}}
		>
			<p style={{ margin: 0, fontSize: "0.82rem", color: "#94a3b8" }}>
				{title}
			</p>
			<p
				style={{
					margin: "0.4rem 0 0",
					color: "#fff",
					fontSize: "1.35rem",
					fontWeight: 700,
				}}
			>
				{totals?.count ?? 0} runs
			</p>
			<p
				style={{
					margin: "0.5rem 0 0",
					color: "#cbd5e1",
					fontSize: "0.9rem",
					lineHeight: 1.7,
				}}
			>
				{formatDistance(totals?.distance)} · {formatHours(totals?.moving_time)}{" "}
				· {Math.round(totals?.elevation_gain ?? 0)} m gain
			</p>
		</div>
	);
}

function formatDistance(distance?: number) {
	return `${((distance ?? 0) / 1000).toFixed(1)} km`;
}

function formatHours(seconds?: number) {
	return `${((seconds ?? 0) / 3600).toFixed(1)} h`;
}
