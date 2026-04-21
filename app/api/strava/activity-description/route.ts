import { NextResponse } from "next/server";

type JsonError = { error: string };

type Body = {
	activityId?: number;
	name?: string;
	description?: string;
};

function getAccessToken(request: Request): string | null {
	const auth = request.headers.get("authorization") ?? "";
	if (!auth.toLowerCase().startsWith("bearer ")) {
		return null;
	}
	return auth.slice(7).trim() || null;
}

export async function POST(request: Request) {
	const accessToken = getAccessToken(request);
	if (!accessToken) {
		return NextResponse.json<JsonError>(
			{ error: "Missing Bearer token." },
			{ status: 401 },
		);
	}

	let body: Body;
	try {
		body = (await request.json()) as Body;
	} catch {
		return NextResponse.json<JsonError>(
			{ error: "Invalid request body." },
			{ status: 400 },
		);
	}

	const activityId = Number(body.activityId);
	if (!Number.isFinite(activityId) || activityId <= 0) {
		return NextResponse.json<JsonError>(
			{ error: "Invalid activityId." },
			{ status: 400 },
		);
	}

	const description =
		typeof body.description === "string" ? body.description.trim() : "";
	const name = typeof body.name === "string" ? body.name.trim() : "";

	if (!description && !name) {
		return NextResponse.json<JsonError>(
			{ error: "Description or name is required." },
			{ status: 400 },
		);
	}

	const upstream = `https://www.strava.com/api/v3/activities/${activityId}`;
	const params = new URLSearchParams();
	if (description) params.set("description", description);
	if (name) params.set("name", name);

	try {
		const response = await fetch(upstream, {
			method: "PUT",
			headers: {
				authorization: `Bearer ${accessToken}`,
				"content-type": "application/x-www-form-urlencoded",
			},
			body: params.toString(),
			cache: "no-store",
		});

		const result = await response.json();
		if (!response.ok) {
			return NextResponse.json<JsonError>(
				{
					error:
						result?.message ?? "Failed to update Strava activity description.",
				},
				{ status: response.status || 500 },
			);
		}

		return NextResponse.json({ ok: true, activity: result });
	} catch {
		return NextResponse.json<JsonError>(
			{ error: "Unexpected error while updating activity description." },
			{ status: 500 },
		);
	}
}
