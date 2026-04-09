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
		<main className="max-w-[1200px] mx-auto px-6 py-10">
			{/* Navigation / Logo Section */}
			<nav className="flex items-center justify-center mb-8">
				<div className="flex items-center gap-4">
					<div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/50">
						<Activity size={28} className="text-white" />
					</div>
					<div>
						<div className="font-extrabold text-[1.75rem] text-white tracking-tight leading-none">
							<span className="text-white">Run</span>
							<span className="text-orange-500">Decode</span>
						</div>
					</div>
				</div>
			</nav>

			{/* Hero section */}
			<div className="text-center mb-12">
				<h1 className="mb-4 font-extrabold text-[clamp(2rem,5vw,3rem)] text-white tracking-tight leading-[1.15]">
					AI Running Analysis for
					<br />
					Strava or FIT Workouts
				</h1>
				<p className="max-w-[640px] mx-auto text-base leading-relaxed text-slate-400">
					RunDecode helps runners analyze Strava activities or FIT uploads with
					AI insights, clear performance context, and fast copy/sync workflow.
					Start with Strava for quick activity analysis, or switch to manual FIT
					upload when needed.
				</p>
			</div>

			{/* Main Content Grid: 2-col desktop, 1-col mobile */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
				{/* Strava Integration Card */}
				<Card className="border-2 border-orange-500 rounded-2xl overflow-hidden">
					<CardHeader className="pt-6 pb-2">
						<div className="flex items-center gap-3 mb-3">
							<div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/40">
								<Activity size={18} className="text-white" />
							</div>
							<CardTitle className="text-lg m-0">
								Strava Activities Dashboard
							</CardTitle>
						</div>
						<CardDescription className="text-sm leading-relaxed text-slate-400">
							Connect your Strava account to automatically load recent
							activities and proceed to analysis.
						</CardDescription>
					</CardHeader>
					<CardContent className="pt-3">
						<Link href="/activities" className="no-underline block">
							<Button
								type="button"
								className="w-full py-3.5 px-5 text-base font-semibold bg-gradient-to-br from-orange-500 to-amber-500 border-none text-white rounded-xl cursor-pointer"
							>
								Open Activities Dashboard
							</Button>
						</Link>
					</CardContent>
				</Card>

				{/* Manual FIT Upload Card */}
				<Card className="border-2 border-orange-500 rounded-2xl overflow-hidden">
					<CardHeader className="pt-6 pb-2">
						<div className="flex items-center gap-3 mb-3">
							<div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center border border-orange-500/30">
								<Activity size={18} className="text-orange-500" />
							</div>
							<CardTitle className="text-lg m-0">Manual FIT flow</CardTitle>
						</div>
						<CardDescription className="text-sm leading-relaxed text-slate-400">
							Upload your .fit files manually for analysis if you don&apos;t use
							Strava or want to analyze offline workouts.
						</CardDescription>
					</CardHeader>
					<CardContent className="pt-3">
						<Link href="/manual" className="no-underline block">
							<Button
								type="button"
								className="w-full py-3.5 px-5 text-base font-semibold bg-gradient-to-br from-orange-500 to-amber-500 border-none text-white rounded-xl cursor-pointer"
							>
								Manual FIT flow
							</Button>
						</Link>
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
