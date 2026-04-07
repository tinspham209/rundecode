import React, { useEffect, useMemo, useState } from "react";
import { Brain, Clock3, Cloud, Sparkles, Zap } from "lucide-react";

export function LoadingSpinner({
	message = "AI đang phân tích dữ liệu chạy...",
}: {
	message?: string;
}) {
	const [elapsedSeconds, setElapsedSeconds] = useState(0);

	useEffect(() => {
		setElapsedSeconds(0);
		const timer = window.setInterval(() => {
			setElapsedSeconds((current) => current + 1);
		}, 1000);

		return () => {
			window.clearInterval(timer);
		};
	}, []);

	const stage = useMemo(() => {
		if (elapsedSeconds < 12) {
			return {
				icon: Cloud,
				title: "Đang upload và xác thực file .fit",
				description: "Kiểm tra định dạng, dung lượng và chữ ký FIT.",
			};
		}

		if (elapsedSeconds < 35) {
			return {
				icon: Brain,
				title: "Đang trích xuất chỉ số session/lap",
				description: "Tổng hợp pace, nhịp tim, cadence và các lap quan trọng.",
			};
		}

		if (elapsedSeconds < 80) {
			return {
				icon: Sparkles,
				title: "AI đang tạo phân tích chi tiết",
				description:
					"Mô hình miễn phí thường phản hồi chậm hơn trong giờ cao điểm.",
			};
		}

		return {
			icon: Clock3,
			title: "Sắp hoàn tất — cảm ơn bạn đã chờ",
			description: "Đang nhận phản hồi cuối cùng từ OpenRouter.",
		};
	}, [elapsedSeconds]);

	const tip = useMemo(() => {
		const tips = [
			"Mẹo: bạn có thể để tab này chạy nền, kết quả sẽ hiển thị ngay khi xong.",
			"Mẹo: file có nhiều record/lap sẽ cần thêm thời gian để tổng hợp.",
			"Mẹo: khung giờ cao điểm có thể làm model free phản hồi chậm hơn bình thường.",
		];

		return tips[Math.floor(elapsedSeconds / 9) % tips.length];
	}, [elapsedSeconds]);

	const elapsedLabel = useMemo(() => {
		const minutes = Math.floor(elapsedSeconds / 60);
		const seconds = elapsedSeconds % 60;
		return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
	}, [elapsedSeconds]);

	const progress = useMemo(() => {
		if (elapsedSeconds <= 15) {
			return 16 + elapsedSeconds * 2.2;
		}

		if (elapsedSeconds <= 50) {
			return 49 + (elapsedSeconds - 15) * 0.8;
		}

		if (elapsedSeconds <= 120) {
			return 77 + (elapsedSeconds - 50) * 0.2;
		}

		return 91;
	}, [elapsedSeconds]);

	const StageIcon = stage.icon;

	return (
		<div
			role="status"
			aria-live="polite"
			style={{
				position: "relative",
				borderRadius: 16,
				border: "1px solid rgba(249,115,22,0.25)",
				background:
					"linear-gradient(145deg,rgba(10,20,46,0.92),rgba(4,10,26,0.96))",
				boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
				padding: "1rem 1.1rem",
				display: "grid",
				gap: "0.8rem",
				marginBottom: "1rem",
			}}
		>
			<div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
				<div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
					{[0, 150, 300].map((delay) => (
						<span
							key={delay}
							className="animate-bounce-dot"
							style={{
								display: "block",
								width: 8,
								height: 8,
								borderRadius: "50%",
								background: "#f97316",
								animationDelay: `${delay}ms`,
							}}
						/>
					))}
				</div>

				<div
					style={{
						marginLeft: "auto",
						fontSize: "0.73rem",
						fontVariantNumeric: "tabular-nums",
						padding: "0.22rem 0.55rem",
						borderRadius: 999,
						border: "1px solid rgba(255,255,255,0.1)",
						background: "rgba(255,255,255,0.03)",
						color: "#94a3b8",
					}}
				>
					{elapsedLabel}
				</div>
			</div>

			<div style={{ display: "grid", gap: "0.3rem" }}>
				<p
					style={{
						margin: 0,
						fontWeight: 600,
						fontSize: "0.875rem",
						color: "#fed7aa",
					}}
				>
					{message}
				</p>
				<p
					style={{
						margin: 0,
						fontSize: "0.75rem",
						color: "#94a3b8",
						display: "inline-flex",
						alignItems: "center",
						gap: "0.35rem",
					}}
				>
					<StageIcon size={13} />
					{stage.title}
				</p>
				<p style={{ margin: 0, fontSize: "0.72rem", color: "#64748b" }}>
					{stage.description}
				</p>
			</div>

			<div style={{ display: "grid", gap: "0.35rem" }}>
				<div
					style={{
						height: 8,
						borderRadius: 999,
						background: "rgba(255,255,255,0.08)",
						overflow: "hidden",
					}}
				>
					<div
						style={{
							height: "100%",
							width: `${Math.max(10, Math.min(91, progress))}%`,
							borderRadius: 999,
							background:
								"linear-gradient(90deg, rgba(251,146,60,0.85), rgba(245,158,11,0.95), rgba(125,211,252,0.9))",
							backgroundSize: "220% 100%",
							animation: "shimmer 2.8s linear infinite",
							transition: "width 0.8s ease",
						}}
					/>
				</div>
				<p style={{ margin: 0, fontSize: "0.69rem", color: "#64748b" }}>
					{tip}
				</p>
			</div>
		</div>
	);
}
