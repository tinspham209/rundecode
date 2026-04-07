"use client";

import React, { useMemo, useState } from "react";
import { CheckCircle2, Copy, RotateCcw } from "lucide-react";
import { MetadataSidebar, type Metadata } from "./MetadataSidebar";
import { Button } from "./ui/button";

type AnalysisDisplayProps = {
	initialAnalysis: string;
	metadata: Metadata;
	onReset: () => void;
};

export function AnalysisDisplay({
	initialAnalysis,
	metadata,
	onReset,
}: AnalysisDisplayProps) {
	const [analysisText, setAnalysisText] = useState(initialAnalysis);
	const [copied, setCopied] = useState(false);

	const charCount = useMemo(() => analysisText.length, [analysisText]);

	const copyToClipboard = async () => {
		await navigator.clipboard.writeText(analysisText);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<section className="section-grid" aria-label="Analysis panel">
			<div
				style={{
					borderRadius: 16,
					border: "1px solid rgba(255,255,255,0.07)",
					background:
						"linear-gradient(145deg,rgba(10,20,46,0.92),rgba(4,10,26,0.96))",
					boxShadow: "0 20px 40px -8px rgba(0,0,0,0.55)",
					overflow: "hidden",
				}}
			>
				<div style={{ padding: "1.5rem 1.5rem 1rem" }}>
					<h2
						style={{
							margin: 0,
							fontWeight: 700,
							fontSize: "1rem",
							color: "#fff",
						}}
					>
						Báo cáo phân tích chạy (Analysis by AI)
					</h2>
					<p
						style={{
							margin: "0.25rem 0 0",
							fontSize: "0.78rem",
							color: "#64748b",
						}}
					>
						Có thể chỉnh sửa trước khi copy lên Strava.
					</p>
				</div>

				<div style={{ padding: "0 1.5rem 1.5rem" }}>
					<label htmlFor="analysis-text" className="sr-only">
						Analysis text
					</label>
					<textarea
						id="analysis-text"
						aria-label="Analysis text"
						value={analysisText}
						onChange={(event) => setAnalysisText(event.target.value)}
						style={{
							width: "100%",
							minHeight: 280,
							borderRadius: 12,
							border: "1px solid rgba(255,255,255,0.09)",
							background: "rgba(0,0,0,0.3)",
							color: "#e2e8f0",
							padding: "0.875rem 1rem",
							fontSize: "0.9rem",
							lineHeight: 1.75,
							resize: "vertical",
							outline: "none",
							fontFamily: "inherit",
							boxSizing: "border-box",
						}}
					/>

					<div
						style={{
							marginTop: "0.875rem",
							display: "flex",
							flexWrap: "wrap",
							alignItems: "center",
							justifyContent: "space-between",
							gap: "0.75rem",
						}}
					>
						<p style={{ margin: 0, fontSize: "0.72rem", color: "#475569" }}>
							{charCount} ký tự
						</p>
						<div style={{ display: "flex", gap: "0.5rem" }}>
							<Button type="button" onClick={copyToClipboard}>
								<Copy size={14} />
								Copy to Clipboard
							</Button>
							<Button type="button" variant="secondary" onClick={onReset}>
								<RotateCcw size={14} />
								Analyze Another Run
							</Button>
						</div>
					</div>

					{copied ? (
						<p
							style={{
								marginTop: "0.625rem",
								fontSize: "0.83rem",
								fontWeight: 600,
								color: "#6ee7b7",
								display: "inline-flex",
								alignItems: "center",
								gap: "0.375rem",
							}}
						>
							<CheckCircle2 size={14} />
							Copied!
						</p>
					) : null}
				</div>
			</div>

			<MetadataSidebar metadata={metadata} />
		</section>
	);
}
