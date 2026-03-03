# Starter app built with portable data

Minimal Next.js app demonstrating the Vana Connect flow to port personal data into an application through a user's portable identity. Shows the server-side SDK (`connect()` + `getData()`) and client-side polling via `useVanaData()`.

## Prompting

Paste this prompt into an AI to have it make you an app:

```
Before writing code, fill these in:
- Target app outcome: <exact user-facing feature>
- Target scopes: <exact `VANA_SCOPES` values, comma-separated>

This Vana Connect starter is a scaffold, not zero-config. It requires:
- `VANA_PRIVATE_KEY`
- `APP_URL`
- `VANA_SCOPES`
- a reachable Personal Server (DataConnect is the easiest local path)

Build this exactly:
"Build a <specific user-facing app> powered by <specific Vana portable data scopes>."

Allowed changes:
1) `.env.local`
   - Set `VANA_SCOPES` to only what the target app needs.
2) `src/app/manifest.json/route.ts`
   - Update `name`, `description`, `privacyUrl`, `termsUrl`.
3) `src/components/ConnectFlow.tsx`
   - Keep connect/grant behavior unchanged.
   - Replace generic JSON display with useful app-specific output.
4) `src/app/page.tsx` and `src/app/globals.css`
   - Update homepage copy/layout/styles for the target app.

Do NOT modify:
- `src/app/api/connect/**`
- `src/app/api/data/**`
- signing/auth flow around the SDK wrappers

Definition of done:
- Connect flow still works (`idle -> waiting -> approved/error`).
- Output is meaningful for the defined app outcome and uses the defined scopes.
- `pnpm dev` starts successfully once required env/infra are provided.

Return:
- files changed
- rationale per file
- assumptions made
```


## Quick start

Set these in `.env.local` before running:

1. `VANA_PRIVATE_KEY` (your app private key). Get it from Vana Gateway: [https://account.vana.org/admin](https://account.vana.org/admin)
2. `APP_URL` (use `http://localhost:3001` for local dev; no trailing slash)
3. `VANA_SCOPES` (comma-separated scope keys, for example `chatgpt.conversations`)
4. A reachable Personal Server (easiest path: [DataConnect](https://account.vana.org/download-data-connect))

```bash
cp .env.local.example .env.local
# .env.local
# VANA_PRIVATE_KEY=0x... (64 hex chars after 0x)
# APP_URL=http://localhost:3001
# VANA_SCOPES=chatgpt.conversations,another.scope
pnpm install
pnpm dev   # Opens on http://localhost:3001
```

> Scopes are read from `VANA_SCOPES` only (comma-separated), e.g. `VANA_SCOPES=chatgpt.conversations,another.scope`.

## Scopes

`VANA_SCOPES` is the list of data permissions your app asks for.

Use scope keys from the connector schema list: [https://github.com/vana-com/data-connectors/tree/main/schemas](https://github.com/vana-com/data-connectors/tree/main/schemas)

- Scope key format is the schema filename without `.json` (for example `spotify.savedTracks.json` -> `spotify.savedTracks`).
- Each value must be a valid scope key (for example `chatgpt.conversations`, `instagram.posts`, `spotify.savedTracks`).
- Multiple scopes are comma-separated.
- Your app only receives data for scopes the user approves in DataConnect.

Set one or more in `.env.local`:

```bash
VANA_SCOPES=chatgpt.conversations
# or
VANA_SCOPES=chatgpt.conversations,instagram.posts
```

## Web App Manifest

The app serves a W3C Web App Manifest at `/manifest.json` containing a signed `vana` block. The Desktop App uses this to verify your app identity. The manifest is generated dynamically using `signVanaManifest()` from the SDK, which signs the vana block fields with EIP-191 using your `VANA_PRIVATE_KEY`.

## Webhook

`POST /api/webhook` is a stub endpoint for receiving grant notifications from the Desktop App. Extend it with signature verification and grant processing for production use.

## App Icon

Connect resolves your app icon from `APP_URL` in this order: `/icon.svg`, `/icon.png`, `/favicon.ico`. Expose at least one of those routes publicly. In this starter, `src/app/icon.svg` serves `/icon.svg`.

## E2E Testing Workflow

1. Download and open [DataConnect](https://account.vana.org/download-data-connect) (DataConnect manages your Personal Server, and the Personal Server stores your data and serves approved data requests to your app).
2. In Terminal: start this app (`pnpm dev`).
3. In a Browser Tab: open this app at `http://localhost:3001`, then click "Connect with Vana".
4. Click "Open in DataConnect" to launch the deep link.
5. In DataConnect, click "Auto-Approve All" (or approve step-by-step).
6. Back in your Browser Tab, status updates from "Waiting…" to "Approved!" with grant details.

## Personal Server

This app does not configure the Personal Server — it resolves the user's server URL at runtime via the Data Gateway. For most local setups, DataConnect runs the Personal Server for you. The Personal Server can also be desktop-bundled, ODL Cloud, or self-hosted. See [Personal servers](https://docs.vana.org/protocol-reference/personal-servers) for details.
