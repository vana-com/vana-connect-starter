// Serves a signed web app manifest.
// The DataConnect Desktop App reads this to verify your app's identity.

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
      name: "Vana Connect — Next.js Starter",
      short_name: "Vana Starter",
      start_url: "/",
      display: "standalone",
      background_color: "#09090b",
      theme_color: "#09090b",
      icons: [
        {
          src: "/icon",
          sizes: "192x192",
          type: "image/png",
        },
      ],
      vana: vanaBlock,
    };

    return NextResponse.json(manifest, {
      headers: {
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    const message =
      err instanceof ConnectError ? err.message : "Failed to sign manifest";
    const status = err instanceof ConnectError ? (err.statusCode ?? 500) : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
