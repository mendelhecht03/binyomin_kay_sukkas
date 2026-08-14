import { getGoogleAccessToken } from "../src/server/dashboard/google-auth.js";
import { GoogleFormsProvider } from "../src/server/dashboard/google-forms-provider.js";

const sources = [
  { source: "builds", formId: process.env.GOOGLE_BUILDS_FORM_ID },
  { source: "rentals", formId: process.env.GOOGLE_RENTALS_FORM_ID },
];

const env = {
  GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
};

try {
  const accessToken = await getGoogleAccessToken(env);
  for (const { source, formId } of sources) {
    const provider = new GoogleFormsProvider({ source, formId, accessToken });
    const metadata = await provider.getFormMetadata();
    console.log(`\n${metadata.title} (${source})`);
    for (const question of metadata.questions.values()) {
      console.log(`${question.questionId}\t${question.title}`);
    }
  }
} catch (error) {
  console.error(`Dashboard field discovery failed: ${error?.message || "Unknown error"}`);
  process.exitCode = 1;
}
