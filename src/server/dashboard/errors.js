export class DashboardSourceError extends Error {
  constructor(source, code, message, options = {}) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.name = "DashboardSourceError";
    this.source = source;
    this.code = code;
    this.logCode = options.logCode || `dashboard.${source}.failed`;
  }
}

export function googleErrorFromResponse(source, response) {
  if (response.status === 401) {
    return new DashboardSourceError(source, "AUTH_ERROR", "Google authentication failed.", {
      logCode: `dashboard.${source}.auth_failed`,
    });
  }

  if (response.status === 403) {
    return new DashboardSourceError(source, "PERMISSION_DENIED", "Google denied access to this source.", {
      logCode: `dashboard.${source}.permission_denied`,
    });
  }

  if (response.status === 404) {
    return new DashboardSourceError(source, "SOURCE_NOT_FOUND", "The configured Google source was not found.", {
      logCode: `dashboard.${source}.source_not_found`,
    });
  }

  if (response.status === 429) {
    return new DashboardSourceError(source, "RATE_LIMITED", "Google temporarily limited dashboard requests.", {
      logCode: `dashboard.${source}.rate_limited`,
    });
  }

  return new DashboardSourceError(source, "UPSTREAM_ERROR", "Google could not load this source.", {
    logCode: `dashboard.${source}.upstream_error`,
  });
}

export function configurationError(source, message) {
  return new DashboardSourceError(source, "INVALID_CONFIGURATION", message, {
    logCode: `dashboard.${source}.invalid_configuration`,
  });
}

export function publicSourceStatus(error) {
  if (error instanceof DashboardSourceError) {
    return { ok: false, code: error.code, error: error.message };
  }

  return { ok: false, code: "UPSTREAM_ERROR", error: "This source is temporarily unavailable." };
}
