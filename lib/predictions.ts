// lib/predictions.ts
import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  updateDoc,
  increment,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';

// Types
export interface Prediction {
  id?: string;
  title: string;
  description: string;
  category: 'manual' | 'btc-5min';
  status: 'pending' | 'active' | 'closed' | 'settled' | 'cancelled';
  startTime: Timestamp | Date;
  endTime: Timestamp | Date;
  outcome?: 'up' | 'down' | 'yes' | 'no' | null;
  roundNumber?: number;
  btcPriceStart?: number;
  btcPriceEnd?: number;
  totalPool: number;
  upPool: number;
  downPool: number;
  totalBets: number;
  totalUsers: number;
  createdBy: string;
  platformFee: number;
  winningSide?: 'up' | 'down' | 'draw' | null;
  settledAt?: Timestamp | Date;
  settledBy?: string;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

export interface PredictionBet {
  id?: string;
  predictionId: string;
  userWallet: string;
  side: 'up' | 'down' | 'yes' | 'no';
  amount: number;
  token: 'USDC' | 'SOL';
  status: 'pending' | 'won' | 'lost' | 'refunded';
  payoutAmount: number;
  claimed: boolean;
  claimedAt?: Timestamp | Date;
  txSignature?: string;
  createdAt?: Timestamp | Date;
}

const PREDICTIONS_COLLECTION = 'predictions';
const BETS_COLLECTION = 'prediction_bets';

// Create Prediction (Admin)
export async function createPrediction(data: Omit<Prediction, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const id = doc(collection(db, PREDICTIONS_COLLECTION)).id;
  const ref = doc(db, PREDICTIONS_COLLECTION, id);
  
  await setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  return id;
}

// Get Active Predictions
export async function getActivePredictions(category?: string): Promise<Prediction[]> {
  const constraints: any[] = [
    where('status', '==', 'active'),
    where('endTime', '>', new Date()),
    orderBy('endTime', 'asc')
  ];
  
  if (category) {
    constraints.push(where('category', '==', category));
  }
  
  const q = query(collection(db, PREDICTIONS_COLLECTION), ...constraints);
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Prediction));
}

// Get All Predictions (Admin)
export async function getAllPredictions(): Promise<Prediction[]> {
  const q = query(
    collection(db, PREDICTIONS_COLLECTION),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Prediction));
}

// Get Current BTC Round
export async function getCurrentBTCRound(): Promise<Prediction | null> {
  const now = new Date();
  const q = query(
    collection(db, PREDICTIONS_COLLECTION),
    where('category', '==', 'btc-5min'),
    where('status', '==', 'active'),
    where('endTime', '>', now),
    orderBy('endTime', 'asc')
  );
  
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Prediction;
}

// Create BTC Round
export async function createBTCRound(btcPrice: number, roundNumber: number): Promise<string> {
  const now = new Date();
  const endTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes
  
  return createPrediction({
    title: `BTC Round #${roundNumber}`,
    description: `Will BTC go UP or DOWN in next 5 minutes? Starting: $${btcPrice.toLocaleString()}`,
    category: 'btc-5min',
    status: 'active',
    roundNumber,
    startTime: now,
    endTime,
    btcPriceStart: btcPrice,
    totalPool: 0,
    upPool: 0,
    downPool: 0,
    totalBets: 0,
    totalUsers: 0,
    createdBy: 'system',
    platformFee: 2,
  });
}

// Place Bet
export async function placeBet(data: Omit<PredictionBet, 'id' | 'createdAt'>): Promise<string> {
  const id = doc(collection(db, BETS_COLLECTION)).id;
  const betRef = doc(db, BETS_COLLECTION, id);
  const predRef = doc(db, PREDICTIONS_COLLECTION, data.predictionId);
  
  // Check if user already bet
  const existingBetQuery = query(
    collection(db, BETS_COLLECTION),
    where('predictionId', '==', data.predictionId),
    where('userWallet', '==', data.userWallet)
  );
  const existingBets = await getDocs(existingBetQuery);
  
  if (!existingBets.empty) {
    throw new Error('Already placed bet on this prediction');
  }
  
  // Create bet
  await setDoc(betRef, {
    ...data,
    createdAt: serverTimestamp(),
  });
  
  // Update prediction pools
  const updateData: any = {
    totalPool: increment(data.amount),
    totalBets: increment(1),
    totalUsers: increment(1),
  };
  
  if (data.side === 'up') {
    updateData.upPool = increment(data.amount);
  } else {
    updateData.downPool = increment(data.amount);
  }
  
  await updateDoc(predRef, updateData);
  
  return id;
}

// Get User Bets
export async function getUserBets(wallet: string): Promise<PredictionBet[]> {
  const q = query(
    collection(db, BETS_COLLECTION),
    where('userWallet', '==', wallet),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as PredictionBet));
}

// Settle Prediction
export async function settlePrediction(
  predictionId: string, 
  outcome: 'up' | 'down' | 'draw',
  settledBy: string,
  btcPriceEnd?: number
): Promise<void> {
  const predRef = doc(db, PREDICTIONS_COLLECTION, predictionId);
  
  const updateData: any = {
    status: 'settled',
    winningSide: outcome,
    settledAt: serverTimestamp(),
    settledBy,
  };
  
  if (btcPriceEnd) updateData.btcPriceEnd = btcPriceEnd;
  
  await updateDoc(predRef, updateData);
  
  if (outcome === 'draw') {
    // Refund all
    const betsQuery = query(collection(db, BETS_COLLECTION), where('predictionId', '==', predictionId));
    const betsSnapshot = await getDocs(betsQuery);
    
    const updates = betsSnapshot.docs.map(betDoc => 
      updateDoc(doc(db, BETS_COLLECTION, betDoc.id), {
        status: 'refunded',
        payoutAmount: betDoc.data().amount
      })
    );
    await Promise.all(updates);
    return;
  }
  
  // Get prediction data
  const predDoc = await getDoc(predRef);
  const predData = predDoc.data() as Prediction;
  
  const winningBetsQuery = query(
    collection(db, BETS_COLLECTION),
    where('predictionId', '==', predictionId),
    where('side', '==', outcome)
  );
  const winningBets = await getDocs(winningBetsQuery);
  
  const losingPool = outcome === 'up' ? predData.downPool : predData.upPool;
  const winningPool = outcome === 'up' ? predData.upPool : predData.downPool;
  const fee = (predData.totalPool * predData.platformFee) / 100;
  
  // Calculate payouts
  const updates = winningBets.docs.map(betDoc => {
    const bet = betDoc.data() as PredictionBet;
    const share = bet.amount / winningPool;
    const payout = bet.amount + (share * losingPool * (100 - predData.platformFee) / 100);
    
    return updateDoc(doc(db, BETS_COLLECTION, betDoc.id), {
      status: 'won',
      payoutAmount: payout
    });
  });
  
  await Promise.all(updates);
  
  // Mark losers
  const losingSide = outcome === 'up' ? 'down' : 'up';
  const losingBetsQuery = query(
    collection(db, BETS_COLLECTION),
    where('predictionId', '==', predictionId),
    where('side', '==', losingSide)
  );
  const losingBets = await getDocs(losingBetsQuery);
  
  const losingUpdates = losingBets.docs.map(betDoc =>
    updateDoc(doc(db, BETS_COLLECTION, betDoc.id), { status: 'lost' })
  );
  
  await Promise.all(losingUpdates);
}

// Get ended but not settled predictions (for auto-settle)
export async function getEndedPredictions(): Promise<Prediction[]> {
  const now = new Date();
  const q = query(
    collection(db, PREDICTIONS_COLLECTION),
    where('status', '==', 'active'),
    where('endTime', '<=', now)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Prediction));
}
