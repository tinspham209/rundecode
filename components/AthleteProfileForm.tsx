"use client";

import React from "react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { AthleteProfile } from "../lib/stravaTypes";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

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
	const { register, handleSubmit, reset, setValue, watch } = useForm<ProfileFormData>({
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
		<Card style={{ marginBottom: "1rem" }}>
			<CardHeader>
				<CardTitle>Athlete profile</CardTitle>
				<CardDescription>
					Điền thông tin runner để AI cá nhân hoá phân tích tốt hơn.
				</CardDescription>
			</CardHeader>
			<CardContent>
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
					style={{ display: "grid", gap: "0.8rem" }}
				>
					<div style={{ display: "grid", gap: "0.7rem", gridTemplateColumns: "1fr 1fr" }}>
						<Input label="Name" {...register("name", { required: true })} />
						<Input label="Location" {...register("location")} />
						<div>
							<label style={labelStyle}>Running level</label>
							<select {...register("runningLevel")} style={inputStyle}>
								<option value="beginner">Beginner</option>
								<option value="intermediate">Intermediate</option>
								<option value="advanced">Advanced</option>
								<option value="competitive">Competitive</option>
							</select>
						</div>
						<Input label="Age" type="number" {...register("age")} />
						<Input label="Weight (kg)" type="number" {...register("weightKg")} />
						<Input label="Height (cm)" type="number" {...register("heightCm")} />
						<Input label="Max HR" type="number" {...register("maxHr")} />
						<Input label="Resting HR" type="number" {...register("restingHr")} />
						<Input label="VO2Max" type="number" {...register("vo2max")} />
					</div>

					<div style={{ display: "grid", gap: "0.55rem" }}>
						<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.6rem" }}>
							<label style={labelStyle}>HR Zones (bpm range)</label>
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
						<div style={{ display: "grid", gap: "0.7rem", gridTemplateColumns: "1fr 1fr" }}>
							<Input label="Z1" placeholder="116-134" {...register("z1")} />
							<Input label="Z2" placeholder="135-150" {...register("z2")} />
							<Input label="Z3" placeholder="151-165" {...register("z3")} />
							<Input label="Z4" placeholder="166-174" {...register("z4")} />
							<Input label="Z5" placeholder="175-182" {...register("z5")} />
						</div>
					</div>

					<Button type="submit" disabled={saving}>
						{saving ? "Đang lưu..." : "Lưu profile"}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}

const Input = React.forwardRef<
	HTMLInputElement,
	React.InputHTMLAttributes<HTMLInputElement> & { label: string }
>(function Input({ label, ...props }, ref) {
	return (
		<div>
			<label style={labelStyle}>{label}</label>
			<input ref={ref} aria-label={label} {...props} style={inputStyle} />
		</div>
	);
});

function toNumber(value: string): number | undefined {
	const parsed = Number(value);
	return Number.isFinite(parsed) && value !== "" ? parsed : undefined;
}

const labelStyle: React.CSSProperties = {
	display: "block",
	marginBottom: "0.3rem",
	fontSize: "0.75rem",
	color: "#94a3b8",
};

const inputStyle: React.CSSProperties = {
	width: "100%",
	padding: "0.55rem 0.65rem",
	borderRadius: 10,
	border: "1px solid rgba(255,255,255,0.1)",
	background: "rgba(255,255,255,0.04)",
	color: "#e2e8f0",
};

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
