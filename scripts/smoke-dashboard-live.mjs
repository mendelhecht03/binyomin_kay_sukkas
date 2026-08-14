import { getDashboardSubmissions } from "../src/server/dashboard/service.js";

const envKeys = [
  "GOOGLE_SERVICE_ACCOUNT_EMAIL",
  "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",
  "GOOGLE_BUILDS_FORM_ID",
  "GOOGLE_RENTALS_FORM_ID",
  "GOOGLE_BUILDS_FIELD_MAP",
  "GOOGLE_RENTALS_FIELD_MAP",
  "GOOGLE_TESTIMONIALS_SPREADSHEET_ID",
  "GOOGLE_TESTIMONIALS_SHEET_NAME",
];
const env = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));

const result = await getDashboardSubmissions({ env, limit: 9 });
if (!result.ok) {
  console.error(`Dashboard smoke test failed: ${result.code || "UNKNOWN_ERROR"}`);
  process.exitCode = 1;
} else {
  const failedSources = Object.entries(result.sources)
    .filter(([, status]) => status.ok === false)
    .map(([source, status]) => `${source}:${status.code}`);
  console.log(JSON.stringify({
    loaded: result.submissions.length,
    sources: result.sources,
    types: Object.fromEntries(["build", "rental", "testimonial"].map((type) => [
      type,
      result.submissions.filter((entry) => entry.type === type).length,
    ])),
  }, null, 2));
  if (failedSources.length) {
    console.error(`Dashboard smoke test source failures: ${failedSources.join(", ")}`);
    process.exitCode = 1;
  }
}
