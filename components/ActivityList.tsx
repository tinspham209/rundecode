"use client";

import React from "react";
import type { StravaActivity } from "../lib/stravaTypes";
import { ActivityCard } from "./ActivityCard";
import type { Metadata } from "./MetadataSidebar";

type ActivityAnalysisItem = {
	analysis: string;
	metadata: Metadata;
	updatedAt: number;
};

type ActivityListProps = {
	activities: StravaActivity[];
	onAnalyze: (activity: StravaActivity) => void;
	onSyncDescription: (activity: StravaActivity) => void;
	analyzingActivityId: number | null;
	syncingActivityId: number | null;
	activityAnalysisById: Record<number, ActivityAnalysisItem>;
	syncStatusById: Record<number, "idle" | "success" | "error">;
};

export function ActivityList({
	activities,
	onAnalyze,
	onSyncDescription,
	analyzingActivityId,
	syncingActivityId,
	activityAnalysisById,
	syncStatusById,
}: ActivityListProps) {
	if (activities.length === 0) {
		return (
			<p style={{ margin: 0, color: "#94a3b8", fontSize: "0.85rem" }}>
				Chưa có hoạt động chạy nào trong 60 ngày gần đây.
			</p>
		);
	}

	return (
		<div style={{ display: "grid", gap: "1rem" }}>
			{activities.map((activity) => (
				/* per activity result slot */
				<ActivityCard
					key={activity.id}
					activity={activity}
					disabled={analyzingActivityId !== null && analyzingActivityId !== activity.id}
					isAnalyzing={analyzingActivityId === activity.id}
					onAnalyze={onAnalyze}
					onSyncDescription={onSyncDescription}
					isSyncingDescription={syncingActivityId === activity.id}
					analysisText={activityAnalysisById[activity.id]?.analysis}
					syncStatus={syncStatusById[activity.id] ?? "idle"}
				/>
			))}
		</div>
	);
}
