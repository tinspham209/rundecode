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
	const athleteId = requestUrl.searchParams.get("athleteId");

	if (!athleteId) {
		return NextResponse.json<JsonError>(
			{ error: "Missing athleteId." },
			{ status: 400 },
		);
	}

	const upstream = `https://www.strava.com/api/v3/athletes/${athleteId}/stats`;

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
				{ error: payload?.message ?? "Failed to fetch athlete stats." },
				{ status: response.status || 500 },
			);
		}

		return NextResponse.json({ stats: payload });
	} catch {
		return NextResponse.json<JsonError>(
			{ error: "Unexpected error while fetching athlete stats." },
			{ status: 500 },
		);
	}
}
