// @vitest-environment jsdom

import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProfilePageClient } from "../components/ProfilePageClient";
import { useAuthStore } from "../stores/authStore";
import { useProfileStore } from "../stores/profileStore";

afterEach(() => {
	cleanup();
});

describe("ProfilePageClient", () => {
	beforeEach(() => {
		useAuthStore.setState({
			athlete: { id: 1, firstname: "Tin", city: "Da Nang", country: "VN" },
			accessToken: "token",
			refreshToken: "refresh",
			expiresAt: Math.floor(Date.now() / 1000) + 10000,
			isAuthenticated: true,
		});

		useProfileStore.setState({
			profile: {
				name: "Tin",
				location: "Da Nang",
				runningLevel: "intermediate",
			},
			athleteStats: {
				recent_run_totals: {
					count: 3,
					distance: 24000,
					moving_time: 7200,
					elevation_gain: 120,
				},
				ytd_run_totals: {
					count: 24,
					distance: 180000,
					moving_time: 54000,
					elevation_gain: 890,
				},
				all_run_totals: {
					count: 180,
					distance: 1200000,
					moving_time: 360000,
					elevation_gain: 6400,
				},
			},
			isProfileComplete: true,
		});

		vi.stubGlobal(
			"fetch",
			vi.fn(async () => ({
				ok: true,
				json: async () => ({ stats: {} }),
			})) as unknown as typeof fetch,
		);
	});

	it("renders editable profile form and readonly Strava stats summary", () => {
		render(<ProfilePageClient />);

		expect(
			screen.getByRole("heading", { level: 1, name: /^athlete profile$/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /back to activities/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: /^strava athlete stats$/i }),
		).toBeInTheDocument();
		expect(screen.getByText(/recent runs/i)).toBeInTheDocument();
		expect(screen.getByText(/3 runs/i)).toBeInTheDocument();
		expect(
			screen.getByRole("heading", {
				name: /athlete profile: basic information/i,
			}),
		).toBeInTheDocument();
	});
});
