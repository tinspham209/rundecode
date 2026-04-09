import { NextResponse } from "next/server";
import type { StravaActivity } from "../../../../../lib/stravaTypes";

type JsonError = { error: string };

function getAccessToken(request: Request): string | null {
	const auth = request.headers.get("authorization") ?? "";
	if (!auth.toLowerCase().startsWith("bearer ")) {
		return null;
	}

	return auth.slice(7).trim() || null;
}

type RouteContext = {
	params: {
		id: string;
	};
};

export async function GET(request: Request, { params }: RouteContext) {
	const accessToken = getAccessToken(request);
	if (!accessToken) {
		return NextResponse.json<JsonError>(
			{ error: "Missing Bearer token." },
			{ status: 401 },
		);
	}

	const activityId = Number(params.id);
	if (!Number.isFinite(activityId) || activityId <= 0) {
		return NextResponse.json<JsonError>(
			{ error: "Valid activity id is required." },
			{ status: 400 },
		);
	}

	try {
		const upstream = new URL(
			`https://www.strava.com/api/v3/activities/${activityId}`,
		);
		upstream.searchParams.set("include_all_efforts", "false");

		const response = await fetch(upstream, {
			headers: {
				authorization: `Bearer ${accessToken}`,
			},
			cache: "no-store",
		});

		const payload = await response.json();
		if (!response.ok) {
			return NextResponse.json<JsonError>(
				{
					error: payload?.message ?? "Failed to fetch Strava activity detail.",
				},
				{ status: response.status || 500 },
			);
		}

		return NextResponse.json({ activity: payload as StravaActivity });
	} catch {
		return NextResponse.json<JsonError>(
			{ error: "Unexpected error while fetching activity detail." },
			{ status: 500 },
		);
	}
}
