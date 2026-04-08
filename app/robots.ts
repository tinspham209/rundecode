import type { MetadataRoute } from "next";

const siteUrl = "https://rundecode.tinspham.dev";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: "*",
			allow: ["/", "/manual"],
			disallow: ["/api/"],
		},
		sitemap: `${siteUrl}/sitemap.xml`,
		host: siteUrl,
	};
}
