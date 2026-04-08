import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	buildStravaAuthorizeUrl,
	parseStravaSessionFromSearch,
	shouldRefreshToken,
} from "../lib/stravaAuth";
import { buildStravaMonthlyWeeklyContext } from "../lib/stravaContextBuilder";
import { extractStravaActivityData } from "../lib/stravaActivityExtractor";
import { buildStravaPromptSegments } from "../lib/buildPromptContext";
import { buildRunAnalysisSystemPrompt } from "../src/prompts/runAnalysisSystemPrompt";

describe("Strava helper logic", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-04-08T07:00:00.000Z"));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("builds authorize URL with required scopes and params", () => {
		const url = buildStravaAuthorizeUrl({
			clientId: "12345",
			redirectUri: "http://localhost:3000/api/strava/callback",
			state: "abc",
		});

		expect(url).toContain("client_id=12345");
		expect(url).toContain("response_type=code");
		expect(url).toContain("activity%3Aread_all");
		expect(url).toContain("state=abc");
	});

	it("parses Strava session payload from successful search params", () => {
		const params = new URLSearchParams({
			strava_auth: "success",
			access_token: "access-1",
			refresh_token: "refresh-1",
			expires_at: "123456",
			athlete_id: "77",
			athlete_name: "Tin Pham",
			athlete_city: "HCM",
			athlete_country: "VN",
		});

		const result = parseStravaSessionFromSearch(params);

		expect(result).not.toBeNull();
		expect(result?.accessToken).toBe("access-1");
		expect(result?.athlete?.id).toBe(77);
		expect(result?.athlete?.firstname).toBe("Tin Pham");
	});

	it("determines token refresh threshold correctly", () => {
		const nowSec = Math.floor(Date.now() / 1000);
		expect(shouldRefreshToken(nowSec + 301)).toBe(false);
		expect(shouldRefreshToken(nowSec + 299)).toBe(true);
		expect(shouldRefreshToken(null)).toBe(false);
	});

	it("builds monthly and weekly context from MVP-supported activities only", () => {
		const activities = [
			{
				id: 1,
				name: "Run A",
				start_date: "2026-04-07T05:00:00.000Z",
				distance: 10000,
				moving_time: 3600,
				elapsed_time: 3660,
				total_elevation_gain: 40,
				average_heartrate: 150,
				type: "Run",
			},
			{
				id: 2,
				name: "Walk B",
				start_date: "2026-04-06T05:00:00.000Z",
				distance: 5000,
				moving_time: 1500,
				elapsed_time: 1510,
				total_elevation_gain: 20,
				average_heartrate: 145,
				type: "Walk",
			},
			{
				id: 4,
				name: "Hiking C",
				start_date: "2026-04-02T05:00:00.000Z",
				distance: 8000,
				moving_time: 4200,
				elapsed_time: 4300,
				total_elevation_gain: 300,
				average_heartrate: 138,
				sport_type: "Hike",
			},
			{
				id: 5,
				name: "Trail D",
				start_date: "2026-04-01T05:00:00.000Z",
				distance: 12000,
				moving_time: 5400,
				elapsed_time: 5500,
				total_elevation_gain: 500,
				average_heartrate: 155,
				sport_type: "TrailRun",
			},
			{
				id: 3,
				name: "Ride",
				start_date: "2026-04-06T05:00:00.000Z",
				distance: 40000,
				moving_time: 4000,
				elapsed_time: 4050,
				total_elevation_gain: 100,
				type: "Ride",
			},
		];

		const result = buildStravaMonthlyWeeklyContext(activities as any);

		expect(result.monthly.totalRuns).toBe(4);
		expect(result.monthly.totalDistanceKm).toBe(35);
		expect(result.monthly.longestRunKm).toBe(12);
		expect(result.weekly.runsThisWeek).toBe(2);
		expect(result.weekly.totalDistanceKm).toBe(15);
	});

	it("extracts Strava activity session and derived metrics from streams", () => {
		const activity = {
			id: 10,
			name: "Morning Run",
			start_date: "2026-04-08T05:30:00.000Z",
			distance: 10000,
			moving_time: 3600,
			elapsed_time: 3660,
			total_elevation_gain: 50,
			average_heartrate: 150,
			max_heartrate: 175,
			average_cadence: 88,
			calories: 700,
		};

		const streams = {
			time: [0, 60, 120, 180, 240, 300, 360, 420, 480, 540],
			distance: [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000],
			heartrate: [140, 142, 143, 145, 146, 150, 152, 154, 156, 158],
			cadence: [85, 86, 87, 88, 88, 89, 90, 91, 90, 89],
			altitude: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
			velocity_smooth: [2.8, 2.7, 2.9, 0.1, 0.1, 2.8, 2.9, 3, 2.8, 2.9],
		};

		const result = extractStravaActivityData(activity as any, streams);

		expect(result.session.totalDistanceKm).toBe(10);
		expect(result.session.avgPacePerKm).toBe(`6'00"/km`);
		expect(result.session.avgCadenceSpm).toBe(176);
		expect(result.derived.pauseCount).toBe(1);
		expect(result.derived.pauseDurationSec).toBe(120);
		expect(result.derived.hrDrift).toBeGreaterThan(0);
	});

	it("assembles Strava prompt segments in system-context-guardrails order", () => {
		const segments = buildStravaPromptSegments({
			profile: {
				name: "Tin",
				location: "HCM",
				runningLevel: "intermediate",
				weightKg: 68,
				maxHr: 190,
				hrZones: {
					z1: "120-140",
					z2: "141-155",
					z3: "156-170",
					z4: "171-182",
					z5: "183-190",
				},
			},
			athleteStats: {
				recent_run_totals: {
					count: 3,
					distance: 30000,
					moving_time: 9000,
					elevation_gain: 100,
				},
				ytd_run_totals: {
					count: 20,
					distance: 200000,
					moving_time: 60000,
					elevation_gain: 1000,
				},
				all_run_totals: {
					count: 100,
					distance: 1000000,
					moving_time: 300000,
					elevation_gain: 5000,
				},
			},
			monthlyContext: {
				totalRuns: 5,
				totalDistanceKm: 50,
				totalTimeHours: 5,
				avgPacePerKm: `6'00"/km`,
				avgHeartRate: 150,
				longestRunKm: 15,
			},
			weeklyContext: {
				runsThisWeek: 2,
				totalDistanceKm: 20,
				totalTimeHours: 2,
				avgPacePerKm: `6'00"/km`,
			},
			activity: {
				session: {
					totalDistanceKm: 10,
					movingTimeSec: 3600,
					elapsedTimeSec: 3660,
					avgHeartRate: 150,
					maxHeartRate: 172,
					avgCadenceSpm: 176,
					avgPacePerKm: `6'00"/km`,
					totalCalories: 700,
					totalAscent: 50,
					startTime: "2026-04-08T05:30:00.000Z",
					activityName: "Morning Run",
				},
				laps: [],
				derived: {
					hrDrift: 7,
					paceVariability: 0.1,
					cadenceVariability: 2,
					pauseCount: 1,
					pauseDurationSec: 30,
				},
			},
		});

		expect(segments).toHaveLength(3);
		expect(segments[0]).toMatch(/Name: Tin/);
		expect(segments[0]).toMatch(/Weight: 68 kg/);
		expect(segments[0]).toMatch(/Zone 1 Easy Recovery: 120-140 bpm/);
		expect(segments[1]).toMatch(/Thông tin runner:/);
		expect(segments[1]).toMatch(/Dữ liệu buổi chạy được chọn:/);
		expect(segments[2]).toMatch(
			/Analysis report by https:\/\/rundecode\.tinspham\.dev/,
		);
		expect(segments[2]).toMatch(
			/AI model: \[insert_correct_your_ai_model_name\]/,
		);
	});

	it("buildRunAnalysisSystemPrompt keeps fallback defaults when profile is absent", () => {
		const prompt = buildRunAnalysisSystemPrompt(null);
		expect(prompt).toMatch(/Name: Tin/);
		expect(prompt).toMatch(/Convert using weight 75 kg/);
	});
});
