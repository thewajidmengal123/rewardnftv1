// app/api/predictions/btc-rounds/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentBTCRound, createBTCRound } from '@/lib/predictions';

const COINGECKO_API_KEY = 'CG-nEtmMQLWcJLffamKWoGTyY7D';

async function getBTCPrice(): Promise<number> {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
      {
        headers: { 'x-cg-demo-api-key': COINGECKO_API_KEY },
        next: { revalidate: 10 }
      }
    );
    
    if (!res.ok) throw new Error('Price fetch failed');
    const data = await res.json();
    return data.bitcoin.usd;
  } catch (error) {
    console.error('BTC price error:', error);
    return 85000; // Fallback
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check for active round
    let currentRound = await getCurrentBTCRound();
    
    // Create new if none exists
    if (!currentRound) {
      const btcPrice = await getBTCPrice();
      const roundNumber = Math.floor(Date.now() / (5 * 60 * 1000)); // Simple round number
      const id = await createBTCRound(btcPrice, roundNumber);
      
      currentRound = {
        id,
        title: `BTC Round #${roundNumber}`,
        description: `Will BTC go UP or DOWN? Starting: $${btcPrice.toLocaleString()}`,
        category: 'btc-5min',
        status: 'active',
        roundNumber,
        btcPriceStart: btcPrice,
        totalPool: 0,
        upPool: 0,
        downPool: 0,
        totalBets: 0,
        totalUsers: 0,
        startTime: new Date(),
        endTime: new Date(Date.now() + 5 * 60 * 1000),
        createdBy: 'system',
        platformFee: 2,
      };
    }
    
    return NextResponse.json({ 
      success: true, 
      currentRound,
      btcPrice: currentRound.btcPriceStart 
    });
    
  } catch (error: any) {
    console.error('BTC round error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
