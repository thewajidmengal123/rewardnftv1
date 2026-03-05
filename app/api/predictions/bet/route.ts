// app/api/predictions/bet/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { placeBet, getUserBets } from '@/lib/predictions';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get('wallet');
    
    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet required' },
        { status: 400 }
      );
    }
    
    const bets = await getUserBets(wallet);
    return NextResponse.json({ success: true, bets });
    
  } catch (error: any) {
    console.error('GET bets error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { predictionId, userWallet, side, amount, token, txSignature } = body;
    
    if (!predictionId || !userWallet || !side || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const id = await placeBet({
      predictionId,
      userWallet,
      side,
      amount: parseFloat(amount),
      token: token || 'USDC',
      status: 'pending',
      payoutAmount: 0,
      claimed: false,
      txSignature,
    });
    
    return NextResponse.json({ success: true, id });
    
  } catch (error: any) {
    console.error('POST bet error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
