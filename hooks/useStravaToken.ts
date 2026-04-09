import { useCallback } from "react";
import toast from "react-hot-toast";
import { shouldRefreshToken } from "../lib/stravaAuth";
import { useAuthStore } from "../stores/authStore";

export function useStravaToken() {
	const athlete = useAuthStore((s) => s.athlete);
	const accessToken = useAuthStore((s) => s.accessToken);
	const refreshToken = useAuthStore((s) => s.refreshToken);
	const expiresAt = useAuthStore((s) => s.expiresAt);
	const setSession = useAuthStore((s) => s.setSession);

	const ensureToken = useCallback(async (retryCount = 0): Promise<string | null> => {
		if (!accessToken) return null;
		if (!shouldRefreshToken(expiresAt)) return accessToken;
		if (!refreshToken) return accessToken;

		try {
			const response = await fetch("/api/strava/refresh", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ refreshToken }),
			});

			const payload = await response.json();
			if (!response.ok) {
				// Nếu lỗi do network hoặc API trả về lỗi, thử lại nếu còn lượt
				if (retryCount < 1) {
					return ensureToken(retryCount + 1);
				}
				toast.error(payload.error ?? "Không thể làm mới Strava token.");
				return accessToken;
			}

			setSession({
				athlete,
				accessToken: payload.accessToken,
				refreshToken: payload.refreshToken,
				expiresAt: payload.expiresAt,
			});

			return payload.accessToken;
		} catch (error) {
			console.error("Strava token refresh error:", error);
			if (retryCount < 1) {
				return ensureToken(retryCount + 1);
			}
			toast.error("Lỗi kết nối khi làm mới Strava token.");
			return accessToken;
		}
	}, [accessToken, athlete, expiresAt, refreshToken, setSession]);

	return { ensureToken };
}
