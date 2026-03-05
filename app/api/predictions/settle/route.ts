// app/api/predictions/settle/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { settlePrediction, getEndedPredictions } from '@/lib/predictions';

const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET || '';
const COINGECKO_API_KEY = 'CG-nEtmMQLWcJLffamKWoGTyY7D';

async function getBTCPrice(): Promise<number> {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
      {
        headers: { 'x-cg-demo-api-key': COINGECKO_API_KEY },
        next: { revalidate: 5 }
      }
    );
    const data = await res.json();
    return data.bitcoin.usd;
  } catch (error) {
    return 0;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { predictionId, outcome, adminWallet, auto } = body;
    
    // Auto settle mode (for cron job)
    if (auto) {
      const endedPredictions = await getEndedPredictions();
      const results = [];
      
      for (const pred of endedPredictions) {
        if (pred.category === 'btc-5min') {
          const currentPrice = await getBTCPrice();
          const startPrice = pred.btcPriceStart || currentPrice;
          
          let result: 'up' | 'down' | 'draw';
          if (currentPrice > startPrice) result = 'up';
          else if (currentPrice < startPrice) result = 'down';
          else result = 'draw';
          
          await settlePrediction(pred.id!, result, 'system', currentPrice);
          results.push({ id: pred.id, result, price: currentPrice });
        }
      }
      
      return NextResponse.json({ 
        success: true, 
        settled: results.length,
        results 
      });
    }
    
    // Manual settle
    if (adminWallet !== ADMIN_WALLET) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    await settlePrediction(predictionId, outcome, adminWallet);
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error('Settle error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
