import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const { type, id } = await params;
  
  // Return a simple placeholder PDF response
  return new NextResponse("PDF placeholder for " + type + " " + id, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
