import type { Metadata } from "next";
import { ActivityDetailPageClient } from "../../../components/ActivityDetailPageClient";

type ActivityDetailPageProps = {
	params: {
		id: string;
	};
};

export async function generateMetadata({
	params,
}: ActivityDetailPageProps): Promise<Metadata> {
	return {
		title: `Activity ${params.id} Analysis`,
		description:
			"Review a Strava activity, generate AI analysis, and sync the result back to Strava.",
		alternates: {
			canonical: `/activities/${params.id}`,
		},
	};
}

export default function ActivityDetailPage({
	params,
}: ActivityDetailPageProps) {
	return <ActivityDetailPageClient activityId={params.id} />;
}
