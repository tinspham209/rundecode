import type {
	MonthlyContext,
	StravaActivity,
	WeeklyContext,
} from "./stravaTypes";

export function buildStravaMonthlyWeeklyContext(activities: StravaActivity[]): {
	monthly: MonthlyContext;
	weekly: WeeklyContext;
} {
	const runs = activities.filter(isSupportedMvpActivity);

	const now = new Date();
	const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
	const weekStart = getStartOfWeek(now);

	const thisMonth = runs.filter((activity) => {
		const date = new Date(activity.start_date_local ?? activity.start_date);
		return date >= monthStart;
	});

	const thisWeek = runs.filter((activity) => {
		const date = new Date(activity.start_date_local ?? activity.start_date);
		return date >= weekStart;
	});

	const monthlyDistance = totalDistanceKm(thisMonth);
	const monthlyTime = totalMovingTimeHours(thisMonth);
	const monthlyAvgPace = paceFromDistanceAndTime(
		monthlyDistance,
		monthlyTime * 3600,
	);

	const monthlyAvgHeartRate = average(
		thisMonth.map((a) => a.average_heartrate ?? 0).filter((v) => v > 0),
	);

	const monthly: MonthlyContext = {
		totalRuns: thisMonth.length,
		totalDistanceKm: round(monthlyDistance, 2),
		totalTimeHours: round(monthlyTime, 2),
		avgPacePerKm: monthlyAvgPace,
		avgHeartRate: Math.round(monthlyAvgHeartRate),
		longestRunKm: round(
			Math.max(0, ...thisMonth.map((a) => a.distance / 1000)),
			2,
		),
	};

	const weeklyDistance = totalDistanceKm(thisWeek);
	const weeklyTime = totalMovingTimeHours(thisWeek);

	const weekly: WeeklyContext = {
		runsThisWeek: thisWeek.length,
		totalDistanceKm: round(weeklyDistance, 2),
		totalTimeHours: round(weeklyTime, 2),
		avgPacePerKm: paceFromDistanceAndTime(weeklyDistance, weeklyTime * 3600),
	};

	return { monthly, weekly };
}

export function isSupportedMvpActivity(activity: StravaActivity): boolean {
	const candidates = [activity.sport_type, activity.type]
		.filter(
			(value): value is string =>
				typeof value === "string" && value.trim().length > 0,
		)
		.map(normalizeActivityType);

	return candidates.some((value) => SUPPORTED_MVP_ACTIVITY_TYPES.has(value));
}

const SUPPORTED_MVP_ACTIVITY_TYPES = new Set([
	"run",
	"walk",
	"hike",
	"hiking",
	"trail",
	"trailrun",
]);

function normalizeActivityType(value: string): string {
	return value.toLowerCase().replace(/[\s_-]+/g, "");
}

function getStartOfWeek(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1);
	d.setDate(diff);
	d.setHours(0, 0, 0, 0);
	return d;
}

function totalDistanceKm(activities: StravaActivity[]): number {
	return activities.reduce((sum, a) => sum + a.distance / 1000, 0);
}

function totalMovingTimeHours(activities: StravaActivity[]): number {
	return activities.reduce((sum, a) => sum + a.moving_time, 0) / 3600;
}

function paceFromDistanceAndTime(distanceKm: number, timeSec: number): string {
	if (distanceKm <= 0 || timeSec <= 0) {
		return "0'00\"/km";
	}

	const paceSec = timeSec / distanceKm;
	const min = Math.floor(paceSec / 60);
	const sec = Math.round(paceSec % 60)
		.toString()
		.padStart(2, "0");
	return `${min}'${sec}"/km`;
}

function average(values: number[]): number {
	if (values.length === 0) return 0;
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number, digits: number): number {
	const factor = 10 ** digits;
	return Math.round(value * factor) / factor;
}
