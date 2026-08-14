import { SignJWT, importPKCS8 } from "jose";
import { DashboardSourceError, configurationError } from "./errors.js";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/forms.body.readonly",
  "https://www.googleapis.com/auth/forms.responses.readonly",
  "https://www.googleapis.com/auth/spreadsheets.readonly",
];

let cachedToken = null;

function readCredentials(env) {
  const email = String(env?.GOOGLE_SERVICE_ACCOUNT_EMAIL || "").trim();
  const privateKey = String(env?.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "")
    .replace(/\\n/g, "\n")
    .trim();

  if (!email || !privateKey) {
    throw configurationError(
      "google",
      "Google service-account credentials are not configured for the dashboard.",
    );
  }

  return { email, privateKey };
}

export async function getGoogleAccessToken(env, fetchImpl = fetch, now = Date.now()) {
  const credentials = readCredentials(env);

  if (
    cachedToken &&
    cachedToken.email === credentials.email &&
    cachedToken.expiresAt > now + 60_000
  ) {
    return cachedToken.value;
  }

  try {
    const key = await importPKCS8(credentials.privateKey, "RS256");
    const issuedAt = Math.floor(now / 1000);
    const assertion = await new SignJWT({ scope: GOOGLE_SCOPES.join(" ") })
      .setProtectedHeader({ alg: "RS256", typ: "JWT" })
      .setIssuer(credentials.email)
      .setAudience(GOOGLE_TOKEN_URL)
      .setIssuedAt(issuedAt)
      .setExpirationTime(issuedAt + 3600)
      .sign(key);

    const body = new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    });
    const response = await fetchImpl(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!response.ok) {
      throw new DashboardSourceError("google", "AUTH_ERROR", "Google authentication failed.", {
        logCode: "dashboard.google.auth_failed",
      });
    }

    const result = await response.json();
    if (!result.access_token) {
      throw new DashboardSourceError("google", "AUTH_ERROR", "Google authentication failed.", {
        logCode: "dashboard.google.auth_failed",
      });
    }

    cachedToken = {
      email: credentials.email,
      value: result.access_token,
      expiresAt: now + Number(result.expires_in || 3600) * 1000,
    };
    return cachedToken.value;
  } catch (error) {
    if (error instanceof DashboardSourceError) throw error;
    throw new DashboardSourceError("google", "AUTH_ERROR", "Google authentication failed.", {
      cause: error,
      logCode: "dashboard.google.auth_failed",
    });
  }
}

export function clearGoogleTokenCacheForTests() {
  cachedToken = null;
}
