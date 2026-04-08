"use client";

import React from "react";
import dynamic from "next/dynamic";
import polyline from "@mapbox/polyline";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type { StravaActivity } from "../lib/stravaTypes";

const DynamicRouteMap = dynamic(
	() => import("./ActivityRouteMap").then((mod) => mod.ActivityRouteMap),
	{
		ssr: false,
		loading: () => (
			<div
				style={{
					height: 180,
					borderRadius: 12,
					background: "rgba(255,255,255,0.04)",
					border: "1px solid rgba(255,255,255,0.08)",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					fontSize: "0.8rem",
					color: "#94a3b8",
				}}
			>
				Đang tải bản đồ...
			</div>
		),
	},
);

type ActivityCardProps = {
	activity: StravaActivity;
	disabled?: boolean;
	isAnalyzing?: boolean;
	onAnalyze: (activity: StravaActivity) => void;
	analysisText?: string;
	onSyncDescription?: (activity: StravaActivity) => void;
	isSyncingDescription?: boolean;
	syncStatus?: "idle" | "success" | "error";
};

export function ActivityCard({
	activity,
	disabled,
	isAnalyzing,
	onAnalyze,
	analysisText,
	onSyncDescription,
	isSyncingDescription,
	syncStatus,
}: ActivityCardProps) {
	const formattedDate = formatActivityDateTime(activity);

	const distanceKm = activity.distance / 1000;
	const pace = toPace(distanceKm, activity.moving_time);
	const cadence = Math.round((activity.average_cadence ?? 0) * 2);
	const routePolyline = activity.map?.summary_polyline ?? null;
	const routeCoordinates = decodePolyline(routePolyline);
	const activityDescription = activity.description?.trim();

	return (
		<Card>
			<CardHeader>
				<CardTitle style={{ fontSize: "1rem" }}>{activity.name}</CardTitle>
				<p
					style={{
						margin: "0.25rem 0 0",
						fontSize: "0.8rem",
						color: "#94a3b8",
					}}
				>
					{formattedDate}
				</p>
			</CardHeader>
			<CardContent>
				{routeCoordinates.length >= 2 ? (
					<DynamicRouteMap coordinates={routeCoordinates} />
				) : (
					<div
						style={{
							height: 180,
							borderRadius: 12,
							background: "rgba(255,255,255,0.04)",
							border: "1px dashed rgba(255,255,255,0.12)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							fontSize: "0.82rem",
							color: "#94a3b8",
						}}
					>
						Indoor run / không có polyline route
					</div>
				)}

				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(2,minmax(0,1fr))",
						gap: "0.6rem",
						marginTop: "0.9rem",
					}}
				>
					<Metric label="Distance" value={`${distanceKm.toFixed(2)} km`} />
					<Metric label="Pace" value={pace} />
					<Metric
						label="Elevation"
						value={`${Math.round(activity.total_elevation_gain)} m`}
					/>
					<Metric
						label="Avg HR"
						value={`${Math.round(activity.average_heartrate ?? 0)} bpm`}
					/>
					<Metric label="Cadence" value={`${cadence} spm`} />
					<Metric
						label="Device"
						value={activity.device_name ?? activity.gear_id ?? "N/A"}
					/>
				</div>

				<div style={{ marginTop: "1rem" }}>
					<Button
						type="button"
						disabled={disabled || isAnalyzing}
						onClick={() => onAnalyze(activity)}
					>
						{isAnalyzing ? "Đang phân tích..." : "Phân tích buổi chạy này"}
					</Button>
				</div>

				{activityDescription ? (
					<div
						style={{
							marginTop: "1rem",
							borderRadius: 12,
							border: "1px solid rgba(255,255,255,0.09)",
							background: "rgba(15,23,42,0.55)",
							padding: "0.8rem",
						}}
					>
						<p
							style={{
								margin: 0,
								fontWeight: 700,
								fontSize: "0.82rem",
								color: "#e2e8f0",
							}}
						>
							Mô tả hiện tại trên Strava
						</p>
						<p
							style={{
								margin: "0.5rem 0 0",
								fontSize: "0.82rem",
								lineHeight: 1.55,
								color: "#cbd5e1",
								whiteSpace: "pre-wrap",
							}}
						>
							{activityDescription}
						</p>
					</div>
				) : null}

				{analysisText ? (
					<div
						style={{
							marginTop: "1rem",
							borderRadius: 12,
							border: "1px solid rgba(255,255,255,0.09)",
							background: "rgba(2,6,23,0.52)",
							padding: "0.8rem",
						}}
					>
						<p
							style={{
								margin: 0,
								fontWeight: 700,
								fontSize: "0.82rem",
								color: "#e2e8f0",
							}}
						>
							Kết quả phân tích
						</p>
						<textarea
							aria-label={`Analysis for activity ${activity.id}`}
							readOnly
							value={analysisText}
							style={{
								width: "100%",
								minHeight: 200,
								marginTop: "0.55rem",
								borderRadius: 10,
								border: "1px solid rgba(255,255,255,0.08)",
								background: "rgba(0,0,0,0.35)",
								color: "#e2e8f0",
								padding: "0.75rem",
								fontSize: "0.83rem",
								lineHeight: 1.5,
								resize: "vertical",
							}}
						/>

						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: "0.6rem",
								marginTop: "0.6rem",
								flexWrap: "wrap",
							}}
						>
							<Button
								type="button"
								variant="secondary"
								onClick={() => onSyncDescription?.(activity)}
								disabled={isSyncingDescription}
							>
								{isSyncingDescription
									? "Đang sync lên Strava..."
									: "Sync analysis lên Strava description"}
							</Button>
							{syncStatus === "success" ? (
								<span style={{ fontSize: "0.75rem", color: "#6ee7b7" }}>
									Đã sync mô tả thành công.
								</span>
							) : null}
							{syncStatus === "error" ? (
								<span style={{ fontSize: "0.75rem", color: "#fda4af" }}>
									Sync thất bại, vui lòng thử lại.
								</span>
							) : null}
						</div>
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}

function Metric({ label, value }: { label: string; value: string }) {
	return (
		<div
			style={{
				borderRadius: 10,
				padding: "0.55rem 0.65rem",
				border: "1px solid rgba(255,255,255,0.08)",
				background: "rgba(255,255,255,0.03)",
			}}
		>
			<p style={{ margin: 0, fontSize: "0.7rem", color: "#94a3b8" }}>{label}</p>
			<p
				style={{
					margin: "0.2rem 0 0",
					fontSize: "0.82rem",
					fontWeight: 700,
					color: "#e2e8f0",
				}}
			>
				{value}
			</p>
		</div>
	);
}

function decodePolyline(value: string | null): [number, number][] {
	if (!value) {
		return [];
	}

	try {
		const decoded = polyline.decode(value) as [number, number][];
		return decoded.map((point) => [point[0], point[1]]);
	} catch {
		return [];
	}
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

function formatActivityDateTime(activity: StravaActivity): string {
	const date = activity.start_date_local
		? parseIsoAsLocalClock(activity.start_date_local)
		: new Date(activity.start_date);

	if (Number.isNaN(date.getTime())) {
		return "Không rõ thời gian";
	}

	const hh = String(date.getHours()).padStart(2, "0");
	const mm = String(date.getMinutes()).padStart(2, "0");
	const dd = String(date.getDate()).padStart(2, "0");
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const yyyy = date.getFullYear();
	const weekday = capitalizeFirst(
		new Intl.DateTimeFormat("vi-VN", { weekday: "long" }).format(date),
	);

	return `${hh}:${mm}, ${weekday}, ${dd}/${month}/${yyyy}`;
}

function parseIsoAsLocalClock(value: string): Date {
	const trimmed = value.trim();
	const match = trimmed.match(
		/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/,
	);

	if (!match) {
		return new Date(trimmed);
	}

	const [, y, m, d, hh, mm, ss] = match;
	return new Date(
		Number(y),
		Number(m) - 1,
		Number(d),
		Number(hh),
		Number(mm),
		Number(ss ?? "0"),
	);
}

function capitalizeFirst(value: string): string {
	if (!value) {
		return value;
	}

	return value.charAt(0).toUpperCase() + value.slice(1);
}
