import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StravaAthlete } from "../lib/stravaTypes";

type AuthState = {
	athlete: StravaAthlete | null;
	accessToken: string | null;
	refreshToken: string | null;
	expiresAt: number | null;
	isAuthenticated: boolean;
	setSession: (payload: {
		athlete: StravaAthlete | null;
		accessToken: string;
		refreshToken: string;
		expiresAt: number;
	}) => void;
	clearSession: () => void;
};

export const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			athlete: null,
			accessToken: null,
			refreshToken: null,
			expiresAt: null,
			isAuthenticated: false,
			setSession: ({ athlete, accessToken, refreshToken, expiresAt }) =>
				set({
					athlete,
					accessToken,
					refreshToken,
					expiresAt,
					isAuthenticated: true,
				}),
			clearSession: () =>
				set({
					athlete: null,
					accessToken: null,
					refreshToken: null,
					expiresAt: null,
					isAuthenticated: false,
				}),
		}),
		{ name: "rundecode-strava-auth" },
	),
);
