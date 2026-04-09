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
	return <HomePageClient />;
}
