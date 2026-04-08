import type { Metadata } from "next";
import { HomePageClient } from "../components/HomePageClient";

const pageTitle = "AI Running Analysis for Strava or FIT";
const pageDescription =
	"Analyze Strava activities or FIT files with AI. Get Vietnamese run insights, route context, and one-tap sync to your Strava description.";

export const metadata: Metadata = {
	title: pageTitle,
	description: pageDescription,
	alternates: {
		canonical: "/",
	},
	openGraph: {
		title: pageTitle,
		description: pageDescription,
		url: "/",
	},
	twitter: {
		title: pageTitle,
		description: pageDescription,
	},
};

export default function HomePage() {
	return (
		<>
			<section
				style={{ maxWidth: 960, margin: "0 auto", padding: "1.25rem 1rem 0" }}
			>
				<h1
					style={{
						fontSize: "1.75rem",
						fontWeight: 800,
						color: "#f8fafc",
						marginBottom: "0.5rem",
					}}
				>
					AI Running Analysis for Strava or FIT Workouts
				</h1>
				<p
					style={{ color: "#94a3b8", lineHeight: 1.6, marginBottom: "0.75rem" }}
				>
					RunDecode helps runners analyze Strava activities or FIT uploads with
					Vietnamese AI insights, clear performance context, and fast copy/sync
					workflow.
				</p>
				<p style={{ color: "#94a3b8", lineHeight: 1.6 }}>
					Start with Strava for quick activity analysis, or switch to manual FIT
					upload when needed.
				</p>
			</section>
			<HomePageClient />
		</>
	);
}
