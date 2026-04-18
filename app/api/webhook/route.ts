import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { HttpsProxyAgent } from 'https-proxy-agent';
import fetch from 'node-fetch';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('id') || 'default_store';

    // 1. Lấy cấu hình Store từ Supabase (Token & Proxy của từng shop)
    const { data: store } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single();

    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

    const agent = new HttpsProxyAgent(store.proxy_url);
    const botToken = store.bot_token;

    // 2. XỬ LÝ THANH TOÁN: Bước xác nhận (Pre-checkout Query)
    if (body.pre_checkout_query) {
      await fetch(`https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pre_checkout_query_id: body.pre_checkout_query.id,
          ok: true,
        }),
        agent: agent, // Đi qua Proxy của shop đó
      });
      return NextResponse.json({ ok: true });
    }

    // 3. XỬ LÝ THANH TOÁN THÀNH CÔNG: Ghi vào Supabase
    if (body.message?.successful_payment) {
      const payment = body.message.successful_payment;
      
      await supabase.from('purchases').insert({
        user_id: body.message.from.id,
        item_id: payment.invoice_payload,
        amount: payment.total_amount,
        currency: payment.currency,
        store_id: storeId,
        created_at: new Date().toISOString()
      });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}