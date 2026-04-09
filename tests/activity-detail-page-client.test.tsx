// @vitest-environment jsdom

import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ActivityDetailPageClient } from "../components/ActivityDetailPageClient";
import { useAnalysisStore } from "../stores/analysisStore";
import { useAuthStore } from "../stores/authStore";
import { useProfileStore } from "../stores/profileStore";
import { useStravaStore } from "../stores/stravaStore";

afterEach(() => {
	cleanup();
});

describe("ActivityDetailPageClient", () => {
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
			athleteStats: null,
			isProfileComplete: true,
		});

		useStravaStore.setState({
			activities: [
				{
					id: 123,
					name: "Morning Run",
					description: "Steady aerobic workout",
					start_date: "2026-04-08T05:30:00.000Z",
					distance: 10000,
					moving_time: 3600,
					elapsed_time: 3660,
					total_elevation_gain: 45,
					average_heartrate: 150,
					max_heartrate: 168,
					average_cadence: 88,
					average_speed: 2.78,
					max_speed: 4.2,
					average_watts: 210,
					max_watts: 312,
					elev_high: 48,
					elev_low: 12,
					calories: 610,
					sport_type: "Run",
					map: { summary_polyline: null },
				},
			],
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
		});

		useAnalysisStore.setState({
			analysis: null,
			metadata: null,
			loading: false,
			error: null,
			selectedModel: "openai/gpt-oss-120b:free",
		});

		vi.stubGlobal(
			"fetch",
			vi.fn(async (input: RequestInfo | URL) => {
				const url = String(input);
				if (url.includes("/api/strava/activities/123")) {
					return {
						ok: true,
						json: async () => ({
							activity: {
								id: 123,
								name: "Morning Run",
								description: "Steady aerobic workout",
								start_date: "2026-04-08T05:30:00.000Z",
								distance: 10000,
								moving_time: 3600,
								elapsed_time: 3660,
								total_elevation_gain: 45,
								average_heartrate: 150,
								max_heartrate: 168,
								average_cadence: 88,
								average_speed: 2.78,
								max_speed: 4.2,
								average_watts: 210,
								max_watts: 312,
								elev_high: 48,
								elev_low: 12,
								calories: 610,
								sport_type: "Run",
								map: { summary_polyline: null },
							},
						}),
					} as Response;
				}

				return {
					ok: true,
					json: async () => ({}),
				} as Response;
			}),
		);
	});

	it("renders detail route controls for the selected activity", () => {
		render(<ActivityDetailPageClient activityId="123" />);

		expect(
			screen.getByRole("heading", { name: /morning run/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /back to activities/i }),
		).toBeInTheDocument();
		expect(screen.getByText(/steady aerobic workout/i)).toBeInTheDocument();
		expect(screen.getByText(/performance details/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/model:/i)).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /generate ai report/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /sync to strava description/i }),
		).toBeDisabled();
	});
});
