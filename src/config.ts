import { createVanaConfig } from "@opendatalabs/connect/server";

const scopes = (process.env.VANA_SCOPES ?? "")
  .split(",")
  .map((scope) => scope.trim())
  .filter(Boolean);
const appUrl = (process.env.APP_URL ?? "").trim().replace(/\/+$/, "");
const privateKey = (process.env.VANA_PRIVATE_KEY ?? "").trim();

if (scopes.length === 0) {
  throw new Error(
    "Missing VANA_SCOPES. Set VANA_SCOPES in .env.local (comma-separated), e.g. VANA_SCOPES=chatgpt.conversations",
  );
}

if (!appUrl) {
  throw new Error(
    "Missing APP_URL. Set APP_URL in .env.local, e.g. APP_URL=http://localhost:3001",
  );
}

if (!privateKey) {
  throw new Error(
    "Missing VANA_PRIVATE_KEY. Set VANA_PRIVATE_KEY in .env.local.",
  );
}

if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
  throw new Error(
    "Invalid VANA_PRIVATE_KEY. Expected 0x followed by 64 hex characters.",
  );
}

export const config = createVanaConfig({
  privateKey: privateKey as `0x${string}`,
  scopes,
  appUrl,
});
