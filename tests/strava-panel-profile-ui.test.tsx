// @vitest-environment jsdom

import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StravaPanel } from "../components/StravaPanel";
import { useAuthStore } from "../stores/authStore";
import { useProfileStore } from "../stores/profileStore";
import { useStravaStore } from "../stores/stravaStore";

const { toastSuccess, toastError } = vi.hoisted(() => ({
	toastSuccess: vi.fn(),
	toastError: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	useSearchParams: () => new URLSearchParams(),
}));

vi.mock("react-hot-toast", () => ({
	default: {
		success: toastSuccess,
		error: toastError,
	},
	Toaster: () => null,
}));

afterEach(() => {
	cleanup();
});

describe("StravaPanel profile UX", () => {
	beforeEach(() => {
		toastSuccess.mockReset();
		toastError.mockReset();
		vi.stubGlobal("fetch", vi.fn());

		useAuthStore.setState({
			athlete: { id: 1, firstname: "Tin", city: "Da Nang", country: "VN" },
			accessToken: "token",
			refreshToken: "refresh",
			expiresAt: Math.floor(Date.now() / 1000) + 10000,
			isAuthenticated: true,
		});

		useProfileStore.setState({
			profile: null,
			athleteStats: null,
			isProfileComplete: false,
		});

		useStravaStore.setState({
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
		});
	});

	it("shows success toast and hides profile form after save, then allows edit", async () => {
		const user = userEvent.setup();
		render(<StravaPanel />);

		await user.click(screen.getByRole("button", { name: /lưu profile/i }));

		expect(toastSuccess).toHaveBeenCalledWith("Lưu profile thành công.");
		expect(screen.queryByText(/athlete profile/i)).not.toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /edit profile/i }),
		).toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: /edit profile/i }));
		expect(screen.getByText(/athlete profile/i)).toBeInTheDocument();
	});

	it("shows toast error with API message when fetch activities fails", async () => {
		const user = userEvent.setup();
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: false,
				json: async () => ({ error: "Strava activities API failed" }),
			}),
		);

		render(<StravaPanel />);

		await user.click(
			screen.getByRole("button", { name: /fetch recent activities/i }),
		);

		expect(toastError).toHaveBeenCalledWith("Strava activities API failed");
	});
});
