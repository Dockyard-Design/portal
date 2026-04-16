import { NextResponse } from 'next/server';
import { supabaseAdmin, validateApiKey } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized: Missing Authorization Header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const apiKeyData = await validateApiKey(token);
    
    if (!apiKeyData) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or Inactive API Key' }, { status: 403 });
    }

    // Professional response: Support pagination and filtering
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('projects')
      .select('*, author_id')
      .eq('is_public', true);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      pagination: {
        total: 0, // In a real scenario, we would run a count query
        limit,
        offset,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
