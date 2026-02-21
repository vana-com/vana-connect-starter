// Creates a session to connect data from DataConnect into your app.
// Returns a connect URL for the user to approve the connection.

import { NextResponse } from "next/server";
import { connect } from "@opendatalabs/connect/server";
import { ConnectError } from "@opendatalabs/connect/core";
import { config } from "@/config";

export async function POST() {
  try {
    const result = await connect(config);
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof ConnectError ? err.message : "Failed to create session";
    const status = err instanceof ConnectError ? (err.statusCode ?? 500) : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
