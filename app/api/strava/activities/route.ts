import { NextResponse } from "next/server";
import { isSupportedMvpActivity } from "../../../../lib/stravaContextBuilder";
import type { StravaActivity } from "../../../../lib/stravaTypes";

type JsonError = { error: string };

function getAccessToken(request: Request): string | null {
	const auth = request.headers.get("authorization") ?? "";
	if (!auth.toLowerCase().startsWith("bearer ")) {
		return null;
	}
	return auth.slice(7).trim() || null;
}

export async function GET(request: Request) {
	const accessToken = getAccessToken(request);
	if (!accessToken) {
		return NextResponse.json<JsonError>(
			{ error: "Missing Bearer token." },
			{ status: 401 },
		);
	}

	const requestUrl = new URL(request.url);
	const mode = requestUrl.searchParams.get("mode") ?? "list";

	const now = Math.floor(Date.now() / 1000);
	const days60Ago = now - 60 * 24 * 60 * 60;

	const perPage = mode === "context" ? 60 : 20;

	const upstream = new URL("https://www.strava.com/api/v3/athlete/activities");
	upstream.searchParams.set("per_page", String(perPage));
	upstream.searchParams.set("after", String(days60Ago));
	upstream.searchParams.set("before", String(now));

	try {
		const response = await fetch(upstream, {
			headers: {
				authorization: `Bearer ${accessToken}`,
			},
			cache: "no-store",
		});

		const payload = await response.json();
		if (!response.ok) {
			return NextResponse.json<JsonError>(
				{ error: payload?.message ?? "Failed to fetch Strava activities." },
				{ status: response.status || 500 },
			);
		}

		const activities = Array.isArray(payload)
			? (payload as StravaActivity[]).filter(isSupportedMvpActivity)
			: [];

		return NextResponse.json({ activities });
	} catch {
		return NextResponse.json<JsonError>(
			{ error: "Unexpected error while fetching activities." },
			{ status: 500 },
		);
	}
}
