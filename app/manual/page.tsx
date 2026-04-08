import type { Metadata } from "next";
import { ManualPageClient } from "../../components/ManualPageClient";

const pageTitle = "Manual FIT Upload and AI Run Analysis";
const pageDescription =
	"Upload FIT files, preview workout metadata, choose your AI model, and generate a Vietnamese running analysis ready for Strava.";

export const metadata: Metadata = {
	title: pageTitle,
	description: pageDescription,
	alternates: {
		canonical: "/manual",
	},
	openGraph: {
		title: pageTitle,
		description: pageDescription,
		url: "/manual",
	},
	twitter: {
		title: pageTitle,
		description: pageDescription,
	},
};

export default function ManualPage() {
	return (
		<>
			<section
				style={{ maxWidth: 960, margin: "0 auto", padding: "1.25rem 1rem 0" }}
			>
				<h1
					style={{
						fontSize: "1.6rem",
						fontWeight: 800,
						color: "#f8fafc",
						marginBottom: "0.5rem",
					}}
				>
					Manual FIT Upload for AI Running Analysis
				</h1>
				<p style={{ color: "#94a3b8", lineHeight: 1.6 }}>
					Use this page to upload FIT files, verify parsed workout metadata, and
					run AI analysis with your selected model.
				</p>
			</section>
			<ManualPageClient />
		</>
	);
}
