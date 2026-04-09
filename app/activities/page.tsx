import { Suspense } from "react";
import type { Metadata } from "next";
import { ActivitiesPageClient } from "../../components/ActivitiesPageClient";

const pageTitle = "Activities Dashboard";
const pageDescription =
	"Connect Strava, complete your athlete profile, and browse recent running activities for AI analysis.";

export const metadata: Metadata = {
	title: pageTitle,
	description: pageDescription,
	alternates: {
		canonical: "/activities",
	},
	openGraph: {
		title: pageTitle,
		description: pageDescription,
		url: "/activities",
	},
	twitter: {
		title: pageTitle,
		description: pageDescription,
	},
};

export default function ActivitiesPage() {
	return (
		<Suspense fallback={null}>
			<ActivitiesPageClient />
		</Suspense>
	);
}
