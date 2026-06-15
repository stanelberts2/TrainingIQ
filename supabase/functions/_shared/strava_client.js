import { getEnv } from "./supabase_clients.js";

const STRAVA_API = "https://www.strava.com/api/v3";

async function postToken(params) {
  const response = await fetch(`${STRAVA_API}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || body.error || "Strava token request failed.");
  }

  return body;
}

export async function exchangeCodeForToken(code) {
  return postToken({
    client_id: getEnv("STRAVA_CLIENT_ID"),
    client_secret: getEnv("STRAVA_CLIENT_SECRET"),
    code,
    grant_type: "authorization_code",
  });
}

export async function refreshToken(refreshTokenValue) {
  return postToken({
    client_id: getEnv("STRAVA_CLIENT_ID"),
    client_secret: getEnv("STRAVA_CLIENT_SECRET"),
    refresh_token: refreshTokenValue,
    grant_type: "refresh_token",
  });
}

export async function getValidStravaToken(supabase, dataSource) {
  const expiresAt = dataSource.token_expires_at ? new Date(dataSource.token_expires_at).getTime() : 0;
  const shouldRefresh = !expiresAt || expiresAt - Date.now() < 60 * 60 * 1000;
  if (!shouldRefresh && dataSource.access_token_encrypted) {
    return dataSource.access_token_encrypted;
  }

  const refreshed = await refreshToken(dataSource.refresh_token_encrypted);
  const { error } = await supabase
    .from("data_sources")
    .update({
      access_token_encrypted: refreshed.access_token,
      refresh_token_encrypted: refreshed.refresh_token,
      token_expires_at: new Date(refreshed.expires_at * 1000).toISOString(),
      provider_scope: refreshed.scope || dataSource.provider_scope || "",
      sync_status: "connected",
      last_error: "",
    })
    .eq("id", dataSource.id);

  if (error) throw error;
  return refreshed.access_token;
}

export async function fetchStravaActivity(accessToken, activityId) {
  const response = await fetch(`${STRAVA_API}/activities/${activityId}?include_all_efforts=true`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || "Strava activity request failed.");
  }

  return body;
}

export async function fetchStravaActivityLaps(accessToken, activityId) {
  const response = await fetch(`${STRAVA_API}/activities/${activityId}/laps`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 404) return [];
  const body = await response.json().catch(() => []);
  if (!response.ok) {
    throw new Error(body.message || "Strava laps request failed.");
  }

  return Array.isArray(body) ? body : [];
}
