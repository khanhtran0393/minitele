import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSecretForItem } from '@/app/server/item-secrets';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, itemId, transactionId } = body;

    if (!userId || !itemId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Nếu đã cấu hình Supabase thực thì kiểm tra trong db
    if (process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('your-project-id')) {
      const { data: purchase, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', userId)
        .eq('item_id', itemId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !purchase) {
        return NextResponse.json({ error: 'Thanh toán chưa được xác nhận trên DB' }, { status: 404 });
      }
    } else {
      // Mock db cho mục đích demo (lưu vào biến in-memory global)
      // @ts-ignore
      if (!global.purchases) global.purchases = [];
      // @ts-ignore
      global.purchases.push({
        id: Date.now().toString(),
        userId,
        itemId,
        transactionId: transactionId || `txn_${Date.now()}`,
        timestamp: Date.now(),
        status: 'completed'
      });
    }

    // Lấy Secret Code tương ứng với sản phẩm
    const secret = getSecretForItem(itemId);
    
    return NextResponse.json({ 
      success: true, 
      secret: secret,
      message: 'Xác thực thành công'
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}