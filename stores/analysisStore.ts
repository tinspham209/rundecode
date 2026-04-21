import { create } from "zustand";
import type { Metadata } from "../components/MetadataSidebar";
import { FREE_MODELS } from "../lib/aiAnalyzer";

type AnalysisState = {
	analysis: string | null;
	intensityScore: number | null;
	recoveryHours: number | null;
	coachingFlags: string[];
	trainingIntentMatch: boolean | null;
	metadata: Metadata | null;
	loading: boolean;
	error: string | null;
	selectedModel: string;
	setLoading: (loading: boolean) => void;
	setResult: (
		result: {
			analysis: string;
			intensityScore: number;
			recoveryHours: number;
			coachingFlags: string[];
			trainingIntentMatch: boolean;
		},
		metadata: Metadata,
	) => void;
	setError: (message: string | null) => void;
	setSelectedModel: (model: string) => void;
	reset: () => void;
};

export const useAnalysisStore = create<AnalysisState>((set) => ({
	analysis: null,
	intensityScore: null,
	recoveryHours: null,
	coachingFlags: [],
	trainingIntentMatch: null,
	metadata: null,
	loading: false,
	error: null,
	selectedModel: FREE_MODELS[0],
	setLoading: (loading) => set({ loading }),
	setResult: (result, metadata) =>
		set({
			analysis: result.analysis,
			intensityScore: result.intensityScore,
			recoveryHours: result.recoveryHours,
			coachingFlags: result.coachingFlags,
			trainingIntentMatch: result.trainingIntentMatch,
			metadata,
			error: null,
			loading: false,
		}),
	setError: (error) => set({ error, loading: false }),
	setSelectedModel: (model) => set({ selectedModel: model }),
	reset: () =>
		set({
			analysis: null,
			intensityScore: null,
			recoveryHours: null,
			coachingFlags: [],
			trainingIntentMatch: null,
			metadata: null,
			loading: false,
			error: null,
		}),
}));
