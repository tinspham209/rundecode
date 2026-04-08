// @vitest-environment jsdom

import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ActivityCard } from "../components/ActivityCard";

afterEach(() => {
	cleanup();
});

const sampleActivity = {
	id: 123,
	name: "Morning Run",
	description: "Strava description hiện tại",
	start_date: "2026-04-08T05:30:00.000Z",
	distance: 10000,
	moving_time: 3600,
	elapsed_time: 3660,
	total_elevation_gain: 45,
	average_heartrate: 150,
	max_heartrate: 170,
	average_cadence: 88,
	map: { summary_polyline: null },
};

describe("ActivityCard", () => {
	it("formats start_date_local as local clock without timezone shifting", () => {
		render(
			<ActivityCard
				activity={{
					...sampleActivity,
					start_date_local: "2026-04-07T20:28:00Z",
					start_date: "2026-04-07T13:28:00Z",
				}}
				onAnalyze={vi.fn()}
			/>,
		);

		expect(screen.getByText(/20:28,/)).toBeInTheDocument();
		expect(screen.getByText(/07\/04\/2026/)).toBeInTheDocument();
	});

	it("renders existing Strava activity description", () => {
		render(<ActivityCard activity={sampleActivity} onAnalyze={vi.fn()} />);

		expect(screen.getByText(/mô tả hiện tại trên strava/i)).toBeInTheDocument();
		expect(screen.getByText("Strava description hiện tại")).toBeInTheDocument();
	});

	it("renders analysis slot and sync action when analysis exists", async () => {
		const user = userEvent.setup();
		const onSync = vi.fn();

		render(
			<ActivityCard
				activity={sampleActivity}
				onAnalyze={vi.fn()}
				analysisText={"analysis content from BE"}
				onSyncDescription={onSync}
				syncStatus="idle"
			/>,
		);

		expect(screen.getByText(/kết quả phân tích/i)).toBeInTheDocument();
		expect(
			screen.getByDisplayValue("analysis content from BE"),
		).toBeInTheDocument();

		await user.click(
			screen.getByRole("button", {
				name: /sync analysis lên strava description/i,
			}),
		);

		expect(onSync).toHaveBeenCalledTimes(1);
		expect(onSync).toHaveBeenCalledWith(expect.objectContaining({ id: 123 }));
	});

	it("shows sync success hint when status is success", () => {
		render(
			<ActivityCard
				activity={sampleActivity}
				onAnalyze={vi.fn()}
				analysisText={"analysis content"}
				onSyncDescription={vi.fn()}
				syncStatus="success"
			/>,
		);

		expect(screen.getByText(/đã sync mô tả thành công/i)).toBeInTheDocument();
	});
});
