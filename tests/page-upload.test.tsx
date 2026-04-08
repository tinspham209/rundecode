// @vitest-environment jsdom

import React from "react";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ManualPage from "../app/manual/page";

const { toastSuccess, toastError } = vi.hoisted(() => ({
	toastSuccess: vi.fn(),
	toastError: vi.fn(),
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

describe("ManualPage upload flow", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		toastSuccess.mockReset();
		toastError.mockReset();
	});

	it("shows validation error for non-.fit file", async () => {
		render(<ManualPage />);

		const input = screen.getByLabelText(/upload fit file/i);
		const badFile = new File(["hello"], "run.tcx", { type: "text/plain" });

		fireEvent.change(input, {
			target: {
				files: [badFile],
			},
		});

		expect(screen.getByRole("alert")).toHaveTextContent(/\.fit/i);
	});

	it("uploads valid .fit and renders analysis area", async () => {
		const user = userEvent.setup();
		const fetchMock = vi.fn((input: RequestInfo | URL) => {
			const url = String(input);

			if (url.includes("/api/parse-fit")) {
				return Promise.resolve({
					ok: true,
					json: async () => ({
						metadata: {
							distance: 10.5,
							pace: "5'40\"/km",
							time: "00:42:35",
							avg_hr: 145,
							max_hr: 162,
							cadence_spm: 175,
							calories: 520,
							elevation_gain_m: 45,
							start_time: "2026-04-06T12:20:22.000Z",
						},
					}),
				});
			}

			return Promise.resolve({
				ok: true,
				json: async () => ({
					analysis: "Báo cáo phân tích chạy (Analysis by AI)\nNội dung",
					metadata: {
						distance: 10.5,
						pace: "5'40\"/km",
						time: "00:42:35",
						avg_hr: 145,
						max_hr: 162,
						cadence_spm: 175,
						calories: 520,
						elevation_gain_m: 45,
						start_time: "2026-04-06T12:20:22.000Z",
					},
				}),
			});
		});

		vi.stubGlobal("fetch", fetchMock);

		render(<ManualPage />);

		const input = screen.getByLabelText(/upload fit file/i);
		const fitBytes = new Uint8Array([
			0x0e, 0x10, 0x5d, 0x08, 0, 0, 0, 0, 0x2e, 0x46, 0x49, 0x54,
		]);
		const fitFile = new File([fitBytes], "run.fit", {
			type: "application/octet-stream",
		});

		await user.upload(input, fitFile);

		await waitFor(() => {
			expect(fetchMock).toHaveBeenCalledWith(
				"/api/parse-fit",
				expect.any(Object),
			);
		});

		await user.click(screen.getByRole("button", { name: /analyze run/i }));

		await waitFor(() => {
			expect(screen.getByLabelText(/analysis text/i)).toBeInTheDocument();
		});

		expect(fetchMock).toHaveBeenCalledWith(
			"/api/analyze-fit",
			expect.any(Object),
		);
	});

	it("shows API error toast when parse-fit returns an error response", async () => {
		const user = userEvent.setup();
		const fetchMock = vi.fn((input: RequestInfo | URL) => {
			const url = String(input);

			if (url.includes("/api/parse-fit")) {
				return Promise.resolve({
					ok: false,
					json: async () => ({ error: "FIT parse failed from API" }),
				});
			}

			return Promise.resolve({
				ok: true,
				json: async () => ({}),
			});
		});

		vi.stubGlobal("fetch", fetchMock);

		render(<ManualPage />);

		const input = screen.getByLabelText(/upload fit file/i);
		const fitBytes = new Uint8Array([
			0x0e, 0x10, 0x5d, 0x08, 0, 0, 0, 0, 0x2e, 0x46, 0x49, 0x54,
		]);
		const fitFile = new File([fitBytes], "run.fit", {
			type: "application/octet-stream",
		});

		await user.upload(input, fitFile);

		await waitFor(() => {
			expect(toastError).toHaveBeenCalledWith("FIT parse failed from API");
		});
	});
});
