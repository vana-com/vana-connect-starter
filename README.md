# Next.js Starter

Minimal Next.js app demonstrating the Vana Connect flow. Shows the server-side SDK (`connect()` + `getData()`) and client-side polling via `useVanaData()`.

## Prerequisites

- A builder address registered on-chain via the Vana Gateway
- A running Personal Server with `VANA_MASTER_KEY_SIGNATURE` set

## Setup

```bash
cp .env.local.example .env.local
# Edit .env.local with your private key and APP_URL
pnpm install
pnpm dev   # Opens on http://localhost:3001
```

## Environment Variables

| Variable           | Required | Description                             |
| ------------------ | -------- | --------------------------------------- |
| `VANA_PRIVATE_KEY` | Yes      | Builder private key registered on-chain |
| `APP_URL`          | Yes      | Public URL of your deployed app         |

> Scopes are configured in `src/config.ts`. Edit the `SCOPES` array to change which user data your app requests.

## Web App Manifest

The app serves a W3C Web App Manifest at `/manifest.json` containing a signed `vana` block. The Desktop App uses this to verify the builder's identity. The manifest is generated dynamically using `signVanaManifest()` from the SDK, which signs the vana block fields with EIP-191 using your `VANA_PRIVATE_KEY`.

## Webhook

`POST /api/webhook` is a stub endpoint for receiving grant notifications from the Desktop App. Extend it with signature verification and grant processing for production use.

## E2E Testing Workflow

1. **Terminal 1** — Start your Personal Server (`pnpm dev`)
2. **Terminal 2** — Start this app (`pnpm dev`)
3. **Browser Tab 1** — Open `http://localhost:3001`, click "Connect Your Data"
4. Click "Open in DataConnect" to launch the deep link in the DataConnect app
5. Alternatively, copy the deep link URL and paste it into the Personal Server Dev UI → Connect tab
6. Click "Auto-Approve All" (or step through manually)
7. Tab 1 updates from "Waiting..." to "Approved!" with grant details
