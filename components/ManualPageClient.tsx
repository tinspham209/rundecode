"use client";

import React from "react";
import Link from "next/link";
import { Activity } from "lucide-react";
import { FitUploadPanel } from "./FitUploadPanel";

export function ManualPageClient() {
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
							RunDecode / Manual
						</div>
					</div>
				</div>
				<Link href="/" style={{ color: "#93c5fd", fontSize: "0.85rem" }}>
					← Back to Strava flow
				</Link>
			</nav>

			<FitUploadPanel />
		</main>
	);
}
