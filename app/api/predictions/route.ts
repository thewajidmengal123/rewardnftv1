// app/api/predictions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createPrediction, getActivePredictions, getAllPredictions } from '@/lib/predictions';

const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET || '';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    
    let predictions;
    if (status === 'all') {
      predictions = await getAllPredictions();
    } else {
      predictions = await getActivePredictions(category || undefined);
    }
    
    return NextResponse.json({ success: true, predictions });
    
  } catch (error: any) {
    console.error('GET predictions error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { adminWallet, ...predictionData } = body;
    
    // Verify admin
    if (adminWallet !== ADMIN_WALLET) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin only' },
        { status: 403 }
      );
    }
    
    const id = await createPrediction({
      ...predictionData,
      totalPool: 0,
      upPool: 0,
      downPool: 0,
      totalBets: 0,
      totalUsers: 0,
      createdBy: adminWallet,
    });
    
    return NextResponse.json({ success: true, id });
    
  } catch (error: any) {
    console.error('POST prediction error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
