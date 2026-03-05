'use client';

import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import Link from 'next/link';

// USDC Mint
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
// Admin wallet - APNI WALLET ADDRESS
const ADMIN_WALLET = "6nHPbBNx31qpkFLrs3wxzDGKDjWQYQGuVsh9qB7VLBQ";

// Types
interface Market {
  id: string;
  question: string;
  endTime: number;
  yesAmount: number;
  noAmount: number;
  resolved: boolean;
  winningOutcome: 'yes' | 'no' | null;
  category: string;
  createdBy: string;
}

// Sample initial markets
const INITIAL_MARKETS: Market[] = [
  {
    id: "1",
    question: "Will BTC be above $90,000 on March 15, 2025?",
    endTime: 1742006400000,
    yesAmount: 25000,
    noAmount: 18000,
    resolved: false,
    winningOutcome: null,
    category: "Crypto",
    createdBy: ADMIN_WALLET
  },
  {
    id: "2",
    question: "Will SOL hit $200 by April 1, 2025?",
    endTime: 1743465600000,
    yesAmount: 12000,
    noAmount: 15000,
    resolved: false,
    winningOutcome: null,
    category: "Crypto",
    createdBy: ADMIN_WALLET
  },
  {
    id: "3",
    question: "Will ETH be above $5,000 this month?",
    endTime: 1743465600000,
    yesAmount: 35000,
    noAmount: 22000,
    resolved: false,
    winningOutcome: null,
    category: "Crypto",
    createdBy: ADMIN_WALLET
  }
];

export default function PredictionMarketPage() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  
  const [markets, setMarkets] = useState<Market[]>(INITIAL_MARKETS);
  const [isAdmin, setIsAdmin] = useState(false);
  const [balance, setBalance] = useState({ usdc: 0, sol: 0 });
  const [token, setToken] = useState<'USDC' | 'SOL'>('USDC');
  
  // Modals
  const [showBetModal, setShowBetModal] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [betOutcome, setBetOutcome] = useState<'yes' | 'no' | null>(null);
  const [betAmount, setBetAmount] = useState('');

  // Check admin
  useEffect(() => {
    if (publicKey) {
      setIsAdmin(publicKey.toString() === ADMIN_WALLET);
      fetchBalance();
    }
  }, [publicKey]);

  // Fetch balance
  const fetchBalance = async () => {
    if (!publicKey || !connection) return;
    
    try {
      const sol = await connection.getBalance(publicKey);
      const usdcAddr = await getAssociatedTokenAddress(USDC_MINT, publicKey);
      
      let usdc = 0;
      try {
        const acc = await getAccount(connection, usdcAddr);
        usdc = Number(acc.amount) / 1000000;
      } catch (e) {}
      
      setBalance({ sol: sol / LAMPORTS_PER_SOL, usdc });
    } catch (error) {
      console.error('Balance fetch error:', error);
    }
  };

  // Open bet modal
  const openBetModal = (market: Market, outcome: 'yes' | 'no') => {
    if (!connected) {
      alert('Please connect wallet first');
      return;
    }
    setSelectedMarket(market);
    setBetOutcome(outcome);
    setBetAmount('');
    setShowBetModal(true);
  };

  // Place bet (Simulation - Blockchain integration ready)
  const placeBet = async () => {
    if (!betOutcome || !selectedMarket || !betAmount) return;
    
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Invalid amount');
      return;
    }

    // Check balance
    const currentBalance = token === 'USDC' ? balance.usdc : balance.sol;
    if (amount > currentBalance) {
      alert(`Insufficient ${token} balance`);
      return;
    }

    // Update market (Simulation)
    setMarkets(markets.map(m => {
      if (m.id === selectedMarket.id) {
        return {
          ...m,
          yesAmount: betOutcome === 'yes' ? m.yesAmount + amount : m.yesAmount,
          noAmount: betOutcome === 'no' ? m.noAmount + amount : m.noAmount
        };
      }
      return m;
    }));
    
    setShowBetModal(false);
    alert(`✅ Bet placed: ${amount} ${token} on ${betOutcome.toUpperCase()}`);
    fetchBalance();
  };

  // Calculate totals
  const totalVolume = markets.reduce((acc, m) => acc + m.yesAmount + m.noAmount, 0);
  const activeMarkets = markets.filter(m => !m.resolved).length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      {/* Header Section - NO NAVBAR (already in layout) */}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Prediction Markets</h1>
            <p className="text-gray-400">Bet on crypto outcomes with USDC or SOL</p>
          </div>
          
          {connected && (
            <div className="text-right bg-[#141414] rounded-xl p-4 border border-gray-800">
              <div className="text-sm text-gray-400 mb-1">Your Balance</div>
              <div className="text-xl font-bold text-green-400">{balance.usdc.toFixed(2)} USDC</div>
              <div className="text-xl font-bold text-purple-400">{balance.sol.toFixed(4)} SOL</div>
            </div>
          )}
        </div>

        {/* Admin Notice */}
        {isAdmin && (
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-4 mb-6 flex justify-between items-center">
            <div>
              <span className="text-yellow-400 font-bold">Admin Mode</span>
              <p className="text-yellow-200/70 text-sm">Create markets from Admin Dashboard</p>
            </div>
            <Link 
              href="/admin" 
              className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg font-medium transition"
            >
              Go to Admin Panel →
            </Link>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#141414] border border-gray-800 rounded-xl p-6">
            <div className="text-3xl font-bold text-green-400">${totalVolume.toLocaleString()}</div>
            <div className="text-gray-500 text-sm mt-1">Total Volume</div>
          </div>
          <div className="bg-[#141414] border border-gray-800 rounded-xl p-6">
            <div className="text-3xl font-bold text-blue-400">{activeMarkets}</div>
            <div className="text-gray-500 text-sm mt-1">Active Markets</div>
          </div>
          <div className="bg-[#141414] border border-gray-800 rounded-xl p-6">
            <div className="text-3xl font-bold text-yellow-400">{markets.length}</div>
            <div className="text-gray-500 text-sm mt-1">Total Markets</div>
          </div>
          <div className="bg-[#141414] border border-gray-800 rounded-xl p-6 text-center">
            <div className="text-2xl font-bold text-purple-400">USDC/SOL</div>
            <div className="text-gray-500 text-sm">Accepted</div>
          </div>
        </div>

        {/* Token Selector */}
        <div className="flex gap-4 mb-6">
          <button 
            onClick={() => setToken('USDC')}
            className={`px-6 py-3 rounded-xl font-bold transition ${
              token === 'USDC' 
                ? 'bg-green-600 text-white shadow-lg shadow-green-900/30' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Bet with USDC
          </button>
          <button 
            onClick={() => setToken('SOL')}
            className={`px-6 py-3 rounded-xl font-bold transition ${
              token === 'SOL' 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Bet with SOL
          </button>
        </div>

        {/* Markets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {markets.map(market => {
            const total = market.yesAmount + market.noAmount;
            const yesPercent = total > 0 ? (market.yesAmount / total) * 100 : 50;
            const noPercent = 100 - yesPercent;
            const isEnded = Date.now() > market.endTime;

            return (
              <div key={market.id} className="bg-[#141414] border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition">
                {/* Header */}
                <div className="h-24 bg-gradient-to-br from-purple-900/50 to-blue-900/50 relative p-4">
                  <div className="flex justify-between items-start">
                    <span className="px-3 py-1 bg-black/50 backdrop-blur rounded-full text-xs font-medium">
                      {market.category}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      market.resolved ? 'bg-red-500/20 text-red-400' : 
                      isEnded ? 'bg-yellow-500/20 text-yellow-400' : 
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {market.resolved ? 'Resolved' : isEnded ? 'Ended' : 'Live'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-semibold text-lg mb-4 leading-snug">{market.question}</h3>

                  {/* Probability Bar */}
                  <div className="mb-4">
                    <div className="flex h-12 rounded-xl overflow-hidden text-sm font-bold">
                      <div 
                        className="bg-green-500 flex items-center justify-center transition-all"
                        style={{ width: `${yesPercent}%` }}
                      >
                        {yesPercent > 20 && `YES ${yesPercent.toFixed(1)}%`}
                      </div>
                      <div 
                        className="bg-red-500 flex items-center justify-center transition-all"
                        style={{ width: `${noPercent}%` }}
                      >
                        {noPercent > 20 && `${noPercent.toFixed(1)}% NO`}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                      <div className="text-green-400 font-bold">${market.yesAmount.toLocaleString()}</div>
                      <div className="text-gray-500 text-xs">YES Volume</div>
                    </div>
                    <div className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                      <div className="text-red-400 font-bold">${market.noAmount.toLocaleString()}</div>
                      <div className="text-gray-500 text-xs">NO Volume</div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-400 mb-4">
                    Ends: {new Date(market.endTime).toLocaleDateString()}
                  </div>

                  {/* Action Buttons */}
                  {!market.resolved && !isEnded && (
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => openBetModal(market, 'yes')}
                        className="py-3 bg-green-600 hover:bg-green-700 active:scale-95 rounded-xl font-bold transition"
                      >
                        Buy YES
                      </button>
                      <button 
                        onClick={() => openBetModal(market, 'no')}
                        className="py-3 bg-red-600 hover:bg-red-700 active:scale-95 rounded-xl font-bold transition"
                      >
                        Buy NO
                      </button>
                    </div>
                  )}

                  {market.resolved && (
                    <div className="py-3 bg-[#0a0a0a] rounded-xl text-center border border-gray-800">
                      Winner: <span className={`font-bold ${market.winningOutcome === 'yes' ? 'text-green-400' : 'text-red-400'}`}>
                        {market.winningOutcome?.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bet Modal */}
      {showBetModal && selectedMarket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-gray-800 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold mb-2">
              Buy <span className={betOutcome === 'yes' ? 'text-green-400' : 'text-red-400'}>{betOutcome?.toUpperCase()}</span>
            </h3>
            <p className="text-gray-400 text-sm mb-4">{selectedMarket.question}</p>
            
            <div className="relative mb-4">
              <input 
                type="number"
                placeholder="0.00"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl p-4 text-2xl font-bold text-white focus:border-purple-500 focus:outline-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">{token}</span>
            </div>

            <div className="text-sm text-gray-400 mb-6">
              Balance: {token === 'USDC' ? balance.usdc.toFixed(2) : balance.sol.toFixed(4)} {token}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowBetModal(false)}
                className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium transition"
              >
                Cancel
              </button>
              <button 
                onClick={placeBet}
                className={`flex-1 py-4 rounded-xl font-bold transition ${
                  betOutcome === 'yes' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Confirm Bet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
