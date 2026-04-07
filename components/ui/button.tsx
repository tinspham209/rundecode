import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const sizeStyles = {
	default: { height: 40, padding: "0 1.25rem", fontSize: "0.875rem" },
	sm: {
		height: 32,
		padding: "0 0.75rem",
		fontSize: "0.78rem",
		borderRadius: 10,
	},
	lg: { height: 48, padding: "0 1.75rem", fontSize: "0.95rem" },
} as const;

const variantStyles = {
	default: {
		background: "linear-gradient(135deg,#f97316,#f59e0b)",
		color: "#fff",
		border: "none",
		boxShadow:
			"0 4px 18px rgba(249,115,22,0.35), 0 1px 0 rgba(255,255,255,0.15) inset",
	},
	secondary: {
		background: "rgba(255,255,255,0.05)",
		color: "#cbd5e1",
		border: "1px solid rgba(255,255,255,0.1)",
		boxShadow: "none",
	},
	ghost: {
		background: "transparent",
		color: "#94a3b8",
		border: "none",
		boxShadow: "none",
	},
	danger: {
		background: "linear-gradient(135deg,#dc2626,#e11d48)",
		color: "#fff",
		border: "none",
		boxShadow: "0 4px 18px rgba(220,38,38,0.35)",
	},
} as const;

const buttonVariants = cva("", {
	variants: {
		variant: { default: "", secondary: "", ghost: "", danger: "" },
		size: { default: "", sm: "", lg: "" },
	},
	defaultVariants: { variant: "default", size: "default" },
});

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			className,
			variant = "default",
			size = "default",
			asChild = false,
			style,
			...props
		},
		ref,
	) => {
		const Comp = asChild ? Slot : "button";
		const vs = variantStyles[variant ?? "default"];
		const ss = sizeStyles[size ?? "default"];
		return (
			<Comp
				ref={ref}
				className={cn(className)}
				style={{
					display: "inline-flex",
					alignItems: "center",
					justifyContent: "center",
					gap: "0.5rem",
					borderRadius: 12,
					fontWeight: 600,
					cursor: props.disabled ? "not-allowed" : "pointer",
					opacity: props.disabled ? 0.45 : 1,
					backgroundColor: props.disabled
						? "rgba(255,255,255,0.03)"
						: vs.background,
					transition: "all 0.15s ease",
					whiteSpace: "nowrap",
					...vs,
					...ss,
					...style,
				}}
				{...props}
			/>
		);
	},
);
Button.displayName = "Button";
