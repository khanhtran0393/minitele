import { NextResponse } from 'next/server';
import { sendBotMessage } from '@/lib/bot-service';

export async function POST(request: Request) {
  const body = await request.json();
  
  // Giả sử bạn truyền store_id qua URL Webhook (ví dụ: /api/webhook?id=store_01)
  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get('id');

  if (body.message && storeId) {
    const chatId = body.message.chat.id;
    const userText = body.message.text;

    // Phản hồi lại khách hàng bằng đúng Bot và Proxy của cửa hàng đó
    await sendBotMessage(storeId, chatId, `Cửa hàng ${storeId} đã nhận tin: ${userText}`);
  }

  return NextResponse.json({ status: 'ok' });
}