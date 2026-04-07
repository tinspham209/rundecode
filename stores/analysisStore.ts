import { create } from "zustand";
import type { Metadata } from "../components/MetadataSidebar";
import { FREE_MODELS } from "../lib/aiAnalyzer";

type AnalysisState = {
	analysis: string | null;
	metadata: Metadata | null;
	loading: boolean;
	error: string | null;
	selectedModel: string;
	setLoading: (loading: boolean) => void;
	setResult: (analysis: string, metadata: Metadata) => void;
	setError: (message: string | null) => void;
	setSelectedModel: (model: string) => void;
	reset: () => void;
};

export const useAnalysisStore = create<AnalysisState>((set) => ({
	analysis: null,
	metadata: null,
	loading: false,
	error: null,
	selectedModel: FREE_MODELS[0],
	setLoading: (loading) => set({ loading }),
	setResult: (analysis, metadata) =>
		set({ analysis, metadata, error: null, loading: false }),
	setError: (error) => set({ error, loading: false }),
	setSelectedModel: (model) => set({ selectedModel: model }),
	reset: () =>
		set({ analysis: null, metadata: null, loading: false, error: null }),
}));
