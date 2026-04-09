export type StravaAthlete = {
	id: number;
	firstname?: string;
	lastname?: string;
	city?: string;
	state?: string;
	country?: string;
};

export type StravaMap = {
	summary_polyline?: string | null;
};

export type StravaActivity = {
	id: number;
	name: string;
	description?: string | null;
	start_date: string;
	start_date_local?: string;
	distance: number;
	moving_time: number;
	elapsed_time: number;
	total_elevation_gain: number;
	average_speed?: number;
	max_speed?: number;
	average_watts?: number;
	max_watts?: number;
	average_heartrate?: number;
	max_heartrate?: number;
	average_cadence?: number;
	calories?: number;
	kilojoules?: number;
	elev_high?: number;
	elev_low?: number;
	gear_id?: string;
	device_name?: string;
	map?: StravaMap;
	type?: string;
	sport_type?: string;
};

export type StravaAthleteStats = {
	recent_run_totals?: {
		count: number;
		distance: number;
		moving_time: number;
		elevation_gain: number;
	};
	ytd_run_totals?: {
		count: number;
		distance: number;
		moving_time: number;
		elevation_gain: number;
	};
	all_run_totals?: {
		count: number;
		distance: number;
		moving_time: number;
		elevation_gain: number;
	};
};

export type MonthlyContext = {
	totalRuns: number;
	totalDistanceKm: number;
	totalTimeHours: number;
	avgPacePerKm: string;
	avgHeartRate: number;
	longestRunKm: number;
};

export type WeeklyContext = {
	runsThisWeek: number;
	totalDistanceKm: number;
	totalTimeHours: number;
	avgPacePerKm: string;
};

export type StravaStreamsByType = {
	time: number[];
	distance: number[];
	heartrate: number[];
	cadence: number[];
	altitude: number[];
	velocity_smooth: number[];
};

export type StravaExtractedActivity = {
	session: {
		totalDistanceKm: number;
		movingTimeSec: number;
		elapsedTimeSec: number;
		avgHeartRate: number;
		maxHeartRate: number;
		avgCadenceSpm: number;
		avgPacePerKm: string;
		totalCalories: number;
		totalAscent: number;
		startTime: string;
		activityName: string;
	};
	laps: Array<{
		lapNumber: number;
		distanceKm: number;
		timeSec: number;
		avgHeartRate: number;
		avgPacePerKm: string;
		avgCadenceSpm: number;
	}>;
	derived: {
		hrDrift: number;
		paceVariability: number;
		cadenceVariability: number;
		pauseCount: number;
		pauseDurationSec: number;
	};
};

export type AthleteProfile = {
	name: string;
	location: string;
	runningLevel: "beginner" | "intermediate" | "advanced" | "competitive";
	age?: number;
	weightKg?: number;
	heightCm?: number;
	maxHr?: number;
	restingHr?: number;
	vo2max?: number;
	hrZones?: {
		z1?: string;
		z2?: string;
		z3?: string;
		z4?: string;
		z5?: string;
	};
};
