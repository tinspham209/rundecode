import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("Strava API routes", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		vi.restoreAllMocks();
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	it("GET /api/strava/auth-url returns 500 when STRAVA_CLIENT_ID is missing", async () => {
		delete process.env.STRAVA_CLIENT_ID;
		const { GET } = await import("../app/api/strava/auth-url/route");

		const response = await GET(
			new Request("http://localhost/api/strava/auth-url"),
		);
		const body = await response.json();

		expect(response.status).toBe(500);
		expect(body.error).toMatch(/missing strava_client_id/i);
	});

	it("GET /api/strava/auth-url returns Strava authorize URL", async () => {
		process.env.STRAVA_CLIENT_ID = "12345";
		process.env.STRAVA_REDIRECT_URI =
			"http://localhost:3000/api/strava/callback";
		const { GET } = await import("../app/api/strava/auth-url/route");

		const response = await GET(
			new Request("http://localhost/api/strava/auth-url"),
		);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.url).toContain("www.strava.com/oauth/authorize");
		expect(body.url).toContain("client_id=12345");
		expect(body.url).toContain("activity%3Aread_all");
		expect(body.url).toContain("activity%3Awrite");
	});

	it("POST /api/strava/refresh returns 400 when refresh token is missing", async () => {
		const { POST } = await import("../app/api/strava/refresh/route");
		const request = new Request("http://localhost/api/strava/refresh", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({}),
		});

		const response = await POST(request);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body.error).toMatch(/refreshToken is required/i);
	});

	it("POST /api/strava/refresh proxies refresh success", async () => {
		process.env.STRAVA_CLIENT_ID = "123";
		process.env.STRAVA_CLIENT_SECRET = "secret";
		vi.spyOn(global, "fetch").mockResolvedValue(
			new Response(
				JSON.stringify({
					access_token: "new-access",
					refresh_token: "new-refresh",
					expires_at: 123456,
				}),
				{ status: 200, headers: { "content-type": "application/json" } },
			),
		);

		const { POST } = await import("../app/api/strava/refresh/route");
		const request = new Request("http://localhost/api/strava/refresh", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ refreshToken: "old-refresh" }),
		});

		const response = await POST(request);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.accessToken).toBe("new-access");
		expect(body.refreshToken).toBe("new-refresh");
		expect(body.expiresAt).toBe(123456);
	});

	it("GET /api/strava/activities returns 401 without bearer token", async () => {
		const { GET } = await import("../app/api/strava/activities/route");
		const response = await GET(
			new Request("http://localhost/api/strava/activities?mode=list"),
		);
		const body = await response.json();

		expect(response.status).toBe(401);
		expect(body.error).toMatch(/missing bearer token/i);
	});

	it("GET /api/strava/activities uses context mode per_page=60 and filters unsupported activities", async () => {
		const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
			new Response(
				JSON.stringify([
					{ id: 1, type: "Run", sport_type: "Run" },
					{ id: 2, type: "Ride", sport_type: "Ride" },
					{ id: 3, type: "Walk", sport_type: "Walk" },
				]),
				{
					status: 200,
					headers: { "content-type": "application/json" },
				},
			),
		);

		const { GET } = await import("../app/api/strava/activities/route");
		const response = await GET(
			new Request("http://localhost/api/strava/activities?mode=context", {
				headers: { authorization: "Bearer token-123" },
			}),
		);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.activities).toHaveLength(2);
		expect(
			body.activities.map((activity: { id: number }) => activity.id),
		).toEqual([1, 3]);
		const [upstreamUrl, init] = fetchSpy.mock.calls[0] as [URL, RequestInit];
		expect(String(upstreamUrl)).toContain("per_page=60");
		expect(String(upstreamUrl)).toContain("after=");
		expect(String(upstreamUrl)).toContain("before=");
		expect((init.headers as Record<string, string>).authorization).toBe(
			"Bearer token-123",
		);
	});

	it("GET /api/strava/streams validates activity id and proxies fixed stream params", async () => {
		const { GET } = await import("../app/api/strava/streams/route");
		const badResponse = await GET(
			new Request("http://localhost/api/strava/streams", {
				headers: { authorization: "Bearer token-123" },
			}),
		);
		expect(badResponse.status).toBe(400);

		const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
			new Response(JSON.stringify([{ type: "time", data: [0, 1] }]), {
				status: 200,
				headers: { "content-type": "application/json" },
			}),
		);

		const okResponse = await GET(
			new Request("http://localhost/api/strava/streams?id=999", {
				headers: { authorization: "Bearer token-123" },
			}),
		);
		const body = await okResponse.json();

		expect(okResponse.status).toBe(200);
		expect(body.streams[0].type).toBe("time");
		const [upstreamUrl] = fetchSpy.mock.calls[0] as [URL, RequestInit];
		expect(String(upstreamUrl)).toContain("activities/999/streams");
		expect(String(upstreamUrl)).toContain("resolution=medium");
		expect(String(upstreamUrl)).toContain("series_type=distance");
	});

	it("GET /api/strava/athlete-stats validates athleteId and proxies success", async () => {
		const { GET } = await import("../app/api/strava/athlete-stats/route");

		const badResponse = await GET(
			new Request("http://localhost/api/strava/athlete-stats", {
				headers: { authorization: "Bearer token-123" },
			}),
		);
		expect(badResponse.status).toBe(400);

		vi.spyOn(global, "fetch").mockResolvedValue(
			new Response(JSON.stringify({ all_run_totals: { count: 42 } }), {
				status: 200,
				headers: { "content-type": "application/json" },
			}),
		);

		const okResponse = await GET(
			new Request("http://localhost/api/strava/athlete-stats?athleteId=77", {
				headers: { authorization: "Bearer token-123" },
			}),
		);
		const body = await okResponse.json();

		expect(okResponse.status).toBe(200);
		expect(body.stats.all_run_totals.count).toBe(42);
	});

	it("POST /api/strava/activity-description returns 401 without bearer token", async () => {
		const { POST } =
			await import("../app/api/strava/activity-description/route");
		const response = await POST(
			new Request("http://localhost/api/strava/activity-description", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ activityId: 10, description: "hello" }),
			}),
		);
		const body = await response.json();

		expect(response.status).toBe(401);
		expect(body.error).toMatch(/missing bearer token/i);
	});

	it("POST /api/strava/activity-description validates payload", async () => {
		const { POST } =
			await import("../app/api/strava/activity-description/route");
		const response = await POST(
			new Request("http://localhost/api/strava/activity-description", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					authorization: "Bearer token-123",
				},
				body: JSON.stringify({ activityId: 0, description: "" }),
			}),
		);

		expect(response.status).toBe(400);
	});

	it("POST /api/strava/activity-description proxies Strava update", async () => {
		const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
			new Response(JSON.stringify({ id: 10, description: "analysis text" }), {
				status: 200,
				headers: { "content-type": "application/json" },
			}),
		);

		const { POST } =
			await import("../app/api/strava/activity-description/route");
		const response = await POST(
			new Request("http://localhost/api/strava/activity-description", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					authorization: "Bearer token-123",
				},
				body: JSON.stringify({
					activityId: 10,
					description: "analysis text",
				}),
			}),
		);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.ok).toBe(true);

		const [upstreamUrl, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
		expect(upstreamUrl).toContain("/api/v3/activities/10");
		expect(init.method).toBe("PUT");
		expect((init.headers as Record<string, string>).authorization).toBe(
			"Bearer token-123",
		);
		expect(String(init.body)).toContain("description=analysis+text");
	});
});
