import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSecretForItem } from '@/app/server/item-secrets';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, itemId } = body;

    if (!userId || !itemId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Kiểm tra giao dịch thực tế từ bảng 'purchases' trong Supabase
    const { data: purchase, error } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !purchase) {
      return NextResponse.json({ error: 'Thanh toán chưa được xác nhận' }, { status: 404 });
    }

    // Lấy Secret Code tương ứng với sản phẩm
    const secret = getSecretForItem(itemId);
    
    return NextResponse.json({ 
      success: true, 
      secret: secret,
      message: 'Xác thực thành công qua Supabase'
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}