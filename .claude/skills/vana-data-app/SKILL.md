---
name: vana-data-app
description: >
  Create and customize Vana data apps that access users' portable personal data via
  the Vana Connect SDK. Use when asked to "create a data app", "new vana app",
  "build an app with user data", "customize the starter", "add a scope",
  "change data source", or when working with @opendatalabs/connect or the
  vana-connect-starter repo.
---

# Vana Data App Builder

Build Next.js applications that access users' portable personal data (ChatGPT conversations,
Instagram posts, Spotify saved tracks, etc.) via the Vana Connect protocol. Apps use the
`@opendatalabs/connect` SDK for session creation, grant polling, and data retrieval.

## Core Architecture

The data flow has three steps, all handled by the SDK:

1. **Create session** (server) — `connect(config)` returns a `connectUrl` deep link + `sessionId`
2. **Poll for approval** (client) — `useVanaData()` hook polls until the user approves in DataConnect
3. **Fetch data** (server) — `getData({ privateKey, grant, environment })` retrieves user data

The grant flow: Builder backend creates session via Session Relay, user approves in DataConnect
desktop app, DataConnect registers an on-chain grant (EIP-712 signed), builder fetches data from
the user's Personal Server using the grant.

## File Roles — What to Change vs. Leave Alone

### CUSTOMIZE these files:

| File | What to change |
|------|---------------|
| `.env.local` | Set `VANA_SCOPES` (comma-separated scope keys) |
| `src/app/manifest.json/route.ts` | App name, short_name, privacy/terms/support URLs |
| `src/components/ConnectFlow.tsx` | UI — redesign data display, add visualizations, features |
| `src/app/page.tsx` | Homepage — title, description, branding, layout |
| `src/app/globals.css` | Styling — colors, typography, components |
| `src/app/layout.tsx` | Metadata — page title, description |
| `src/app/icon.svg` | App icon (DataConnect resolves `/icon.svg` → `/icon.png` → `/favicon.ico`) |

### DO NOT modify these files:

| File | Why |
|------|-----|
| `src/app/api/connect/route.ts` | Thin SDK wrapper — works as-is |
| `src/app/api/data/route.ts` | Thin SDK wrapper — works as-is |
| `src/app/api/webhook/route.ts` | Stub — extend for production but don't break the interface |

## Workflow

### Step 1 — Define the app concept

Ask the user (if not clear):
1. What does the app do with the data? (analyze, visualize, export, transform)
2. Which data sources? (chatgpt, instagram, spotify, linkedin, etc.)
3. What scopes are needed? (e.g. `chatgpt.conversations`, `instagram.posts`)

Available scope schemas: https://github.com/vana-com/data-connectors/tree/main/schemas
Scope key rule: use the schema filename without `.json` (for example `spotify.savedTracks.json` -> `spotify.savedTracks`).

### Step 2 — Scaffold or clone the starter

If starting fresh:
```bash
git clone https://github.com/vana-com/vana-connect-starter.git my-data-app
cd my-data-app
pnpm install
cp .env.local.example .env.local
```

Required environment variables:
- `VANA_PRIVATE_KEY` — App private key (get it from https://account.vana.org/admin)
- `APP_URL` — `http://localhost:3001` for dev, HTTPS domain for production (no trailing slash)
- `VANA_SCOPES` — Comma-separated scope keys, e.g. `chatgpt.conversations,instagram.posts`

### Step 3 — Configure scopes

Set scopes in `.env.local`:

```bash
VANA_SCOPES=chatgpt.conversations
# or
VANA_SCOPES=chatgpt.conversations,instagram.posts
```

`src/config.ts` reads `VANA_SCOPES` and validates required env vars (`VANA_PRIVATE_KEY`, `APP_URL`, `VANA_SCOPES`) at startup:

```typescript
import { createVanaConfig } from "@opendatalabs/connect/server";

const scopes = (process.env.VANA_SCOPES ?? "")
  .split(",")
  .map((scope) => scope.trim())
  .filter(Boolean);
const appUrl = (process.env.APP_URL ?? "").trim().replace(/\/+$/, "");
const privateKey = (process.env.VANA_PRIVATE_KEY ?? "").trim();

if (scopes.length === 0) {
  throw new Error("Missing VANA_SCOPES");
}

if (!appUrl) {
  throw new Error("Missing APP_URL");
}

if (!privateKey || !/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
  throw new Error("Invalid VANA_PRIVATE_KEY");
}

export const config = createVanaConfig({
  privateKey: privateKey as `0x${string}`,
  scopes,
  appUrl,
});
```

### Step 4 — Update app identity

Edit `src/app/manifest.json/route.ts` — change the manifest object:

```typescript
const manifest = {
  name: "Your App Name",
  short_name: "YourApp",
  start_url: "/",
  display: "standalone",
  background_color: "#09090b",
  theme_color: "#09090b",
  icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  vana: vanaBlock,
};
```

Update the URLs passed to `signVanaManifest()`:
- `privacyPolicyUrl`
- `termsUrl`
- `supportUrl`
- `webhookUrl`

### Step 5 — Build the UI

The `ConnectFlow` component uses `useVanaData()` from `@opendatalabs/connect/react`:

```typescript
const {
  status,      // "idle" | "connecting" | "waiting" | "approved" | "denied" | "expired" | "error"
  grant,       // { grantId, userAddress, builderAddress, scopes, serverAddress? }
  data,        // Fetched user data (Record<string, unknown>)
  error,       // Error message string
  connectUrl,  // Deep link URL to DataConnect
  initConnect, // Start session
  fetchData,   // Retrieve data using grant
  isLoading,   // Loading state boolean
} = useVanaData();
```

Status flow: `idle` → `connecting` → `waiting` → `approved` → (fetch data)

The component must:
1. Call `initConnect()` once on mount (use `useRef` guard in StrictMode)
2. Show "Connect with Vana" link to `connectUrl` when status is `waiting`
3. Call `fetchData()` after approval to get user data
4. Display the data in your app-specific way

**IMPORTANT — Actual response shape from `useVanaData().data`:**

The `/api/data` route returns `{ data: ... }` and the hook exposes the full response body.
Each scope value is NOT a bare array — it's an envelope with schema metadata and a nested `data` object:

```
{
  "data": {                                    // from /api/data response
    "chatgpt.conversations": {                 // scope key
      "$schema": "https://...schema.json",
      "version": "1.0",
      "scope": "chatgpt.conversations",
      "collectedAt": "2026-03-01T20:26:46Z",
      "data": {                                // actual payload
        "conversations": [...]
      }
    }
  }
}
```

To extract conversations: `data.data["chatgpt.conversations"].data.conversations`

Timestamps like `create_time` may be **ISO 8601 strings** (e.g. `"2025-12-31T07:59:14.849720Z"`)
rather than Unix timestamps. Always handle both formats when parsing dates.

### Step 6 — Test locally

```bash
pnpm dev  # Opens on http://localhost:3001
```

E2E flow:
1. Open http://localhost:3001
2. Click "Connect with Vana"
3. Approve in DataConnect desktop app
4. Click "Fetch Data"

## SDK Reference

### Server imports (`@opendatalabs/connect/server`)

```typescript
import { createVanaConfig, connect, getData, signVanaManifest } from "@opendatalabs/connect/server";
```

- `createVanaConfig({ privateKey, scopes, appUrl })` — Creates config object
- `connect(config)` — Creates session, returns `{ sessionId, connectUrl, expiresAt }`
- `getData({ privateKey, grant, environment })` — Fetches data from Personal Server
- `signVanaManifest({ privateKey, appUrl, ... })` — Signs manifest for identity verification

### Client imports (`@opendatalabs/connect/react`)

```typescript
import { useVanaData } from "@opendatalabs/connect/react";
```

### Core imports (`@opendatalabs/connect/core`)

```typescript
import { ConnectError, isValidGrant } from "@opendatalabs/connect/core";
import type { ConnectionStatus } from "@opendatalabs/connect/core";
```

## Tech Stack

- **Framework**: Next.js 15 (App Router, React 19)
- **Package manager**: pnpm (required, not npm)
- **TypeScript**: ~5.7, strict mode, ES2022 target
- **SDK**: `@opendatalabs/connect` ^0.8.1
- **Crypto**: `viem` ^2.0.0 (Ethereum utilities)
- **Path alias**: `@/*` → `./src/*`
- **Dev server port**: 3001

## Common Gotchas

1. **`.env.local` overrides `.env`** — Next.js loads `.env.local` with higher priority. If
   `.env.local` has placeholder values like `VANA_PRIVATE_KEY=0x...`, they override real values
   in `.env`. Use only one env file, or ensure `.env.local` has the real key.

2. **API errors are swallowed** — The catch blocks in API routes return generic messages.
   Always include `console.error` logging to see the actual error in the terminal.

3. **Data is deeply nested** — The response from `getData()` wraps each scope in an envelope
   with `$schema`, `version`, `collectedAt`, and a nested `data` object containing the actual
   payload. Don't assume `scope_key → array` — it's `scope_key → envelope → data → array`.

4. **Timestamps are ISO strings** — Connector schemas return `create_time` as ISO 8601 strings
   (e.g. `"2025-12-31T07:59:14Z"`), not Unix timestamps. Parse with `new Date(value)`, not
   `parseFloat(value)`.

## What NOT to Do

- Do NOT modify the API route handlers — they are thin SDK wrappers that work correctly as-is
- Do NOT use npm — this project requires pnpm
- Do NOT expose `VANA_PRIVATE_KEY` to the client — all signing happens server-side
- Do NOT hardcode environment URLs — the SDK resolves environments automatically
- Do NOT skip the manifest — DataConnect uses it to verify your app's identity
- Do NOT add authentication to the connect/data API routes — the SDK handles auth via EIP-191/712
- Do NOT call `initConnect()` without a `useRef` guard — React StrictMode will double-fire it
