# Starter app built with portable data

Minimal Next.js app demonstrating the Vana Connect flow to port personal data into an application through a user's portable identity. Shows the server-side SDK (`connect()` + `getData()`) and client-side polling via `useVanaData()`.

## Prompting

Paste this prompt into an AI to have it make you an app
```
This Vana connect starter connects to users' personal data via the Vana Connect 
SDK. Help me customize it into [describe your app and data source — e.g. "a 
Rick Rubin style ChatGPT conversation analyzer that pulls out poetic learnings"].

  What to change:
  1. SCOPES in src/config.ts — pick the right data types for my use case
  2. App identity in src/app/manifest.json/route.ts — name, description,
     privacy/terms URLs
  3. The UI in src/components/ConnectFlow.tsx — redesign the data
     display to do something useful with the fetched JSON
  4. Homepage in src/app/page.tsx and styling in src/app/globals.css

  Do NOT modify the API routes (src/app/api/connect, /data) —
  those are thin wrappers around the SDK and work as-is.
  Run `pnpm dev` to test.
```


## Prerequisites

- A builder address registered via the Vana Gateway. Set it up [here](https://account.vana.org/admin).
- A running Personal Server with `VANA_MASTER_KEY_SIGNATURE` set. The easiest way to do this is through [DataConnect](https://account.vana.org/download-data-connect)

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
| `VANA_PRIVATE_KEY` | Yes      | Builder private key registered onchain (from prerequisites) |
| `APP_URL`          | Yes      | Public URL of your deployed app. Use `http://localhost:3001` for local dev         |

> Scopes are configured in `src/config.ts`. Edit the `SCOPES` array to change which user data your app requests.

## Web App Manifest

The app serves a W3C Web App Manifest at `/manifest.json` containing a signed `vana` block. The Desktop App uses this to verify the builder's identity. The manifest is generated dynamically using `signVanaManifest()` from the SDK, which signs the vana block fields with EIP-191 using your `VANA_PRIVATE_KEY`.

## Webhook

`POST /api/webhook` is a stub endpoint for receiving grant notifications from the Desktop App. Extend it with signature verification and grant processing for production use.

## App Icon

Connect resolves your app icon from `APP_URL` in this order: `/icon.svg`, `/icon.png`, `/favicon.ico`. Expose at least one of those routes publicly. In this starter, `src/app/icon.svg` serves `/icon.svg`.

## E2E Testing Workflow

1. **Terminal 1** — Start your Personal Server (`pnpm dev`)
2. **Terminal 2** — Start this app (`pnpm dev`)
3. **Browser Tab 1** — Open `http://localhost:3001`, click "Connect with Vana"
4. Click "Open in DataConnect" to launch the deep link, or if running a dev build of DataConnect, copy the deep link URL and paste it into the Personal Server Dev UI → Connect tab
7. Click "Auto-Approve All" (or step through manually)
8. Tab 1 updates from "Waiting..." to "Approved!" with grant details

## Personal Server

This app does not configure the Personal Server — it resolves the user's server URL at runtime via the Data Gateway. The Personal Server is a separate protocol participant (desktop-bundled, ODL Cloud, or self-hosted). See [Personal servers](https://docs.vana.org/protocol-reference/personal-servers) for details. 
