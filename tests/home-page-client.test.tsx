// @vitest-environment jsdom

import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { HomePageClient } from "../components/HomePageClient";

afterEach(() => {
	cleanup();
});

describe("HomePageClient", () => {
	it("renders the landing hero with only the two primary entry cards", () => {
		render(<HomePageClient />);

		expect(screen.getByText(/ai running analysis for/i)).toBeInTheDocument();
		expect(screen.getByText(/strava or fit workouts/i)).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /^open activities dashboard$/i }),
		).toBeInTheDocument();
		expect(
			screen.getByText(/strava activities dashboard/i),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /^manual fit flow$/i }),
		).toBeInTheDocument();
		expect(
			screen.queryByText(/athlete profile: basic information/i),
		).not.toBeInTheDocument();
	});
});
