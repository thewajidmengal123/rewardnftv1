// Prize Pool Distribution - Complete Logic
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
