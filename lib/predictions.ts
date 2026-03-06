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
  Timestamp, 
  addDoc 
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
  image?: string; // NEW: Image URL
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

// ✅ FIXED: Create Prediction (Admin)
export async function createPrediction(
  data: Omit<Prediction, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    // Use addDoc for auto-generated ID
    const docRef = await addDoc(collection(db, PREDICTIONS_COLLECTION), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Prediction created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating prediction:', error);
    throw error;
  }
}

// Get Active Predictions
export async function getActivePredictions(category?: string): Promise<Prediction[]> {
  try {
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
  } catch (error) {
    console.error('Error fetching active predictions:', error);
    return [];
  }
}

// Get All Predictions (Admin)
export async function getAllPredictions(): Promise<Prediction[]> {
  try {
    const q = query(
      collection(db, PREDICTIONS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Prediction));
  } catch (error) {
    console.error('Error fetching all predictions:', error);
    return [];
  }
}

// Get Current BTC Round
export async function getCurrentBTCRound(): Promise<Prediction | null> {
  try {
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
  } catch (error) {
    console.error('Error fetching BTC round:', error);
    return null;
  }
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
    image: '/images/btc-prediction.png', // Default BTC image
  });
}

// Place Bet
export async function placeBet(data: Omit<PredictionBet, 'id' | 'createdAt'>): Promise<string> {
  try {
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
    const docRef = await addDoc(collection(db, BETS_COLLECTION), {
      ...data,
      createdAt: serverTimestamp(),
    });

    // Update prediction pools
    const predRef = doc(db, PREDICTIONS_COLLECTION, data.predictionId);
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

    return docRef.id;
  } catch (error) {
    console.error('Error placing bet:', error);
    throw error;
  }
}

// Get User Bets
export async function getUserBets(wallet: string): Promise<PredictionBet[]> {
  try {
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
  } catch (error) {
    console.error('Error fetching user bets:', error);
    return [];
  }
}

// Settle Prediction with Prize Distribution
export async function settlePrediction(
  predictionId: string,
  outcome: 'up' | 'down' | 'draw',
  settledBy: string,
  btcPriceEnd?: number
): Promise<void> {
  const predRef = doc(db, PREDICTIONS_COLLECTION, predictionId);
  
  // Get prediction data first
  const predDoc = await getDoc(predRef);
  const predData = predDoc.data() as Prediction;
  
  const updateData: any = {
    status: 'settled',
    winningSide: outcome,
    settledAt: serverTimestamp(),
    settledBy,
  };
  
  if (btcPriceEnd) updateData.btcPriceEnd = btcPriceEnd;
  
  await updateDoc(predRef, updateData);

  // If draw, refund all
  if (outcome === 'draw') {
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

  // Calculate prize distribution
  const totalPool = predData.totalPool || 0;
  const platformFee = (totalPool * (predData.platformFee || 2)) / 100; // 2% fee
  const distributablePool = totalPool - platformFee;
  
  const winningPool = outcome === 'up' ? (predData.upPool || 0) : (predData.downPool || 0);
  const losingPool = outcome === 'up' ? (predData.downPool || 0) : (predData.upPool || 0);

  console.log(`💰 Prize Distribution:
    Total Pool: $${totalPool}
    Platform Fee (2%): $${platformFee}
    Distributable: $${distributablePool}
    Winning Side: ${outcome}
    Winning Pool: $${winningPool}
    Losing Pool: $${losingPool}
  `);

  // Get winning bets
  const winningBetsQuery = query(
    collection(db, BETS_COLLECTION),
    where('predictionId', '==', predictionId),
    where('side', '==', outcome)
  );
  const winningBets = await getDocs(winningBetsQuery);

  // Distribute to winners proportionally
  const updates: Promise<void>[] = [];
  
  for (const betDoc of winningBets.docs) {
    const bet = betDoc.data() as PredictionBet;
    
    // Proportional share: (user_bet / total_winning_bets) * distributable_pool
    const userShare = bet.amount / winningPool;
    const payout = bet.amount + (userShare * losingPool * 0.98); // 98% of losing pool (after 2% fee)
    
    console.log(`🏆 Winner: ${bet.userWallet.slice(0, 8)}...
      Bet: $${bet.amount}
      Share: ${(userShare * 100).toFixed(2)}%
      Payout: $${payout.toFixed(2)}
      Profit: $${(payout - bet.amount).toFixed(2)}
    `);

    updates.push(
      updateDoc(doc(db, BETS_COLLECTION, betDoc.id), {
        status: 'won',
        payoutAmount: parseFloat(payout.toFixed(6))
      })
    );
  }

  // Mark losers
  const losingSide = outcome === 'up' ? 'down' : 'up';
  const losingBetsQuery = query(
    collection(db, BETS_COLLECTION),
    where('predictionId', '==', predictionId),
    where('side', '==', losingSide)
  );
  const losingBets = await getDocs(losingBetsQuery);

  for (const betDoc of losingBets.docs) {
    const bet = betDoc.data() as PredictionBet;
    
    console.log(`❌ Loser: ${bet.userWallet.slice(0, 8)}...
      Lost: $${bet.amount}
    `);

    updates.push(
      updateDoc(doc(db, BETS_COLLECTION, betDoc.id), {
        status: 'lost',
        payoutAmount: 0
      })
    );
  }

  await Promise.all(updates);
  
  console.log(`✅ Settlement Complete!
    Winners: ${winningBets.size}
    Losers: ${losingBets.size}
    Platform Fee Earned: $${platformFee}
  `);
}
