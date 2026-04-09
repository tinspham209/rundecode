"use client";

import React from "react";
import dynamic from "next/dynamic";
import polyline from "@mapbox/polyline";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
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
	primaryActionLabel?: string;
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
	primaryActionLabel,
	analysisText,
	onSyncDescription,
	isSyncingDescription,
	syncStatus,
}: ActivityCardProps) {
	const formattedTime = formatActivityTimeLabel(activity);
	const compactDate = formatCompactDate(activity);

	const distanceKm = activity.distance / 1000;
	const pace = toPace(distanceKm, activity.moving_time);
	const routePolyline = activity.map?.summary_polyline ?? null;
	const routeCoordinates = decodePolyline(routePolyline);
	const activityDescription = activity.description?.trim();

	return (
		<Card style={{ overflow: "hidden", padding: 0, borderRadius: 16 }}>
			{/* Map — full width, flush to card edge */}
			{routeCoordinates.length >= 2 ? (
				<div style={{ borderRadius: "16px 16px 0 0", overflow: "hidden" }}>
					<DynamicRouteMap coordinates={routeCoordinates} />
				</div>
			) : (
				<div
					style={{
						height: 180,
						borderRadius: "16px 16px 0 0",
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

			{/* 3-column metrics: Distance | Pace | Date */}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "1fr 1fr 1fr",
					padding: "1rem 1rem 0.75rem",
					textAlign: "center",
				}}
			>
				<DashMetric label="Distance" value={`${distanceKm.toFixed(2)} km`} />
				<DashMetric label="Pace" value={pace} />
				<DashMetric label="Date" value={compactDate} />
			</div>
			<span className="sr-only">{formattedTime}</span>

			{/* Analyze button */}
			<div style={{ padding: "0 1rem 1rem" }}>
				<Button
					type="button"
					disabled={disabled || isAnalyzing}
					onClick={() => onAnalyze(activity)}
					style={{
						width: "100%",
						padding: "0.8rem 1rem",
						fontSize: "1rem",
						fontWeight: 700,
						background: isAnalyzing
							? "rgba(249,115,22,0.5)"
							: "linear-gradient(135deg,#f97316,#ea4300)",
						border: "none",
						color: "#fff",
						borderRadius: 10,
						cursor: disabled || isAnalyzing ? "not-allowed" : "pointer",
					}}
				>
					{isAnalyzing
						? "Đang phân tích..."
						: (primaryActionLabel ?? "Analyze with AI")}
				</Button>
			</div>

			{/* Description + analysis result (shown after analyzing) */}
			{activityDescription || analysisText ? (
				<div
					style={{
						padding: "0 1rem 1rem",
						borderTop: "1px solid rgba(255,255,255,0.07)",
					}}
				>
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
				</div>
			) : null}
		</Card>
	);
}

/** Dashboard-style metric: large value on top, muted label below, center-aligned */
function DashMetric({ label, value }: { label: string; value: string }) {
	return (
		<div style={{ textAlign: "center", padding: "0 0.25rem" }}>
			<p
				style={{
					margin: 0,
					fontSize: "1rem",
					fontWeight: 700,
					color: "#fff",
					lineHeight: 1.2,
				}}
			>
				{value}
			</p>
			<p
				style={{
					margin: "0.25rem 0 0",
					fontSize: "0.72rem",
					color: "#94a3b8",
					textTransform: "uppercase",
					letterSpacing: "0.04em",
				}}
			>
				{label}
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

function formatCompactDate(activity: StravaActivity): string {
	const date = activity.start_date_local
		? parseIsoAsLocalClock(activity.start_date_local)
		: new Date(activity.start_date);

	if (Number.isNaN(date.getTime())) {
		return "N/A";
	}

	const dd = String(date.getDate()).padStart(2, "0");
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const yyyy = date.getFullYear();
	return `${dd}/${month}/${yyyy}`;
}

function formatActivityTimeLabel(activity: StravaActivity): string {
	const date = activity.start_date_local
		? parseIsoAsLocalClock(activity.start_date_local)
		: new Date(activity.start_date);

	if (Number.isNaN(date.getTime())) {
		return "Không rõ thời gian";
	}

	const hh = String(date.getHours()).padStart(2, "0");
	const mm = String(date.getMinutes()).padStart(2, "0");
	return `${hh}:${mm},`;
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
