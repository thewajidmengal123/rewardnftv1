import { NextRequest, NextResponse } from 'next/server';
import { 
  createBTCRound, 
  getCurrentBTCRound, 
  settlePrediction,
  getActivePredictions 
} from '@/lib/predictions';

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY || 'CG-nEtmMQLWcJLffamKWoGTyY7D';

// Verify cron secret
const CRON_SECRET = process.env.CRON_SECRET || 'your-cron-secret';

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
    // Fallback API
    try {
      const fallback = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
      const data = await fallback.json();
      return parseFloat(data.price);
    } catch {
      return 85000;
    }
  }
}

// Auto-settle expired rounds
async function autoSettleExpiredRounds() {
  console.log('🔍 Checking for expired rounds...');
  
  const activePredictions = await getActivePredictions('btc-5min');
  const now = new Date();
  
  for (const pred of activePredictions) {
    const endTime = pred.endTime?.toDate ? pred.endTime.toDate() : new Date(pred.endTime);
    
    if (now > endTime && pred.status === 'active') {
      console.log(`⏰ Round ${pred.id} expired, settling...`);
      
      try {
        // Get current BTC price
        const currentPrice = await getBTCPrice();
        const startPrice = pred.btcPriceStart || 0;
        
        // Determine winner
        let outcome: 'up' | 'down' | 'draw';
        if (currentPrice > startPrice) outcome = 'up';
        else if (currentPrice < startPrice) outcome = 'down';
        else outcome = 'draw';
        
        console.log(`📊 Price: $${startPrice} → $${currentPrice}, Result: ${outcome}`);
        
        // Settle with auto-distribution
        await settlePrediction(pred.id!, outcome, 'system-auto', currentPrice);
        
        console.log(`✅ Round ${pred.id} settled as ${outcome}`);
      } catch (error) {
        console.error(`❌ Failed to settle round ${pred.id}:`, error);
      }
    }
  }
}

// Auto-create new round if needed
async function autoCreateNewRound() {
  console.log('🔍 Checking for new round creation...');
  
  const currentRound = await getCurrentBTCRound();
  
  if (!currentRound) {
    console.log('🆕 Creating new BTC round...');
    const btcPrice = await getBTCPrice();
    const roundNumber = Math.floor(Date.now() / (5 * 60 * 1000));
    
    const id = await createBTCRound(btcPrice, roundNumber);
    console.log(`✅ Created BTC Round #${roundNumber} at $${btcPrice}`);
    return id;
  }
  
  return currentRound.id;
}

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Run auto-settlement
    await autoSettleExpiredRounds();
    
    // Run auto-creation
    const newRoundId = await autoCreateNewRound();
    
    return NextResponse.json({
      success: true,
      message: 'BTC rounds processed',
      newRoundId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Cron error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Also support POST for manual trigger
export async function POST(req: NextRequest) {
  return GET(req);
}
