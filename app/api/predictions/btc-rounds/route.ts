import { NextRequest, NextResponse } from 'next/server';
import { getCurrentBTCRound, createBTCRound } from '@/lib/predictions';

const COINGECKO_API_KEY = 'CG-nEtmMQLWcJLffamKWoGTyY7D';

// Fetch BTC price with your API key
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
    return 85000; // Fallback price
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check for active BTC round
    let currentRound = await getCurrentBTCRound();
    
    // Create new round if none exists
    if (!currentRound) {
      console.log('🔄 Creating new BTC round...');
      const btcPrice = await getBTCPrice();
      const roundNumber = Math.floor(Date.now() / (5 * 60 * 1000)); // Simple round number
      
      const id = await createBTCRound(btcPrice, roundNumber);
      
      // Return newly created round
      currentRound = {
        id,
        title: `BTC Round #${roundNumber}`,
        description: `Will BTC go UP or DOWN in next 5 minutes? Starting: $${btcPrice.toLocaleString()}`,
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
        endTime: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
        createdBy: 'system',
        platformFee: 2,
      };
      
      console.log('✅ New BTC round created:', currentRound);
    } else {
      console.log('✅ Existing BTC round found:', currentRound);
    }

    return NextResponse.json({ 
      success: true, 
      currentRound,
      btcPrice: currentRound.btcPriceStart 
    });
    
  } catch (error: any) {
    console.error('❌ BTC round error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
