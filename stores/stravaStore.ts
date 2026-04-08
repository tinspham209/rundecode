import { create } from "zustand";
import type { Metadata } from "../components/MetadataSidebar";
import type {
	MonthlyContext,
	StravaActivity,
	StravaExtractedActivity,
	WeeklyContext,
} from "../lib/stravaTypes";

type ActivityAnalysisItem = {
	analysis: string;
	metadata: Metadata;
	updatedAt: number;
};

type StravaState = {
	activities: StravaActivity[];
	monthlyContext: MonthlyContext | null;
	weeklyContext: WeeklyContext | null;
	selectedActivity: StravaActivity | null;
	extractedActivity: StravaExtractedActivity | null;
	fetchingActivities: boolean;
	analyzingActivityId: number | null;
	syncingActivityId: number | null;
	activityAnalysisById: Record<number, ActivityAnalysisItem>;
	syncStatusById: Record<number, "idle" | "success" | "error">;
	error: string | null;
	setActivities: (activities: StravaActivity[]) => void;
	setContexts: (monthly: MonthlyContext, weekly: WeeklyContext) => void;
	setSelectedActivity: (activity: StravaActivity | null) => void;
	setExtractedActivity: (value: StravaExtractedActivity | null) => void;
	setFetchingActivities: (value: boolean) => void;
	setAnalyzingActivityId: (value: number | null) => void;
	setSyncingActivityId: (value: number | null) => void;
	setActivityAnalysis: (
		activityId: number,
		analysis: string,
		metadata: Metadata,
	) => void;
	setSyncStatus: (
		activityId: number,
		status: "idle" | "success" | "error",
	) => void;
	updateActivityDescription: (activityId: number, description: string) => void;
	setError: (message: string | null) => void;
	reset: () => void;
};

const initialState = {
	activities: [],
	monthlyContext: null,
	weeklyContext: null,
	selectedActivity: null,
	extractedActivity: null,
	fetchingActivities: false,
	analyzingActivityId: null,
	syncingActivityId: null,
	activityAnalysisById: {},
	syncStatusById: {},
	error: null,
};

export const useStravaStore = create<StravaState>((set) => ({
	...initialState,
	setActivities: (activities) => set({ activities }),
	setContexts: (monthlyContext, weeklyContext) =>
		set({ monthlyContext, weeklyContext }),
	setSelectedActivity: (selectedActivity) => set({ selectedActivity }),
	setExtractedActivity: (extractedActivity) => set({ extractedActivity }),
	setFetchingActivities: (fetchingActivities) => set({ fetchingActivities }),
	setAnalyzingActivityId: (analyzingActivityId) => set({ analyzingActivityId }),
	setSyncingActivityId: (syncingActivityId) => set({ syncingActivityId }),
	setActivityAnalysis: (activityId, analysis, metadata) =>
		set((state) => ({
			activityAnalysisById: {
				...state.activityAnalysisById,
				[activityId]: {
					analysis,
					metadata,
					updatedAt: Date.now(),
				},
			},
			syncStatusById: {
				...state.syncStatusById,
				[activityId]: "idle",
			},
		})),
	setSyncStatus: (activityId, status) =>
		set((state) => ({
			syncStatusById: {
				...state.syncStatusById,
				[activityId]: status,
			},
		})),
	updateActivityDescription: (activityId, description) =>
		set((state) => ({
			activities: state.activities.map((activity) =>
				activity.id === activityId ? { ...activity, description } : activity,
			),
			selectedActivity:
				state.selectedActivity?.id === activityId
					? { ...state.selectedActivity, description }
					: state.selectedActivity,
		})),
	setError: (error) => set({ error }),
	reset: () => set(initialState),
}));
