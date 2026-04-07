import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";

type ErrorAlertProps = {
	message: string;
	onRetry?: () => void;
};

export function ErrorAlert({ message, onRetry }: ErrorAlertProps) {
	return (
		<div
			role="alert"
			style={{
				borderRadius: 16,
				border: "1px solid rgba(239,68,68,0.3)",
				background: "rgba(127,29,29,0.25)",
				padding: "1rem 1.25rem",
				color: "#fca5a5",
			}}
		>
			<div
				style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}
			>
				<AlertTriangle size={16} style={{ marginTop: 2, flexShrink: 0 }} />
				<p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 500 }}>
					{message}
				</p>
			</div>
			{onRetry ? (
				<Button
					type="button"
					onClick={onRetry}
					variant="danger"
					size="sm"
					style={{ marginTop: "0.75rem" }}
				>
					Retry
				</Button>
			) : null}
		</div>
	);
}
