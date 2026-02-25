import { createVanaConfig } from "@opendatalabs/connect/server";

// Scopes define what user data your app requests.
const SCOPES = ["chatgpt.conversations"];

export const config = createVanaConfig({
  privateKey: (process.env.VANA_PRIVATE_KEY ??
    process.env.VANA_APP_PRIVATE_KEY) as `0x${string}`,
  scopes: SCOPES,
  appUrl: process.env.APP_URL ?? "",
});
