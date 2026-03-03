# Vana Data App — File Templates

Complete reference templates for all customizable files in a Vana data app.

## src/config.ts

```typescript
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
```

## src/app/api/connect/route.ts (DO NOT MODIFY)

```typescript
import { NextResponse } from "next/server";
import { connect } from "@opendatalabs/connect/server";
import { ConnectError } from "@opendatalabs/connect/core";
import { config } from "@/config";

export async function POST() {
  try {
    const result = await connect(config);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[POST /api/connect] session creation failed:", err);
    const message =
      err instanceof ConnectError ? err.message : "Failed to create session";
    const status = err instanceof ConnectError ? (err.statusCode ?? 500) : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
```

## src/app/api/data/route.ts (DO NOT MODIFY)

```typescript
import { NextResponse } from "next/server";
import { getData } from "@opendatalabs/connect/server";
import { ConnectError, isValidGrant } from "@opendatalabs/connect/core";
import { config } from "@/config";

export async function POST(request: Request) {
  const { grant } = await request.json();

  if (!isValidGrant(grant)) {
    return NextResponse.json(
      { error: "Invalid grant payload" },
      { status: 400 },
    );
  }

  try {
    const data = await getData({
      privateKey: config.privateKey,
      grant,
      environment: config.environment,
    });

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[POST /api/data] data fetch failed:", err);
    const message =
      err instanceof ConnectError ? err.message : "Failed to fetch data";
    const status = err instanceof ConnectError ? (err.statusCode ?? 500) : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
```

## src/app/api/webhook/route.ts

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const payload = await request.json();

  // TODO: Verify the webhook signature and process the grant notification.
  console.log("[webhook] received:", JSON.stringify(payload));

  return NextResponse.json({ received: true });
}
```

## src/app/manifest.json/route.ts

```typescript
import { ConnectError } from "@opendatalabs/connect/core";
import { signVanaManifest } from "@opendatalabs/connect/server";
import { NextResponse } from "next/server";
import { config } from "@/config";

export async function GET() {
  try {
    const vanaBlock = await signVanaManifest({
      privateKey: config.privateKey,
      appUrl: config.appUrl,
      privacyPolicyUrl: `${config.appUrl}/privacy`,
      termsUrl: `${config.appUrl}/terms`,
      supportUrl: `${config.appUrl}/support`,
      webhookUrl: `${config.appUrl}/api/webhook`,
    });

    const manifest = {
      name: "Your App Name",          // CUSTOMIZE
      short_name: "YourApp",          // CUSTOMIZE
      start_url: "/",
      display: "standalone",
      background_color: "#09090b",
      theme_color: "#09090b",
      icons: [
        { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      ],
      vana: vanaBlock,
    };

    return NextResponse.json(manifest, {
      headers: { "Cache-Control": "public, max-age=86400" },
    });
  } catch (err) {
    const message =
      err instanceof ConnectError ? err.message : "Failed to sign manifest";
    const status = err instanceof ConnectError ? (err.statusCode ?? 500) : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
```

## src/components/ConnectFlow.tsx (skeleton for customization)

```typescript
"use client";

import type { ConnectionStatus } from "@opendatalabs/connect/core";
import { useVanaData } from "@opendatalabs/connect/react";
import { useEffect, useRef } from "react";

export default function ConnectFlow() {
  const {
    status,
    grant,
    data,
    error,
    connectUrl,
    initConnect,
    fetchData,
    isLoading,
  } = useVanaData();

  // Guard against StrictMode double-fire
  const initRef = useRef(false);
  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      void initConnect();
    }
  }, [initConnect]);

  const sessionReady = !!connectUrl;

  return (
    <div>
      {/* Phase 1: Connect */}
      {status !== "approved" && (
        <div>
          {sessionReady ? (
            <a href={connectUrl} target="_blank" rel="noopener noreferrer">
              Connect with Vana
            </a>
          ) : (
            <button onClick={() => void initConnect()} disabled={isLoading}>
              {isLoading ? "Creating session..." : "Create session"}
            </button>
          )}
        </div>
      )}

      {/* Phase 2: Approved — fetch and display data */}
      {status === "approved" && grant && (
        <div>
          <button onClick={fetchData} disabled={isLoading}>
            {isLoading ? "Fetching..." : "Fetch Data"}
          </button>

          {data != null && (
            <div>
              {/* CUSTOMIZE: Replace with your data visualization */}
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* Errors */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Reset */}
      {status !== "idle" && status !== "connecting" && (
        <button onClick={() => window.location.reload()}>Reset</button>
      )}
    </div>
  );
}
```

## src/app/page.tsx

```typescript
import ConnectFlow from "@/components/ConnectFlow";

export default function Home() {
  return (
    <main style={{ maxWidth: 540, margin: "0 auto", padding: "64px 24px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>
        Your App Name
      </h1>
      <p style={{ fontSize: 14, color: "#71717a", marginBottom: 40 }}>
        Your app description.
      </p>
      <ConnectFlow />
    </main>
  );
}
```

## src/app/layout.tsx

```typescript
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Your App Name",
  description: "Your app description",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

## .env.local

```
# App private key (get it from Vana Gateway: https://account.vana.org/admin)
VANA_PRIVATE_KEY=0x...
# Public URL of your app (no trailing slash)
APP_URL=http://localhost:3001
# Required: comma-separated scopes
# Scope list/schemas: https://github.com/vana-com/data-connectors/tree/main/schemas
VANA_SCOPES=chatgpt.conversations
```

## package.json

```json
{
  "name": "your-data-app",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "pnpm --filter @opendatalabs/connect build && next build"
  },
  "dependencies": {
    "@opendatalabs/connect": "^0.8.1",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "viem": "^2.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "typescript": "~5.7.0"
  }
}
```

## Actual API Response Shape

The `/api/data` endpoint returns data in this structure. Each scope value is an **envelope**
with schema metadata — the actual data is nested inside a `data` field:

```json
{
  "data": {
    "chatgpt.conversations": {
      "$schema": "https://raw.githubusercontent.com/.../chatgpt.conversations.json",
      "version": "1.0",
      "scope": "chatgpt.conversations",
      "collectedAt": "2026-03-01T20:26:46Z",
      "data": {
        "conversations": [
          {
            "id": "abc-123",
            "title": "My conversation",
            "create_time": "2025-12-31T07:59:14.849720Z",
            "update_time": "2025-12-31T08:15:00Z",
            "message_count": 12,
            "messages": [
              {
                "id": "msg-1",
                "role": "user",
                "content": "Hello",
                "content_type": "text",
                "create_time": "2025-12-31T07:59:14Z",
                "model": null
              }
            ]
          }
        ],
        "total": 150
      }
    }
  }
}
```

**Key points:**
- `useVanaData().data` contains the full response body including the outer `data` wrapper
- Scope values are envelopes, NOT bare arrays — drill into `.data.conversations`
- `create_time` is an **ISO 8601 string**, not a Unix timestamp
- To extract: `data.data["chatgpt.conversations"].data.conversations`

## Known Scopes

Common scope identifiers (check https://github.com/vana-com/data-connectors/tree/main/schemas for the full list):

- `chatgpt.conversations` — ChatGPT conversation history
- `instagram.posts` — Instagram posts and media
- `instagram.profile` — Instagram profile data
- `spotify.savedTracks` — Spotify saved tracks
- `gmail.messages` — Gmail messages
- `twitter.posts` — Twitter/X posts
- `linkedin.profile` — LinkedIn profile data

Scopes follow the pattern: `{source}.{data_type}` where the first segment is the platform name.
