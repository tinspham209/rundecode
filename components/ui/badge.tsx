import React from "react";
import { cn } from "../../lib/utils";

export function Badge({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
				"border border-orange-400/30 bg-orange-500/10 text-orange-200",
				className,
			)}
			{...props}
		/>
	);
}
