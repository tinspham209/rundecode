import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "RunDecode",
		short_name: "RD",
		description:
			"Explore RunDecode to analyze and improve your running performance. Connect your Strava account to get personalized insights and training recommendations based on your running data. Whether you are a beginner or an experienced runner, RunDecode helps you understand your performance and reach your running goals.",
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
