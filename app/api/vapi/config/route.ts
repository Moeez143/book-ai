import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.VAPI_KEY;
  const assistantId = process.env.VAPI_ASSISTANT_ID;

  if (!apiKey || !assistantId) {
    return NextResponse.json(
      { error: "Voice assistant is not configured" },
      { status: 503 },
    );
  }

  return NextResponse.json(
    { apiKey, assistantId },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
