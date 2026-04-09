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
			<div className="h-[180px] rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs text-slate-400">
				Loading map...
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
		<Card className="overflow-hidden p-0 rounded-2xl border-white/10">
			{/* Map — full width, flush to card edge */}
			{routeCoordinates.length >= 2 ? (
				<div className="rounded-t-2xl overflow-hidden">
					<DynamicRouteMap coordinates={routeCoordinates} />
				</div>
			) : (
				<div className="h-[180px] rounded-t-2xl bg-white/5 border border-dashed border-white/10 flex items-center justify-center text-xs text-slate-400">
					Indoor run / no polyline route
				</div>
			)}

			{/* 3-column metrics: Distance | Pace | Date */}
			<div className="grid grid-cols-3 p-4 pb-3 text-center">
				<DashMetric label="Distance" value={`${distanceKm.toFixed(2)} km`} />
				<DashMetric label="Pace" value={pace} />
				<DashMetric label="Date" value={compactDate} />
			</div>
			<span className="sr-only">{formattedTime}</span>

			{/* Analyze button */}
			<div className="p-4 pt-0">
				<Button
					type="button"
					disabled={disabled || isAnalyzing}
					onClick={() => onAnalyze(activity)}
					className={`w-full py-3 text-base font-bold text-white rounded-xl border-none transition-all ${
						isAnalyzing
							? "bg-orange-500/50 cursor-not-allowed"
							: "bg-gradient-to-br from-orange-500 to-amber-600 hover:shadow-lg hover:shadow-orange-500/20 active:scale-[0.98]"
					}`}
				>
					{isAnalyzing
						? "Analyzing..."
						: (primaryActionLabel ?? "Analyze with AI")}
				</Button>
			</div>

			{/* Description + analysis result (shown after analyzing) */}
			{activityDescription || analysisText ? (
				<div className="p-4 pt-0 border-t border-white/5">
					{activityDescription ? (
						<div className="mt-4 rounded-xl border border-white/10 bg-slate-900/55 p-3">
							<p className="m-0 font-bold text-xs text-slate-200">
								Current Strava description
							</p>
							<p className="mt-2 text-xs leading-relaxed text-slate-300 whitespace-pre-wrap">
								{activityDescription}
							</p>
						</div>
					) : null}

					{analysisText ? (
						<div className="mt-4 rounded-xl border border-white/10 bg-slate-950/50 p-3">
							<p className="m-0 font-bold text-xs text-slate-200">
								Analysis result
							</p>
							<textarea
								aria-label={`Analysis for activity ${activity.id}`}
								readOnly
								value={analysisText}
								className="w-full min-h-[200px] mt-2 rounded-xl border border-white/10 bg-black/35 text-slate-200 p-3 text-xs leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-orange-500/30"
							/>

							<div className="flex flex-wrap items-center gap-3 mt-3">
								<Button
									type="button"
									variant="secondary"
									onClick={() => onSyncDescription?.(activity)}
									disabled={isSyncingDescription}
									className="text-xs"
								>
									{isSyncingDescription
										? "Syncing to Strava..."
										: "Sync to Strava description"}
								</Button>
								{syncStatus === "success" ? (
									<span className="text-xs text-emerald-400">
										Sync successful.
									</span>
								) : null}
								{syncStatus === "error" ? (
									<span className="text-xs text-rose-300">
										Sync failed, please try again.
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
		<div className="text-center px-1">
			<p className="m-0 text-base font-bold text-white leading-tight">
				{value}
			</p>
			<p className="mt-1 text-[10px] text-slate-400 uppercase tracking-wider">
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
