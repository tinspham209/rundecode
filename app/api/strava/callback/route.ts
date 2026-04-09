import { NextResponse } from "next/server";

type StravaTokenResponse = {
	access_token: string;
	refresh_token: string;
	expires_at: number;
	athlete?: {
		id: number;
		firstname?: string;
		lastname?: string;
		city?: string;
		country?: string;
	};
};

export async function GET(request: Request) {
	const requestUrl = new URL(request.url);
	const code = requestUrl.searchParams.get("code");
	const error = requestUrl.searchParams.get("error");

	const redirectTarget = new URL("/activities", request.url);

	if (error) {
		redirectTarget.searchParams.set("strava_auth", "error");
		redirectTarget.searchParams.set("message", error);
		return NextResponse.redirect(redirectTarget);
	}

	if (!code) {
		redirectTarget.searchParams.set("strava_auth", "error");
		redirectTarget.searchParams.set("message", "missing_code");
		return NextResponse.redirect(redirectTarget);
	}

	const clientId = process.env.STRAVA_CLIENT_ID;
	const clientSecret = process.env.STRAVA_CLIENT_SECRET;
	const redirectUri =
		process.env.STRAVA_REDIRECT_URI ??
		new URL("/api/strava/callback", request.url).toString();

	if (!clientId || !clientSecret) {
		redirectTarget.searchParams.set("strava_auth", "error");
		redirectTarget.searchParams.set("message", "missing_strava_env");
		return NextResponse.redirect(redirectTarget);
	}

	try {
		const tokenResponse = await fetch("https://www.strava.com/oauth/token", {
			method: "POST",
			headers: {
				"content-type": "application/json",
			},
			body: JSON.stringify({
				client_id: clientId,
				client_secret: clientSecret,
				code,
				grant_type: "authorization_code",
				redirect_uri: redirectUri,
			}),
			cache: "no-store",
		});

		const payload = (await tokenResponse.json()) as
			| StravaTokenResponse
			| { message?: string };

		if (!tokenResponse.ok || !("access_token" in payload)) {
			redirectTarget.searchParams.set("strava_auth", "error");
			redirectTarget.searchParams.set(
				"message",
				"message" in payload && payload.message
					? payload.message
					: "token_exchange_failed",
			);
			return NextResponse.redirect(redirectTarget);
		}

		redirectTarget.searchParams.set("strava_auth", "success");
		redirectTarget.searchParams.set("access_token", payload.access_token);
		redirectTarget.searchParams.set("refresh_token", payload.refresh_token);
		redirectTarget.searchParams.set("expires_at", String(payload.expires_at));

		if (payload.athlete?.id) {
			redirectTarget.searchParams.set("athlete_id", String(payload.athlete.id));
			redirectTarget.searchParams.set(
				"athlete_name",
				[payload.athlete.firstname, payload.athlete.lastname]
					.filter(Boolean)
					.join(" ")
					.trim(),
			);
			redirectTarget.searchParams.set(
				"athlete_city",
				payload.athlete.city ?? "",
			);
			redirectTarget.searchParams.set(
				"athlete_country",
				payload.athlete.country ?? "",
			);
		}

		return NextResponse.redirect(redirectTarget);
	} catch {
		redirectTarget.searchParams.set("strava_auth", "error");
		redirectTarget.searchParams.set("message", "callback_error");
		return NextResponse.redirect(redirectTarget);
	}
}
