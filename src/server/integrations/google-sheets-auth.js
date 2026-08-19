const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const tokenCache = new Map();

function base64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function utf8Base64Url(value) {
  return base64Url(new TextEncoder().encode(value));
}

function pemToBytes(value) {
  const pem = String(value || "").replace(/\\n/g, "\n");
  const body = pem.replace(/-----BEGIN PRIVATE KEY-----/g, "").replace(/-----END PRIVATE KEY-----/g, "").replace(/\s+/g, "");
  const binary = atob(body);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function serviceAccount(env) {
  const email = String(env?.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL || "").trim();
  const privateKey = String(env?.GOOGLE_SHEETS_PRIVATE_KEY || "").trim();
  return email && privateKey ? { email, privateKey } : null;
}

export function googleSheetsConfiguration(env) {
  const account = serviceAccount(env);
  return {
    configured: Boolean(account),
    serviceAccountEmail: account?.email || "",
  };
}

async function createAssertion(account) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = utf8Base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = utf8Base64Url(JSON.stringify({
    iss: account.email,
    scope: SHEETS_SCOPE,
    aud: TOKEN_ENDPOINT,
    iat: issuedAt,
    exp: issuedAt + 3600,
  }));
  const unsigned = `${header}.${payload}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToBytes(account.privateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  return `${unsigned}.${base64Url(new Uint8Array(signature))}`;
}

export async function googleSheetsAccessToken(env) {
  const account = serviceAccount(env);
  if (!account) {
    const error = new Error("Google Sheets credentials are not configured.");
    error.code = "GOOGLE_SHEETS_NOT_CONFIGURED";
    throw error;
  }
  const cached = tokenCache.get(account.email);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  let response;
  try {
    response = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: await createAssertion(account),
      }),
    });
  } catch (cause) {
    const error = new Error("Google Sheets authentication is temporarily unavailable.");
    error.code = "GOOGLE_SHEETS_AUTH_FAILED";
    error.cause = cause;
    throw error;
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.access_token) {
    const error = new Error("Google Sheets authentication was rejected.");
    error.code = "GOOGLE_SHEETS_AUTH_FAILED";
    throw error;
  }
  const expiresIn = Math.max(60, Number(body.expires_in) || 3600);
  tokenCache.set(account.email, { token: body.access_token, expiresAt: Date.now() + expiresIn * 1000 });
  return body.access_token;
}
