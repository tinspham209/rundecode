import type { StravaAthlete } from "./stravaTypes";

export const STRAVA_SCOPES =
	"read,activity:read_all,activity:write,profile:read_all";

export type StravaSessionPayload = {
	athlete: StravaAthlete | null;
	accessToken: string;
	refreshToken: string;
	expiresAt: number;
};

export function shouldRefreshToken(expiresAt: number | null): boolean {
	if (!expiresAt) {
		return false;
	}

	const now = Math.floor(Date.now() / 1000);
	return now > expiresAt - 300;
}

export function buildStravaAuthorizeUrl(params: {
	clientId: string;
	redirectUri: string;
	state?: string;
}): string {
	const url = new URL("https://www.strava.com/oauth/authorize");
	url.searchParams.set("client_id", params.clientId);
	url.searchParams.set("response_type", "code");
	url.searchParams.set("approval_prompt", "auto");
	url.searchParams.set("redirect_uri", params.redirectUri);
	url.searchParams.set("scope", STRAVA_SCOPES);

	if (params.state) {
		url.searchParams.set("state", params.state);
	}

	return url.toString();
}

export function parseStravaSessionFromSearch(
	search: URLSearchParams | null,
): StravaSessionPayload | null {
	if (!search) {
		return null;
	}

	if (search.get("strava_auth") !== "success") {
		return null;
	}

	const accessToken = search.get("access_token");
	const refreshToken = search.get("refresh_token");
	const expiresAtRaw = search.get("expires_at");

	if (!accessToken || !refreshToken || !expiresAtRaw) {
		return null;
	}

	const expiresAt = Number(expiresAtRaw);
	if (!Number.isFinite(expiresAt)) {
		return null;
	}

	const athleteId = Number(search.get("athlete_id") ?? "");
	const athleteName = search.get("athlete_name") ?? "";
	const athleteCity = search.get("athlete_city") ?? "";
	const athleteCountry = search.get("athlete_country") ?? "";

	const athlete: StravaAthlete | null = Number.isFinite(athleteId)
		? {
				id: athleteId,
				firstname: athleteName,
				city: athleteCity,
				country: athleteCountry,
			}
		: null;

	return {
		athlete,
		accessToken,
		refreshToken,
		expiresAt,
	};
}
