// @vitest-environment jsdom

import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AthleteProfileForm } from "../components/AthleteProfileForm";

afterEach(() => {
	cleanup();
});

describe("AthleteProfileForm", () => {
	it("shows HR zone config fields and prefills values", () => {
		render(
			<AthleteProfileForm
				defaultValue={{
					name: "Tin",
					location: "Da Nang",
					runningLevel: "intermediate",
					maxHr: 182,
					hrZones: {
						z1: "116-134",
						z2: "135-150",
						z3: "151-165",
						z4: "166-174",
						z5: "175-182",
					},
				}}
				onSubmit={vi.fn()}
			/>,
		);

		expect(screen.getByLabelText("Z1")).toHaveValue("116-134");
		expect(screen.getByLabelText("Z2")).toHaveValue("135-150");
		expect(screen.getByLabelText("Z3")).toHaveValue("151-165");
		expect(screen.getByLabelText("Z4")).toHaveValue("166-174");
		expect(screen.getByLabelText("Z5")).toHaveValue("175-182");
	});

	it("auto-calculates zones from max HR", async () => {
		const user = userEvent.setup();
		render(
			<AthleteProfileForm
				defaultValue={{ runningLevel: "intermediate" }}
				onSubmit={vi.fn()}
			/>,
		);

		await user.type(screen.getByLabelText("Max HR"), "190");
		await user.click(
			screen.getByRole("button", { name: /auto-calculate from max hr/i }),
		);

		expect(screen.getByLabelText("Z1")).toHaveValue("122-141");
		expect(screen.getByLabelText("Z5")).toHaveValue("182-190");
	});

	it("requires name before submit", async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();

		render(
			<AthleteProfileForm
				defaultValue={{ runningLevel: "intermediate" }}
				onSubmit={onSubmit}
			/>,
		);

		await user.click(screen.getByRole("button", { name: /lưu profile/i }));

		expect(onSubmit).not.toHaveBeenCalled();
		expect(screen.getByText(/name is required/i)).toBeInTheDocument();
	});
});
