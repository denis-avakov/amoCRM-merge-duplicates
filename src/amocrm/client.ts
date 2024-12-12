import { Client } from "amocrm-js";

if (
  !process.env.AMOCRM_DOMAIN ||
  !process.env.AMOCRM_CLIENT_ID ||
  !process.env.AMOCRM_CLIENT_SECRET ||
  !process.env.AMOCRM_REDIRECT_URI ||
  !process.env.AMOCRM_LTS_TOKEN
) {
  throw new Error(
    "Missing required environment variables for AMOCRM configuration"
  );
}

export const amocrm = new Client({
  domain: process.env.AMOCRM_DOMAIN,
  auth: {
    client_id: process.env.AMOCRM_CLIENT_ID,
    client_secret: process.env.AMOCRM_CLIENT_SECRET,
    redirect_uri: process.env.AMOCRM_REDIRECT_URI,
    bearer: process.env.AMOCRM_LTS_TOKEN,
  },
});
