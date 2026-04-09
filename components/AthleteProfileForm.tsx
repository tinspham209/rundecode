"use client";

import React from "react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { AthleteProfile } from "../lib/stravaTypes";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";

type AthleteProfileFormProps = {
	defaultValue?: Partial<AthleteProfile>;
	onSubmit: (value: AthleteProfile) => void;
	saving?: boolean;
};

type ProfileFormData = {
	name: string;
	location: string;
	runningLevel: AthleteProfile["runningLevel"];
	age: string;
	weightKg: string;
	heightCm: string;
	maxHr: string;
	restingHr: string;
	vo2max: string;
	z1: string;
	z2: string;
	z3: string;
	z4: string;
	z5: string;
};

export function AthleteProfileForm({
	defaultValue,
	onSubmit,
	saving,
}: AthleteProfileFormProps) {
	const {
		register,
		handleSubmit,
		reset,
		setValue,
		watch,
		formState: { errors },
	} = useForm<ProfileFormData>({
		defaultValues: {
			name: defaultValue?.name ?? "",
			location: defaultValue?.location ?? "",
			runningLevel: defaultValue?.runningLevel ?? "intermediate",
			age: defaultValue?.age ? String(defaultValue.age) : "",
			weightKg: defaultValue?.weightKg ? String(defaultValue.weightKg) : "",
			heightCm: defaultValue?.heightCm ? String(defaultValue.heightCm) : "",
			maxHr: defaultValue?.maxHr ? String(defaultValue.maxHr) : "",
			restingHr: defaultValue?.restingHr ? String(defaultValue.restingHr) : "",
			vo2max: defaultValue?.vo2max ? String(defaultValue.vo2max) : "",
			z1: defaultValue?.hrZones?.z1 ?? "",
			z2: defaultValue?.hrZones?.z2 ?? "",
			z3: defaultValue?.hrZones?.z3 ?? "",
			z4: defaultValue?.hrZones?.z4 ?? "",
			z5: defaultValue?.hrZones?.z5 ?? "",
		},
	});

	useEffect(() => {
		reset({
			name: defaultValue?.name ?? "",
			location: defaultValue?.location ?? "",
			runningLevel: defaultValue?.runningLevel ?? "intermediate",
			age: defaultValue?.age ? String(defaultValue.age) : "",
			weightKg: defaultValue?.weightKg ? String(defaultValue.weightKg) : "",
			heightCm: defaultValue?.heightCm ? String(defaultValue.heightCm) : "",
			maxHr: defaultValue?.maxHr ? String(defaultValue.maxHr) : "",
			restingHr: defaultValue?.restingHr ? String(defaultValue.restingHr) : "",
			vo2max: defaultValue?.vo2max ? String(defaultValue.vo2max) : "",
			z1: defaultValue?.hrZones?.z1 ?? "",
			z2: defaultValue?.hrZones?.z2 ?? "",
			z3: defaultValue?.hrZones?.z3 ?? "",
			z4: defaultValue?.hrZones?.z4 ?? "",
			z5: defaultValue?.hrZones?.z5 ?? "",
		});
	}, [defaultValue, reset]);

	const maxHrWatch = watch("maxHr");

	return (
		<Card className="mb-4 border-2 border-orange-500 rounded-2xl">
			<CardHeader className="pt-6 pb-3">
				<CardTitle className="text-xl mb-2 text-orange-500">
					Athlete Profile: Basic Information
				</CardTitle>
				<CardDescription className="text-sm leading-relaxed">
					Fill in your runner information for better AI-personalized analysis.
				</CardDescription>
			</CardHeader>
			<CardContent className="pt-4">
				<form
					onSubmit={handleSubmit((values) => {
						onSubmit({
							name: values.name.trim(),
							location: values.location.trim(),
							runningLevel: values.runningLevel,
							age: toNumber(values.age),
							weightKg: toNumber(values.weightKg),
							heightCm: toNumber(values.heightCm),
							maxHr: toNumber(values.maxHr),
							restingHr: toNumber(values.restingHr),
							vo2max: toNumber(values.vo2max),
							hrZones: {
								z1: values.z1.trim() || undefined,
								z2: values.z2.trim() || undefined,
								z3: values.z3.trim() || undefined,
								z4: values.z4.trim() || undefined,
								z5: values.z5.trim() || undefined,
							},
						});
					})}
					className="grid gap-4"
				>
					<div className="grid gap-3 grid-cols-1 md:grid-cols-2">
						<Input
							label="Name *"
							id="profile-name"
							error={errors.name?.message}
							{...register("name", {
								required: "Name is required",
								validate: (value) =>
									value.trim().length > 0 || "Name is required",
							})}
						/>
						<Input
							label="Location"
							id="profile-location"
							{...register("location")}
						/>
						<div>
							<label
								htmlFor="profile-level"
								className="block mb-1 text-xs text-slate-400"
							>
								Running level
							</label>
							<select
								id="profile-level"
								{...register("runningLevel")}
								className="w-full px-3 py-2.5 rounded-xl border-2 border-orange-500 bg-orange-500/5 text-slate-200 text-sm font-medium transition-all"
							>
								<option value="beginner">Beginner</option>
								<option value="intermediate">Intermediate</option>
								<option value="advanced">Advanced</option>
								<option value="competitive">Competitive</option>
							</select>
						</div>
						<Input
							label="Age"
							id="profile-age"
							type="number"
							{...register("age")}
						/>
						<Input
							label="Weight (kg)"
							id="profile-weight"
							type="number"
							{...register("weightKg")}
						/>
						<Input
							label="Height (cm)"
							id="profile-height"
							type="number"
							{...register("heightCm")}
						/>
						<Input
							label="Max HR"
							id="profile-max-hr"
							type="number"
							{...register("maxHr")}
						/>
						<Input
							label="Resting HR"
							id="profile-resting-hr"
							type="number"
							{...register("restingHr")}
						/>
						<Input
							label="VO2Max"
							id="profile-vo2max"
							type="number"
							{...register("vo2max")}
						/>
					</div>

					<div className="grid gap-2">
						<div className="flex items-center justify-between gap-2">
							<label className="block mb-1 text-xs text-slate-400">
								HR Zones (bpm range)
							</label>
							<Button
								type="button"
								size="sm"
								variant="secondary"
								onClick={() => {
									const maxHr = Number(maxHrWatch);
									if (!Number.isFinite(maxHr) || maxHr <= 0) {
										return;
									}

									const zones = calcZones(maxHr);
									setValue("z1", zones.z1);
									setValue("z2", zones.z2);
									setValue("z3", zones.z3);
									setValue("z4", zones.z4);
									setValue("z5", zones.z5);
								}}
							>
								Auto-calculate from Max HR
							</Button>
						</div>
						<div className="grid gap-3 grid-cols-2 md:grid-cols-5">
							<Input
								label="Z1"
								id="profile-z1"
								placeholder="116-134"
								{...register("z1")}
							/>
							<Input
								label="Z2"
								id="profile-z2"
								placeholder="135-150"
								{...register("z2")}
							/>
							<Input
								label="Z3"
								id="profile-z3"
								placeholder="151-165"
								{...register("z3")}
							/>
							<Input
								label="Z4"
								id="profile-z4"
								placeholder="166-174"
								{...register("z4")}
							/>
							<Input
								label="Z5"
								id="profile-z5"
								placeholder="175-182"
								{...register("z5")}
							/>
						</div>
					</div>

					<Button
						type="submit"
						disabled={saving}
						className="w-full py-3 text-base font-semibold bg-gradient-to-r from-orange-500 to-amber-500 border-none text-white rounded-xl cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
					>
						{saving ? "Saving..." : "Save Profile"}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}

const Input = React.forwardRef<
	HTMLInputElement,
	React.InputHTMLAttributes<HTMLInputElement> & {
		label: string;
		error?: string;
		id: string;
	}
>(function Input({ label, error, id, ...props }, ref) {
	return (
		<div>
			<label htmlFor={id} className="block mb-1 text-xs text-slate-400">
				{label}
			</label>
			<input
				ref={ref}
				id={id}
				aria-label={label}
				{...props}
				className="w-full px-3 py-2.5 rounded-xl border-2 border-orange-500 bg-orange-500/5 text-slate-200 text-sm font-medium transition-all"
			/>
			{error ? <p className="mt-1.5 text-xs text-rose-300">{error}</p> : null}
		</div>
	);
});

function toNumber(value: string): number | undefined {
	const parsed = Number(value);
	return Number.isFinite(parsed) && value !== "" ? parsed : undefined;
}

function calcZones(maxHr: number) {
	const range = (minP: number, maxP: number) => {
		const min = Math.round(maxHr * minP);
		const max = Math.round(maxHr * maxP);
		return `${min}-${max}`;
	};

	return {
		z1: range(0.64, 0.74),
		z2: range(0.74, 0.82),
		z3: range(0.83, 0.91),
		z4: range(0.91, 0.96),
		z5: range(0.96, 1),
	};
}
