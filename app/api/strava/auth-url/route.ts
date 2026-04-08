import { NextResponse } from "next/server";
import { buildStravaAuthorizeUrl } from "../../../../lib/stravaAuth";

type JsonError = { error: string };

export async function GET(request: Request) {
	const clientId = process.env.STRAVA_CLIENT_ID;
	const redirectUri =
		process.env.STRAVA_REDIRECT_URI ??
		new URL("/api/strava/callback", request.url).toString();

	if (!clientId) {
		return NextResponse.json<JsonError>(
			{ error: "Missing STRAVA_CLIENT_ID environment variable." },
			{ status: 500 },
		);
	}

	const url = buildStravaAuthorizeUrl({
		clientId,
		redirectUri,
		state: "rundecode-strava",
	});

	return NextResponse.json({ url });
}
