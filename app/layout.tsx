import "leaflet/dist/leaflet.css";
import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import type { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "../components/theme-provider";
import "./globals.css";
import Footer from "@/components/Footer";

const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"] });
const siteUrl = "https://rundecode.tinspham.dev";
const defaultTitle = "RunDecode – AI Strava & FIT Running Analysis App";
const defaultDescription =
	"Analyze Strava activities and FIT files with AI. Get Vietnamese run insights, route context, and one-tap sync to your Strava description.";
const openGraphImage = "/opengraph-image.jpg";

export const metadata: Metadata = {
	metadataBase: new URL(siteUrl),
	title: {
		default: defaultTitle,
		template: "%s | RunDecode",
	},
	description: defaultDescription,
	applicationName: defaultTitle,
	keywords: [
		"AI running analysis",
		"Strava analysis",
		"FIT file analysis",
		"Vietnamese running insights",
	],
	category: "sports",
	alternates: {
		canonical: "/",
	},
	openGraph: {
		title: defaultTitle,
		description: defaultDescription,
		url: "/",
		siteName: defaultTitle,
		locale: "vi_VN",
		type: "website",
		images: [
			{
				url: openGraphImage,
				alt: "RunDecode preview showing Strava analysis and FIT upload workflow",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: defaultTitle,
		description: defaultDescription,
		images: [openGraphImage],
	},
	icons: {
		icon: [
			{ url: "/favicon.ico" },
			{ url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
			{ url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
		],
		apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
	},
};

type RootLayoutProps = {
	children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
	return (
		<html lang="vi" suppressHydrationWarning>
			<body className={roboto.className}>
				<ThemeProvider
					attribute="class"
					defaultTheme="dark"
					enableSystem={false}
					disableTransitionOnChange
				>
					{children}
					<Toaster
						position="top-right"
						toastOptions={{
							duration: 3500,
							style: {
								background: "rgba(15, 23, 42, 0.96)",
								color: "#e2e8f0",
								border: "1px solid rgba(148, 163, 184, 0.18)",
								boxShadow: "0 10px 30px rgba(0, 0, 0, 0.35)",
							},
							success: {
								iconTheme: {
									primary: "#10b981",
									secondary: "#ecfdf5",
								},
							},
							error: {
								iconTheme: {
									primary: "#ef4444",
									secondary: "#fff1f2",
								},
							},
						}}
					/>
					<Footer />
				</ThemeProvider>
			</body>
		</html>
	);
}
