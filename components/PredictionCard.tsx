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

  // Treasury wallet from console (COPY EXACTLY)
  const PLATFORM_WALLET = new PublicKey('A9GT8pYUR5F1oRwUsQ9ADeZTWq7LJMfmPQ3TZLmV6cQP');
  
  // USDC Mint
  const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

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
      // Reliable RPC connection
      const connection = new Connection('https://rpc.ankr.com/solana', 'confirmed');
      let signature: string;

      if (token === 'SOL') {
        // Native SOL transfer
        const transaction = new Transaction();
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: PLATFORM_WALLET,
            lamports: Math.floor(betAmount * 1000000000),
          })
        );
        
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;
        
        const signed = await signTransaction(transaction);
        signature = await connection.sendRawTransaction(signed.serialize());
        
      } else {
        // USDC SPL Token transfer
        try {
          const userTokenAccount = await getAssociatedTokenAddress(USDC_MINT, publicKey);
          const platformTokenAccount = await getAssociatedTokenAddress(USDC_MINT, PLATFORM_WALLET);
          
          // Check user's token account
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
              Math.floor(betAmount * 1000000)
            )
          );
          
          const { blockhash } = await connection.getLatestBlockhash();
          transaction.recentBlockhash = blockhash;
          transaction.feePayer = publicKey;
          
          const signed = await signTransaction(transaction);
          signature = await connection.sendRawTransaction(signed.serialize());
        } catch (err: any) {
          throw new Error('USDC transfer failed: ' + err.message);
        }
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
        alert(`✅ Bet placed! Tx: ${signature.slice(0, 16)}...`);
        setAmount('');
        setSelectedSide(null);
        onBetPlaced();
      } else {
        throw new Error(data.error || 'Failed to save bet');
      }
      
    } catch (error: any) {
      console.error('Bet error:', error);
      setTxStatus('error');
      alert(`❌ Failed: ${error.message}`);
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
                selectedSide ===
