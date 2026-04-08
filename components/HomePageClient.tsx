"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { Activity } from "lucide-react";
import { StravaPanel } from "./StravaPanel";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";

export function HomePageClient() {
	return (
		<main style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1rem" }}>
			<nav
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					marginBottom: "2rem",
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
					<div
						style={{
							width: 40,
							height: 40,
							borderRadius: 12,
							background: "linear-gradient(135deg,#f97316,#f59e0b)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							boxShadow: "0 4px 16px rgba(249,115,22,0.4)",
						}}
					>
						<Activity size={20} color="#fff" />
					</div>
					<div>
						<div
							style={{
								fontWeight: 800,
								fontSize: "1.2rem",
								color: "#fff",
								letterSpacing: "-0.02em",
							}}
						>
							RunDecode
						</div>
						<div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: 1 }}>
							Automatic Strava Analysis + Manual FIT Upload
						</div>
					</div>
				</div>
			</nav>

			<Suspense fallback={null}>
				<StravaPanel />
			</Suspense>

			<Card>
				<CardHeader>
					<CardTitle>Manual FIT flow</CardTitle>
					<CardDescription>
						Nếu bạn muốn phân tích thủ công bằng file .fit, dùng luồng tách
						riêng tại /manual.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Link href="/manual" style={{ textDecoration: "none" }}>
						<Button type="button">Go to /manual</Button>
					</Link>
				</CardContent>
			</Card>
		</main>
	);
}
