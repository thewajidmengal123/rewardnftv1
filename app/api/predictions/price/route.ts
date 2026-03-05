// app/api/predictions/price/route.ts
import { NextResponse } from 'next/server';

const COINGECKO_API_KEY = 'CG-nEtmMQLWcJLffamKWoGTyY7D';

export async function GET() {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,solana&vs_currencies=usd&include_24hr_change=true',
      {
        headers: { 'x-cg-demo-api-key': COINGECKO_API_KEY },
        next: { revalidate: 30 }
      }
    );
    
    const data = await res.json();
    
    return NextResponse.json({
      success: true,
      btc: {
        price: data.bitcoin.usd,
        change24h: data.bitcoin.usd_24h_change
      },
      sol: {
        price: data.solana.usd,
        change24h: data.solana.usd_24h_change
      }
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
