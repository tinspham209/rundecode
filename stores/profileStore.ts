import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AthleteProfile, StravaAthleteStats } from "../lib/stravaTypes";

type ProfileState = {
	profile: AthleteProfile | null;
	athleteStats: StravaAthleteStats | null;
	isProfileComplete: boolean;
	setProfile: (profile: AthleteProfile) => void;
	setAthleteStats: (stats: StravaAthleteStats) => void;
	clearProfile: () => void;
};

export const useProfileStore = create<ProfileState>()(
	persist(
		(set) => ({
			profile: null,
			athleteStats: null,
			isProfileComplete: false,
			setProfile: (profile) => set({ profile, isProfileComplete: true }),
			setAthleteStats: (athleteStats) => set({ athleteStats }),
			clearProfile: () =>
				set({
					profile: null,
					athleteStats: null,
					isProfileComplete: false,
				}),
		}),
		{ name: "rundecode-strava-profile" },
	),
);
