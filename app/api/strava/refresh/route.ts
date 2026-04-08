import { NextResponse } from "next/server";

type JsonError = { error: string };

type RefreshResponse = {
	access_token: string;
	refresh_token: string;
	expires_at: number;
};

export async function POST(request: Request) {
	try {
		const { refreshToken } = (await request.json()) as {
			refreshToken?: string;
		};

		if (!refreshToken) {
			return NextResponse.json<JsonError>(
				{ error: "refreshToken is required." },
				{ status: 400 },
			);
		}

		const clientId = process.env.STRAVA_CLIENT_ID;
		const clientSecret = process.env.STRAVA_CLIENT_SECRET;

		if (!clientId || !clientSecret) {
			return NextResponse.json<JsonError>(
				{ error: "Missing STRAVA_CLIENT_ID or STRAVA_CLIENT_SECRET." },
				{ status: 500 },
			);
		}

		const response = await fetch("https://www.strava.com/oauth/token", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				client_id: clientId,
				client_secret: clientSecret,
				grant_type: "refresh_token",
				refresh_token: refreshToken,
			}),
			cache: "no-store",
		});

		const payload = (await response.json()) as
			| RefreshResponse
			| { message?: string };

		if (!response.ok || !("access_token" in payload)) {
			return NextResponse.json<JsonError>(
				{
					error:
						"message" in payload && payload.message
							? payload.message
							: "Failed to refresh Strava token.",
				},
				{ status: response.status || 401 },
			);
		}

		return NextResponse.json({
			accessToken: payload.access_token,
			refreshToken: payload.refresh_token,
			expiresAt: payload.expires_at,
		});
	} catch {
		return NextResponse.json<JsonError>(
			{ error: "Unexpected error while refreshing token." },
			{ status: 500 },
		);
	}
}
