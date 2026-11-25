const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("momentum_access_token");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("momentum_refresh_token");
}

export function setTokens(access: string, refresh?: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("momentum_access_token", access);
  if (refresh) {
    localStorage.setItem("momentum_refresh_token", refresh);
  }
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("momentum_access_token");
  localStorage.removeItem("momentum_refresh_token");
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 && !endpoint.includes("/auth/login") && !endpoint.includes("/auth/refresh")) {
    // Attempt token refresh
    const refresh = getRefreshToken();
    if (refresh) {
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh }),
        });
        if (refreshRes.ok) {
          const tokenData = await refreshRes.json();
          setTokens(tokenData.access);
          headers["Authorization"] = `Bearer ${tokenData.access}`;
          const retryRes = await fetch(url, { ...options, headers });
          if (retryRes.ok) {
            return retryRes.json();
          }
        }
      } catch (e) {
        // Fallback to clear
      }
    }
    clearTokens();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/register")) {
      window.location.href = "/login";
    }
  }

  if (!response.ok) {
    let errorData: any = null;
    let message = `Request failed with status ${response.status}`;
    try {
      errorData = await response.json();
      if (typeof errorData === "object" && errorData !== null) {
        if (errorData.detail) message = errorData.detail;
        else if (errorData.message) message = errorData.message;
        else {
          const firstKey = Object.keys(errorData)[0];
          if (firstKey && Array.isArray(errorData[firstKey])) {
            message = `${firstKey}: ${errorData[firstKey][0]}`;
          }
        }
      }
    } catch {
      // Non-JSON response
    }
    throw new ApiError(response.status, message, errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
