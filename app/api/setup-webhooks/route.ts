import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import fetch from 'node-fetch';

export async function GET(request: Request) {
  try {
    // 1. Lấy danh sách Bot từ Database
    const { data: stores, error } = await supabase.from('stores').select('id, bot_token');
    
    if (error || !stores) return NextResponse.json({ error: 'Không lấy được dữ liệu' });

    const results = [];
    // Tự động lấy Domain của bạn (Vercel hoặc Localhost)
    const host = request.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const domain = `${protocol}://${host}`;

    for (const store of stores) {
      const webhookUrl = `${domain}/api/webhook?id=${store.id}`;
      const telegramUrl = `https://api.telegram.org/bot${store.bot_token}/setWebhook?url=${webhookUrl}`;

      const res = await fetch(telegramUrl);
      const data = await res.json() as { ok: boolean, description?: string };

      results.push({
        store: store.id,
        success: data.ok,
        description: data.description || 'Thành công'
      });
    }

    return NextResponse.json({ message: "Kết quả thiết lập Webhook", details: results });
  } catch (_err) {
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}