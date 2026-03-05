'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/wallet-context';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { 
  getAssociatedTokenAddress, 
  createTransferInstruction,
} from '@solana/spl-token';
import { Clock, Users, TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';

interface PredictionCardProps {
  prediction: any;
  onBetPlaced: () => void;
  variant?: 'default' | 'compact';
}

export default function PredictionCard({ prediction, onBetPlaced, variant = 'default' }: PredictionCardProps) {
  const { connected, publicKey, signTransaction } = useWallet();
  const [selectedSide, setSelectedSide] = useState<'up' | 'down' | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<'USDC' | 'SOL'>('USDC');
  const [timeLeft, setTimeLeft] = useState('');
  const [txStatus, setTxStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  // Token mint addresses
  const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
  const PLATFORM_WALLET = new PublicKey(process.env.NEXT_PUBLIC_PLATFORM_WALLET || '1A9GT8pYUR5F1oRwUsQ9ADeZTWq7LJMfmPQ3TZLmV6cQP');

  // Countdown timer
  useEffect(() => {
    const updateTimer = () => {
      const end = prediction.endTime?.toMillis ? prediction.endTime.toMillis() : new Date(prediction.endTime).getTime();
      const now = Date.now();
      const diff = end - now;
      
      if (diff <= 0) {
        setTimeLeft('Ended');
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (days > 0) setTimeLeft(`${days}d:${hours}h:${minutes}m`);
      else if (hours > 0) setTimeLeft(`${hours}h:${minutes}m:${seconds}s`);
      else setTimeLeft(`${minutes}m:${seconds}s`);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [prediction.endTime]);

  const handleBet = async () => {
    if (!connected || !publicKey || !signTransaction || !selectedSide || !amount) {
      alert('Please connect wallet first');
      return;
    }
    
    const betAmount = parseFloat(amount);
    if (isNaN(betAmount) || betAmount <= 0) {
      alert('Please enter valid amount');
      return;
    }

    setLoading(true);
    setTxStatus('processing');
    
    try {
      const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com');
      let signature: string;

      if (token === 'SOL') {
        // Native SOL transfer
        const transaction = new Transaction();
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: PLATFORM_WALLET,
            lamports: Math.floor(betAmount * 1000000000), // SOL has 9 decimals
          })
        );
        
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;
        
        const signed = await signTransaction(transaction);
        signature = await connection.sendRawTransaction(signed.serialize());
        
      } else {
        // USDC SPL Token transfer
        const userTokenAccount = await getAssociatedTokenAddress(USDC_MINT, publicKey);
        const platformTokenAccount = await getAssociatedTokenAddress(USDC_MINT, PLATFORM_WALLET);
        
        // Check user's token account exists
        const userAccountInfo = await connection.getAccountInfo(userTokenAccount);
        if (!userAccountInfo) {
          alert('You need a USDC token account. Please receive some USDC first.');
          setLoading(false);
          setTxStatus('error');
          return;
        }

        const transaction = new Transaction();
        transaction.add(
          createTransferInstruction(
            userTokenAccount,
            platformTokenAccount,
            publicKey,
            Math.floor(betAmount * 1000000) // USDC has 6 decimals
          )
        );
        
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;
        
        const signed = await signTransaction(transaction);
        signature = await connection.sendRawTransaction(signed.serialize());
      }

      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');
      
      // Save to database
      const res = await fetch('/api/predictions/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          predictionId: prediction.id,
          userWallet: publicKey.toString(),
          side: selectedSide,
          amount: betAmount,
          token,
          txSignature: signature
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setTxStatus('success');
        alert(`✅ Bet placed successfully! Tx: ${signature.slice(0, 16)}...`);
        setAmount('');
        setSelectedSide(null);
        onBetPlaced();
      } else {
        throw new Error(data.error || 'Failed to save bet');
      }
      
    } catch (error: any) {
      console.error('Bet error:', error);
      setTxStatus('error');
      alert(`❌ Transaction failed: ${error.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setTxStatus('idle'), 3000);
    }
  };

  const totalPool = prediction.totalPool || 0;
  const upPool = prediction.upPool || 0;
  const downPool = prediction.downPool || 0;
  const upPercent = totalPool > 0 ? (upPool / totalPool) * 100 : 50;
  const downPercent = totalPool > 0 ? (downPool / totalPool) * 100 : 50;
  const upChance = Math.round(upPercent);
  const downChance = Math.round(downPercent);

  const isEnded = timeLeft === 'Ended';
  const isBTC = prediction.category === 'btc-5min';

  if (variant === 'compact') {
    return (
      <div className="bg-[#1a1d29] rounded-2xl overflow-hidden border border-gray-800 hover:border-gray-700 transition-all">
        <div className="h-32 bg-gradient-to-br from-orange-500/20 to-yellow-500/20 relative overflow-hidden">
          {isBTC ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl">₿</span>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl">📊</span>
            </div>
          )}
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs font-mono">
            <Clock className="w-3 h-3 inline mr-1" />
            {timeLeft}
          </div>
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs">
            <Users className="w-3 h-3 inline mr-1" />
            {prediction.totalBets || 0}
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-white font-semibold text-sm mb-3 line-clamp-2">
            {prediction.title}
          </h3>

          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Chance</p>
              <div className="flex items-center gap-2">
                <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 to-green-400" style={{ width: `${upChance}%` }} />
                </div>
                <span className="text-green-400 font-bold text-sm">{upChance}%</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">Ticket</p>
              <div className="flex items-center gap-1 text-blue-400">
                <DollarSign className="w-3 h-3" />
                <span className="font-bold">5</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSelectedSide('down')}
              disabled={isEnded || loading}
              className={`py-2 rounded-lg text-sm font-bold transition-all ${
                selectedSide === 'down' ? 'bg-red-500 text-white' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
              } disabled:opacity-50`}
            >
              NO
            </button>
            <button
              onClick={() => setSelectedSide('up')}
              disabled={isEnded || loading}
              className={`py-2 rounded-lg text-sm font-bold transition-all ${
                selectedSide === 'up' ? 'bg-green-500 text-white' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
              } disabled:opacity-50`}
            >
              YES
            </button>
          </div>

          {selectedSide && !isEnded && (
            <div className="mt-3 space-y-2 animate-in slide-in-from-top-2">
              {!connected ? (
                <div className="text-center p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <p className="text-yellow-400 text-sm">Connect wallet to bet</p>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    {['USDC', 'SOL'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setToken(t as any)}
                        className={`flex-1 py-1.5 rounded text-xs font-semibold ${
                          token === t ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    placeholder={`Amount in ${token}`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={loading}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                  />
                  <button
                    onClick={handleBet}
                    disabled={loading || !amount}
                    className={`w-full text-white text-sm font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      txStatus === 'success' ? 'bg-green-500' : 
                      txStatus === 'error' ? 'bg-red-500' : 
                      'bg-blue-500 hover:bg-blue-600'
                    } disabled:opacity-50`}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : txStatus === 'success' ? (
                      '✓ Success!'
                    ) : (
                      `Bet ${selectedSide.toUpperCase()}`
                    )}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default full size
  return (
    <div className="bg-[#1a1d29] rounded-2xl overflow-hidden border border-gray-800">
      <div className="h-48 bg-gradient-to-br from-blue-600/20 to-purple-600/20 relative overflow-hidden">
        {isBTC ? (
          <>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-8xl animate-pulse">₿</span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl">🔮</span>
          </div>
        )}
        
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-mono text-white border border-white/10">
            <Clock className="w-3 h-3 inline mr-1.5" />
            {timeLeft}
          </span>
          {isBTC && (
            <span className="bg-orange-500/20 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-orange-400 border border-orange-500/30">
              ⚡ LIVE
            </span>
          )}
        </div>
        
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-xs text-gray-300 border border-white/10">
          <Users className="w-3 h-3 inline mr-1.5" />
          {prediction.totalBets || 0} bets
        </div>

        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
          <p className="text-xs text-gray-400 mb-0.5">Total Pool</p>
          <p className="text-xl font-bold text-white">${totalPool.toLocaleString()}</p>
        </div>
      </div>

      <div className="p-6">
        <h2 className="text-2xl font-bold text-white mb-2">{prediction.title}</h2>
        <p className="text-gray-400 mb-6">{prediction.description}</p>

        {!connected && (
          <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-center">
            <Wallet className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-yellow-400 text-sm">Connect wallet to place bets</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
            <div className="flex justify-between items-start mb-2">
              <span className="text-green-400 font-semibold flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                UP
              </span>
              <span className="text-2xl font-bold text-green-400">{upChance}%</span>
            </div>
            <p className="text-sm text-gray-400 mb-1">Pool: ${upPool.toLocaleString()}</p>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-500" style={{ width: `${upPercent}%` }} />
            </div>
          </div>

          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
            <div className="flex justify-between items-start mb-2">
              <span className="text-red-400 font-semibold flex items-center gap-1">
                <TrendingDown className="w-4 h-4" />
                DOWN
              </span>
              <span className="text-2xl font-bold text-red-400">{downChance}%</span>
            </div>
            <p className="text-sm text-gray-400 mb-1">Pool: ${downPool.toLocaleString()}</p>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500" style={{ width: `${downPercent}%` }} />
            </div>
          </div>
        </div>

        {!isEnded && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedSide('up')}
                disabled={isEnded || loading || !connected}
                className={`py-4 rounded-xl font-bold text-lg transition-all transform ${
                  selectedSide === 'up' ? 'bg-green-500 text-white shadow-lg shadow-green-500/25 scale-[1.02]' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                📈 Bet UP
              </button>
              <button
                onClick={() => setSelectedSide('down')}
                disabled={isEnded || loading || !connected}
                className={`py-4 rounded-xl font-bold text-lg transition-all transform ${
                  selectedSide === 'down' ? 'bg-red-500 text-white shadow-lg shadow-red-500/25 scale-[1.02]' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                📉 Bet DOWN
              </button>
            </div>

            {selectedSide && connected && (
              <div className="animate-in fade-in slide-in-from-bottom-2 space-y-3">
                <div className="flex gap-2 justify-center">
                  {['USDC', 'SOL'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setToken(t as any)}
                      disabled={loading}
                      className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                        token === t ? 'bg-blue-500 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      } disabled:opacity-50`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <input
                    type="number"
                    placeholder={`Enter ${token} amount`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={loading}
                    className="w-full bg-gray-900 border-2 border-gray-800 rounded-xl px-4 py-4 text-xl text-white text-center placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors disabled:opacity-50"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">{token}</span>
                </div>

                {amount && (
                  <div className="text-center p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                    <p className="text-sm text-gray-400 mb-1">Potential Win</p>
                    <p className="text-2xl font-bold text-blue-400">{(parseFloat(amount) * 1.85).toFixed(2)} {token}</p>
                    <p className="text-xs text-gray-500 mt-1">85% return (after 2% fee)</p>
                  </div>
                )}

                <button
                  onClick={handleBet}
                  disabled={loading || !amount || parseFloat(amount) <= 0}
                  className={`w-full text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2 ${
                    txStatus === 'success' ? 'bg-green-500 shadow-green-500/25' : 
                    txStatus === 'error' ? 'bg-red-500 shadow-red-500/25' : 
                    'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-blue-500/25'
                  } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing Transaction...
                    </>
                  ) : txStatus === 'success' ? (
                    '✓ Bet Placed Successfully!'
                  ) : txStatus === 'error' ? (
                    '✗ Transaction Failed - Try Again'
                  ) : (
                    `Place Bet on ${selectedSide.toUpperCase()}`
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {isEnded && prediction.winningSide && (
          <div className="text-center py-6 bg-gray-800/50 rounded-xl border border-gray-700">
            <p className="text-gray-400 mb-2">Prediction Ended</p>
            <p className={`text-3xl font-bold ${prediction.winningSide === 'up' ? 'text-green-400' : 'text-red-400'}`}>
              {prediction.winningSide === 'up' ? '📈 UP' : '📉 DOWN'} WINS
            </p>
            {prediction.btcPriceEnd && (
              <p className="text-sm text-gray-500 mt-2">Final: ${prediction.btcPriceEnd.toLocaleString()}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
