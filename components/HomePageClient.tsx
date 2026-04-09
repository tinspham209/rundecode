"use client";

import React from "react";
import Link from "next/link";
import { Activity } from "lucide-react";
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
		<main
			style={{ maxWidth: 1200, margin: "0 auto", padding: "2.5rem 1.5rem" }}
		>
			{/* Navigation / Logo Section */}
			<nav
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					marginBottom: "2rem",
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
					<div
						style={{
							width: 56,
							height: 56,
							borderRadius: 16,
							background: "linear-gradient(135deg,#f97316,#f59e0b)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							boxShadow: "0 4px 20px rgba(249,115,22,0.5)",
						}}
					>
						<Activity size={28} color="#fff" />
					</div>
					<div>
						<div
							style={{
								fontWeight: 800,
								fontSize: "1.75rem",
								color: "#fff",
								letterSpacing: "-0.02em",
								lineHeight: 1.1,
							}}
						>
							<span style={{ color: "#fff" }}>Run</span>
							<span style={{ color: "#f97316" }}>Decode</span>
						</div>
					</div>
				</div>
			</nav>

			{/* Hero section */}
			<div style={{ textAlign: "center", marginBottom: "3rem" }}>
				<h1
					style={{
						margin: "0 0 1rem",
						fontWeight: 800,
						fontSize: "clamp(2rem, 5vw, 3rem)",
						color: "#fff",
						letterSpacing: "-0.03em",
						lineHeight: 1.15,
					}}
				>
					AI Running Analysis for
					<br />
					Strava or FIT Workouts
				</h1>
				<p
					style={{
						margin: "0 auto",
						maxWidth: 640,
						fontSize: "1rem",
						lineHeight: 1.7,
						color: "#94a3b8",
					}}
				>
					RunDecode helps runners analyze Strava activities or FIT uploads with
					Vietnamese AI insights, clear performance context, and fast copy/sync
					workflow. Start with Strava for quick activity analysis, or switch to
					manual FIT upload when needed.
				</p>
			</div>

			{/* Main Content Grid: 2-col desktop, 1-col mobile */}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "1fr 1fr",
					gap: "1.5rem",
					marginBottom: "2rem",
				}}
				className="home-grid"
			>
				{/* Strava Integration Card */}
				<Card
					style={{
						border: "2px solid #f97316",
						borderRadius: 16,
						overflow: "hidden",
					}}
				>
					<CardHeader style={{ paddingTop: "1.5rem", paddingBottom: "0.5rem" }}>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: "0.75rem",
								marginBottom: "0.75rem",
							}}
						>
							<div
								style={{
									width: 36,
									height: 36,
									borderRadius: 10,
									background: "linear-gradient(135deg,#f97316,#f59e0b)",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									boxShadow: "0 2px 8px rgba(249,115,22,0.4)",
								}}
							>
								<Activity size={18} color="#fff" />
							</div>
							<CardTitle style={{ fontSize: "1.15rem", margin: 0 }}>
								Strava Activities Dashboard
							</CardTitle>
						</div>
						<CardDescription style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
							Mở luồng Strava để đăng nhập nếu cần, tự tải hoạt động gần đây, và
							đi thẳng tới màn hình phân tích từng buổi chạy.
						</CardDescription>
					</CardHeader>
					<CardContent style={{ paddingTop: "0.75rem" }}>
						<Link
							href="/activities"
							style={{ textDecoration: "none", display: "block" }}
						>
							<Button
								type="button"
								style={{
									width: "100%",
									padding: "0.85rem 1.2rem",
									fontSize: "1rem",
									fontWeight: 600,
									background: "linear-gradient(135deg,#f97316,#f59e0b)",
									border: "none",
									cursor: "pointer",
									borderRadius: 10,
								}}
							>
								Open Activities Dashboard
							</Button>
						</Link>
					</CardContent>
				</Card>

				{/* Manual FIT Upload Card */}
				<Card
					style={{
						border: "2px solid #f97316",
						borderRadius: 16,
						overflow: "hidden",
					}}
				>
					<CardHeader style={{ paddingTop: "1.5rem", paddingBottom: "0.5rem" }}>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: "0.75rem",
								marginBottom: "0.75rem",
							}}
						>
							<div
								style={{
									width: 36,
									height: 36,
									borderRadius: 10,
									background: "rgba(249,115,22,0.15)",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									border: "1px solid rgba(249,115,22,0.3)",
								}}
							>
								<Activity size={18} color="#f97316" />
							</div>
							<CardTitle style={{ fontSize: "1.15rem", margin: 0 }}>
								Manual FIT flow
							</CardTitle>
						</div>
						<CardDescription style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
							Nếu bạn muốn phân tích thủ công bằng file .fit, dùng luồng tách
							riêng tại /manual.
						</CardDescription>
					</CardHeader>
					<CardContent style={{ paddingTop: "0.75rem" }}>
						<Link
							href="/manual"
							style={{ textDecoration: "none", display: "block" }}
						>
							<Button
								type="button"
								style={{
									width: "100%",
									padding: "0.85rem 1.2rem",
									fontSize: "1rem",
									fontWeight: 600,
									background: "linear-gradient(135deg,#f97316,#f59e0b)",
									border: "none",
									cursor: "pointer",
									borderRadius: 10,
								}}
							>
								Manual Fit flow
							</Button>
						</Link>
					</CardContent>
				</Card>
			</div>

			{/* Responsive Grid Adjustment for smaller screens */}
			<style>{`
				@media (max-width: 768px) {
					.home-grid {
						grid-template-columns: 1fr !important;
					}
					main {
						padding: 1.5rem 1rem;
					}
				}
			`}</style>
		</main>
	);
}
