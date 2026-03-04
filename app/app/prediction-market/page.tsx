'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';

// Temporary markets data
const INITIAL_MARKETS = [
  {
    id: "1",
    question: "Will BTC be above $90,000 on March 15?",
    endTime: 1710508800000,
    yesAmount: 25000,
    noAmount: 18000,
    resolved: false,
    winningOutcome: null,
    category: "Crypto"
  },
  {
    id: "2",
    question: "Will SOL hit $200 by April 1?",
    endTime: 1711929600000,
    yesAmount: 12000,
    noAmount: 15000,
    resolved: false,
    winningOutcome: null,
    category: "Crypto"
  },
  {
    id: "3",
    question: "Will ETH be above $5,000 this month?",
    endTime: 1711929600000,
    yesAmount: 35000,
    noAmount: 22000,
    resolved: false,
    winningOutcome: null,
    category: "Crypto"
  }
];

// Admin wallet address - YEH AAPNA ADDRESS DALNA
const ADMIN_WALLET = "6nHPbBNx31qpkFLrs3wxzDGKDjWQYQGuVsh9qB7VLBQ";

export default function PredictionMarketPage() {
  const { publicKey } = useWallet();
  const [markets, setMarkets] = useState(INITIAL_MARKETS);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [betModal, setBetModal] = useState({
    show: false, 
    marketId: '', 
    outcome: null as 'yes' | 'no' | null
  });
  const [betAmount, setBetAmount] = useState('');

  useEffect(() => {
    if (publicKey) {
      setIsAdmin(publicKey.toString() === ADMIN_WALLET);
    }
  }, [publicKey]);

  const createMarket = () => {
    if (!newQuestion || !newEndDate) return;
    
    const newMarket = {
      id: Date.now().toString(),
      question: newQuestion,
      endTime: new Date(newEndDate).getTime(),
      yesAmount: 0,
      noAmount: 0,
      resolved: false,
      winningOutcome: null,
      category: "Crypto"
    };
    
    setMarkets([newMarket, ...markets]);
    setShowCreateModal(false);
    setNewQuestion('');
    setNewEndDate('');
  };

  const placeBet = () => {
    if (!betModal.outcome || !betAmount) return;
    
    const amount = parseFloat(betAmount);
    setMarkets(markets.map(m => {
      if (m.id === betModal.marketId) {
        return {
          ...m,
          yesAmount: betModal.outcome === 'yes' ? m.yesAmount + amount : m.yesAmount,
          noAmount: betModal.outcome === 'no' ? m.noAmount + amount : m.noAmount
        };
      }
      return m;
    }));
    
    setBetModal({show: false, marketId: '', outcome: null});
    setBetAmount('');
  };

  const resolveMarket = (marketId: string, outcome: 'yes' | 'no') => {
    setMarkets(markets.map(m => 
      m.id === marketId ? {...m, resolved: true, winningOutcome: outcome} : m
    ));
  };

  const totalVolume = markets.reduce((acc, m) => acc + m.yesAmount + m.noAmount, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Prediction Markets</h1>
          <p className="text-gray-400">Bet on crypto outcomes with USDC</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#141414] border border-gray-800 rounded-xl p-6">
            <div className="text-3xl font-bold text-green-400">${totalVolume.toLocaleString()}</div>
            <div className="text-gray-500 text-sm mt-1">Total Volume</div>
          </div>
          <div className="bg-[#141414] border border-gray-800 rounded-xl p-6">
            <div className="text-3xl font-bold text-blue-400">{markets.length}</div>
            <div className="text-gray-500 text-sm mt-1">Active Markets</div>
          </div>
          <div className="bg-[#141414] border border-gray-800 rounded-xl p-6">
            <div className="text-3xl font-bold text-yellow-400">24h</div>
            <div className="text-gray-500 text-sm mt-1">Avg Resolution</div>
          </div>
          <div className="bg-[#141414] border border-gray-800 rounded-xl p-6 flex items-center justify-center">
            {isAdmin ? (
              <button 
                onClick={() => setShowCreateModal(true)}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-semibold transition"
              >
                + Create Market
              </button>
            ) : (
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">USDC</div>
                <div className="text-gray-500 text-sm">Primary Token</div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {markets.map(market => {
            const total = market.yesAmount + market.noAmount;
            const yesPercent = total > 0 ? (market.yesAmount / total) * 100 : 50;
            const noPercent = 100 - yesPercent;
            const isEnded = Date.now() > market.endTime;

            return (
              <div key={market.id} className="bg-[#141414] border border-gray-800 rounded-2xl overflow-hidden">
                <div className="h-24 bg-gradient-to-br from-purple-900/50 to-blue-900/50 relative p-4">
                  <div className="flex justify-between items-start">
                    <span className="px-3 py-1 bg-black/50 backdrop-blur rounded-full text-xs font-medium">
                      {market.category}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      market.resolved ? 'bg-red-500/20 text-red-400' : 
                      isEnded ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
                    }`}>
                      {market.resolved ? 'Resolved' : isEnded ? 'Ended' : 'Live'}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-semibold text-lg mb-4">{market.question}</h3>

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

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-[#0a0a0a] rounded-lg p-3">
                      <div className="text-green-400 font-bold">${market.yesAmount.toLocaleString()}</div>
                      <div className="text-gray-500 text-xs">YES Volume</div>
                    </div>
                    <div className="bg-[#0a0a0a] rounded-lg p-3">
                      <div className="text-red-400 font-bold">${market.noAmount.toLocaleString()}</div>
                      <div className="text-gray-500 text-xs">NO Volume</div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-400 mb-4">
                    Ends: {new Date(market.endTime).toLocaleDateString()}
                  </div>

                  {!market.resolved && !isEnded && (
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setBetModal({show: true, marketId: market.id, outcome: 'yes'})}
                        className="py-3 bg-green-600 hover:bg-green-700 rounded-xl font-bold"
                      >
                        Buy YES
                      </button>
                      <button 
                        onClick={() => setBetModal({show: true, marketId: market.id, outcome: 'no'})}
                        className="py-3 bg-red-600 hover:bg-red-700 rounded-xl font-bold"
                      >
                        Buy NO
                      </button>
                    </div>
                  )}

                  {market.resolved && (
                    <div className="py-3 bg-[#0a0a0a] rounded-xl text-center">
                      Winner: <span className={market.winningOutcome === 'yes' ? 'text-green-400' : 'text-red-400'}>
                        {market.winningOutcome?.toUpperCase()}
                      </span>
                    </div>
                  )}

                  {isAdmin && isEnded && !market.resolved && (
                    <div className="mt-3 pt-3 border-t border-gray-800 grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => resolveMarket(market.id, 'yes')}
                        className="py-2 bg-green-900/50 hover:bg-green-900 border border-green-700 rounded-lg text-sm"
                      >
                        Resolve YES
                      </button>
                      <button 
                        onClick={() => resolveMarket(market.id, 'no')}
                        className="py-2 bg-red-900/50 hover:bg-red-900 border border-red-700 rounded-lg text-sm"
                      >
                        Resolve NO
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">Create New Market</h2>
            <input 
              type="text"
              placeholder="Question"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl p-4 mb-4"
            />
            <input 
              type="datetime-local"
              value={newEndDate}
              onChange={(e) => setNewEndDate(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl p-4 mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 py-4 bg-gray-800 rounded-xl">Cancel</button>
              <button onClick={createMarket} className="flex-1 py-4 bg-purple-600 rounded-xl font-bold">Create</button>
            </div>
          </div>
        </div>
      )}

      {betModal.show && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-gray-800 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold mb-4">Buy {betModal.outcome?.toUpperCase()}</h3>
            <input 
              type="number"
              placeholder="USDC Amount"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl p-4 mb-4 text-2xl"
            />
            <div className="flex gap-3">
              <button onClick={() => setBetModal({show: false, marketId: '', outcome: null})} className="flex-1 py-4 bg-gray-800 rounded-xl">Cancel</button>
              <button 
                onClick={placeBet}
                className={`flex-1 py-4 rounded-xl font-bold ${betModal.outcome === 'yes' ? 'bg-green-600' : 'bg-red-600'}`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
