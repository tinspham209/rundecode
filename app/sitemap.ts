import type { MetadataRoute } from "next";

const siteUrl = "https://rundecode.tinspham.dev";

export default function sitemap(): MetadataRoute.Sitemap {
	return [
		{
			url: `${siteUrl}/`,
			lastModified: new Date(),
			changeFrequency: "daily",
			priority: 1,
		},
		{
			url: `${siteUrl}/activities`,
			lastModified: new Date(),
			changeFrequency: "hourly",
			priority: 0.9,
		},
		{
			url: `${siteUrl}/profile`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.7,
		},
		{
			url: `${siteUrl}/manual`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.8,
		},
	];
}
