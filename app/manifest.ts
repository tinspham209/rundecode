import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "RunDecode",
		short_name: "RD",
		description:
			"Analyze Strava activities and FIT files with AI. Get Vietnamese run insights, route context, and one-tap sync to your Strava description.",
		icons: [
			{ src: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
			{ src: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
			{
				src: "/android-chrome-192x192.png",
				sizes: "192x192",
				type: "image/png",
			},
			{
				src: "/android-chrome-512x512.png",
				sizes: "512x512",
				type: "image/png",
			},
		],
		theme_color: "#ffffff",
		background_color: "#ffffff",
		display: "standalone",
	};
}
