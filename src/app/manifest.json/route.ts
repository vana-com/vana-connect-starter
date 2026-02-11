import { NextResponse } from "next/server";
import { signVanaManifest } from "@opendatalabs/connect/server";

export async function GET() {
  const privateKey = process.env.VANA_PRIVATE_KEY as `0x${string}`;

  if (!privateKey) {
    return NextResponse.json(
      { error: "Missing env var: VANA_PRIVATE_KEY" },
      { status: 500 },
    );
  }

  const appUrl = process.env.APP_URL ?? "http://localhost:3001";

  const vanaBlock = await signVanaManifest({
    privateKey,
    appUrl,
    privacyPolicyUrl: `${appUrl}/privacy`,
    termsUrl: `${appUrl}/terms`,
    supportUrl: `${appUrl}/support`,
    webhookUrl: `${appUrl}/api/webhook`,
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
        src: "/icon.png",
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
}
