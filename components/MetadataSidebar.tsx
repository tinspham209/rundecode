import React from "react";
import {
	Activity,
	CalendarClock,
	Clock,
	Flame,
	HeartPulse,
	MapPin,
	TrendingUp,
	Zap,
} from "lucide-react";
import type { RunMetadata as Metadata } from "../lib/runMetadata";

type MetadataSidebarProps = {
	metadata: Metadata;
};

type MetricCard = {
	label: string;
	value: string;
	icon: React.ElementType;
	color: string;
	bg: string;
};

const cardBase: React.CSSProperties = {
	borderRadius: 14,
	border: "1px solid rgba(255,255,255,0.07)",
	background: "linear-gradient(145deg,rgba(10,20,46,0.92),rgba(4,10,26,0.96))",
	boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
	padding: "0.75rem",
	display: "flex",
	alignItems: "center",
	gap: "0.75rem",
};

export function MetadataSidebar({ metadata }: MetadataSidebarProps) {
	const startTimeLabel = metadata.start_time
		? new Date(metadata.start_time).toLocaleString("vi-VN", {
				hour12: false,
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
				hour: "2-digit",
				minute: "2-digit",
			})
		: "Không khả dụng";

	const cards: MetricCard[] = [
		{
			label: "Start Time",
			value: startTimeLabel,
			icon: CalendarClock,
			color: "#93c5fd",
			bg: "rgba(59,130,246,0.15)",
		},
		{
			label: "Distance",
			value: `${metadata.distance.toFixed(2)} km`,
			icon: MapPin,
			color: "#6ee7b7",
			bg: "rgba(16,185,129,0.15)",
		},
		{
			label: "Avg Pace",
			value: metadata.pace,
			icon: Zap,
			color: "#fdba74",
			bg: "rgba(249,115,22,0.15)",
		},
		{
			label: "Total Time",
			value: metadata.time,
			icon: Clock,
			color: "#7dd3fc",
			bg: "rgba(14,165,233,0.15)",
		},
		{
			label: "Avg / Max HR",
			value: `${metadata.avg_hr} / ${metadata.max_hr} bpm`,
			icon: HeartPulse,
			color: "#fda4af",
			bg: "rgba(244,63,94,0.15)",
		},
		{
			label: "Cadence",
			value: `${metadata.cadence_spm} spm`,
			icon: Activity,
			color: "#c4b5fd",
			bg: "rgba(139,92,246,0.15)",
		},
		{
			label: "Calories",
			value: `${metadata.calories} kcal`,
			icon: Flame,
			color: "#fde68a",
			bg: "rgba(234,179,8,0.15)",
		},
		{
			label: "Elevation",
			value: `${metadata.elevation_gain_m} m`,
			icon: TrendingUp,
			color: "#5eead4",
			bg: "rgba(20,184,166,0.15)",
		},
	];

	return (
		<aside
			aria-label="Run metadata"
			style={{
				display: "grid",
				gridTemplateColumns: "1fr 1fr",
				gap: "0.5rem",
			}}
		>
			{cards.map((card) => {
				const Icon = card.icon;
				return (
					<div key={card.label} style={cardBase}>
						<div
							style={{
								width: 34,
								height: 34,
								borderRadius: 10,
								background: card.bg,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								flexShrink: 0,
							}}
						>
							<Icon size={16} color={card.color} />
						</div>
						<div style={{ minWidth: 0 }}>
							<p style={{ margin: 0, fontSize: "0.7rem", color: "#475569" }}>
								{card.label}
							</p>
							<p
								style={{
									margin: 0,
									fontSize: "0.82rem",
									fontWeight: 700,
									color: card.color,
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
								}}
							>
								{card.value}
							</p>
						</div>
					</div>
				);
			})}
		</aside>
	);
}

export type { Metadata };
