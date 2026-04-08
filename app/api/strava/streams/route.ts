import { NextResponse } from "next/server";

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
	const id = requestUrl.searchParams.get("id");

	if (!id) {
		return NextResponse.json<JsonError>(
			{ error: "Missing activity id." },
			{ status: 400 },
		);
	}

	const upstream = new URL(`https://www.strava.com/api/v3/activities/${id}/streams`);
	upstream.searchParams.set(
		"keys",
		"time,distance,heartrate,cadence,altitude,velocity_smooth",
	);
	upstream.searchParams.set("resolution", "medium");
	upstream.searchParams.set("series_type", "distance");

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
				{ error: payload?.message ?? "Failed to fetch Strava streams." },
				{ status: response.status || 500 },
			);
		}

		return NextResponse.json({ streams: payload });
	} catch {
		return NextResponse.json<JsonError>(
			{ error: "Unexpected error while fetching streams." },
			{ status: 500 },
		);
	}
}
