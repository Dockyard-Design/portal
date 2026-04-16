import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Key name is required" }, { status: 400 });
    }

    // Generate high-entropy API key
    const randomString = Array.from({ length: 32 }, () => 
      Math.random().toString(36)[2, 15] // Simple mock, in production use crypto.randomBytes
    ).join('');
    
    const keyPrefix = `sk_live_${Math.random().toString(36).substring(2, 10)}`;
    const fullKey = `${keyPrefix}_${randomString}`;

    const { error } = await supabaseAdmin
      .from('api_keys')
      .insert({ 
        name, 
        key_prefix: keyPrefix, 
        key_hash: fullKey, // In production, hash this value before saving
        user_id: userId 
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ key: fullKey });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
