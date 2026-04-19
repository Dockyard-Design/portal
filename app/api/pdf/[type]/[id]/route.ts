import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  void request;

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type, id } = await params;
  
  // Return a simple placeholder PDF response
  return new NextResponse("PDF placeholder for " + type + " " + id, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
