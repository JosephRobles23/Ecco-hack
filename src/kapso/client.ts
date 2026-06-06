import { WhatsAppClient } from "@kapso/whatsapp-cloud-api";

const kapsoApiKey = process.env.KAPSO_API_KEY;
const phoneNumberId = process.env.KAPSO_PHONE_NUMBER_ID;

if (!kapsoApiKey) {
  throw new Error("Missing KAPSO_API_KEY");
}

if (!phoneNumberId) {
  throw new Error("Missing KAPSO_PHONE_NUMBER_ID");
}

export const whatsapp = new WhatsAppClient({
  baseUrl: "https://api.kapso.ai/meta/whatsapp",
  kapsoApiKey,
});

export const PHONE_NUMBER_ID = phoneNumberId;
