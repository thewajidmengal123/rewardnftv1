'use client';

import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { 
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import Link from 'next/link';

// USDC Mint Address (Mainnet)
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
// SOL mint (Native SOL)
const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');

// Admin wallet address - YEH AAPNA ADDRESS DALNA
const ADMIN_WALLET = "6nHPbBNx31qpkFLrs3wxzDGKDjWQYQGuVsh9qB7VLBQ";

// Sample markets data
const INITIAL_MARKETS = [
  {
    id: "1",
    question: "Will BTC be above $90,000 on March 15, 2025?",
    endTime: 1742006400000,
    yesAmount: 25000,
    noAmount: 18000,
    resolved: false,
    winningOutcome: null,
    category: "Crypto",
    createdAt: Date.now()
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
    createdAt: Date.now()
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
    createdAt: Date.now()
  }
];

export default function PredictionMarketPage() {
  const { publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();
  
  const [markets, setMarkets] = useState(INITIAL_MARKETS);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userBalance, setUserBalance] = useState({ usdc: 0, sol: 0 });
  const [selectedToken, setSelectedToken] = useState<'USDC' | 'SOL'>('USDC');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBetModal, setShowBetModal] = useState(false);
  const [showAutoBTModal, setShowAutoBTModal] = useState(false);
  
  // Form states
  const [newQuestion, setNewQuestion] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [betAmount, setBetAmount] = useState('');
  const [betOutcome, setBetOutcome] = useState<'yes' | 'no' | null>(null);
  const [currentMarketId, setCurrentMarketId] = useState('');
  
  // Auto BTC
  const [btcPrice, setBtcPrice] = useState(0);
  const [btcTargetPrice, setBtcTargetPrice] = useState(0);
  const [btcPercent, setBtcPercent] = useState(5);

  // Check admin
  useEffect(() => {
    if (publicKey) {
      setIsAdmin(publicKey.toString() === ADMIN_WALLET);
      fetchBalances();
    }
  }, [publicKey, connection]);

  // Fetch user balances
  const fetchBalances = async () => {
    if (!publicKey || !connection) return;
    
    try {
      // SOL balance
      const solBalance = await connection.getBalance(publicKey);
      
      // USDC balance
      const usdcAccount = await getAssociatedTokenAddress(USDC_MINT, publicKey);
      let usdcBalance = 0;
      
      try {
        const account = await getAccount(connection, usdcAccount);
        usdcBalance = Number(account.amount) / 1000000; // 6 decimals
      } catch (e) {
        // Account doesn't exist
      }
      
      setUserBalance({
        sol: solBalance / LAMPORTS_PER_SOL,
        usdc: usdcBalance
      });
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  };

  // Create new market
  const createMarket = () => {
    if (!newQuestion || !newEndDate) {
      alert('Please fill all fields');
      return;
    }
    
    const newMarket = {
      id: Date.now().toString(),
      question: newQuestion,
      endTime: new Date(newEndDate).getTime(),
      yesAmount: 0,
      noAmount: 0,
      resolved: false,
      winningOutcome: null,
      category: "Crypto",
      createdAt: Date.now()
    };
    
    setMarkets([newMarket, ...markets]);
    setShowCreateModal(false);
    setNewQuestion('');
    setNewEndDate('');
    alert('Market created successfully!');
  };

  // Open bet modal
  const openBetModal = (marketId: string, outcome: 'yes' | 'no') => {
    if (!connected) {
      alert('Please connect wallet first');
      return;
    }
    setCurrentMarketId(marketId);
    setBetOutcome(outcome);
    setBetAmount('');
    setShowBetModal(true);
  };

  // Place bet (Simulated - Blockchain integration ready)
  const placeBet = async () => {
    if (!betOutcome || !betAmount || !currentMarketId) return;
    
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Invalid amount');
      return;
    }

    // Check balance
    const balance = selectedToken === 'USDC' ? userBalance.usdc : userBalance.sol;
    if (amount > balance) {
      alert(`Insufficient ${selectedToken} balance`);
      return;
    }

    // TODO: Blockchain transaction here
    // For now, just update UI
    setMarkets(markets.map(m => {
      if (m.id === currentMarketId) {
        return {
          ...m,
          yesAmount: betOutcome === 'yes' ? m.yesAmount + amount : m.yesAmount,
          noAmount: betOutcome === 'no' ? m.noAmount + amount : m.noAmount
        };
      }
      return m;
    }));
    
    setShowBetModal(false);
    setBetAmount('');
    alert(`Bet placed: ${amount} ${selectedToken} on ${betOutcome.toUpperCase()}`);
    
    // Refresh balance
    fetchBalances();
  };

  // Resolve market (Admin only)
  const resolveMarket = (marketId: string, outcome: 'yes' | 'no') => {
    if (!isAdmin) {
      alert('Only admin can resolve');
      return;
    }
    
    setMarkets(markets.map(m => 
      m.id === marketId ? {...m, resolved: true, winningOutcome: outcome} : m
    ));
  };

  // Auto Create BTC Market
  const fetchBTCPrice = async () => {
    try {
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
      const data = await res.json();
      const price = data.bitcoin.usd;
      setBtcPrice(price);
      
      const target = price * (1 + btcPercent / 100);
      setBtcTargetPrice(Math.round(target));
    } catch (error) {
      alert('Error fetching BTC price');
    }
  };

  const openAutoBTCModal = async () => {
    await fetchBTCPrice();
    setShowAutoBTModal(true);
  };

  const createBTCMarket = () => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    const question = `Will BTC be above $${btcTargetPrice.toLocaleString()} by ${nextMonth.toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'})}?`;
    
    const newMarket = {
      id: Date.now().toString(),
      question,
      endTime: nextMonth.getTime(),
      yesAmount: 0,
      noAmount: 0,
      resolved: false,
      winningOutcome: null,
      category: "BTC %M",
      createdAt: Date.now()
    };
    
    setMarkets([newMarket, ...markets]);
    setShowAutoBTModal(false);
    alert('BTC Market created!');
  };

  // Calculate total volume
  const totalVolume = markets.reduce((acc, m) => acc + m.yesAmount + m.noAmount, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-[#0a0a0a]/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            RewardNFT
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/mint" className="text-gray-400 hover:text-white">Mint</Link>
            <Link href="/referrals" className="text-gray-400 hover:text-white">Referrals</Link>
            <Link href="/leaderboard" className="text-gray-400 hover:text-white">Leaderboard</Link>
            <Link href="/quests" className="text-gray-400 hover:text-white">Quests</Link>
            <Link href="/prediction-market" className="text-purple-400 font-medium">Prediction</Link>
            <Link href="/airdrops" className="text-gray-400 hover:text-white">Airdrops</Link>
            {isAdmin && (
              <Link href="/admin" className="text-yellow-400 border border-yellow-400/30 px-3 py-1 rounded">
                Admin
              </Link>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Prediction Markets</h1>
            <p className="text-gray-400">Bet on crypto outcomes with USDC or SOL</p>
          </div>
          {connected && (
            <div className="text-right">
              <div className="text-sm text-gray-400">Your Balance</div>
              <div className="text-green-400 font-bold">{userBalance.usdc.toFixed(2)} USDC</div>
              <div className="text-purple-400 font-bold">{userBalance.sol.toFixed(4)} SOL</div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#141414] border border-gray-800 rounded-xl p-6">
            <div className="text-3xl font-bold text-green-400">${totalVolume.toLocaleString()}</div>
            <div className="text-gray-500 text-sm mt-1">Total Volume</div>
          </div>
          <div className="bg-[#141414] border border-gray-800 rounded-xl p-6">
            <div className="text-3xl font-bold text-blue-400">{markets.filter(m => !m.resolved).length}</div>
            <div className="text-gray-500 text-sm mt-1">Active Markets</div>
          </div>
          <div className="bg-[#141414] border border-gray-800 rounded-xl p-6">
            <div className="text-3xl font-bold text-yellow-400">{markets.length}</div>
            <div className="text-gray-500 text-sm mt-1">Total Markets</div>
          </div>
          <div className="bg-[#141414] border border-gray-800 rounded-xl p-6 flex flex-col gap-2">
            {isAdmin ? (
              <>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-semibold text-sm"
                >
                  + Create Market
                </button>
                <button 
                  onClick={openAutoBTCModal}
                  className="w-full py-2 bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
                >
                  ⚡ Auto BTC Market
                </button>
              </>
            ) : (
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">USDC/SOL</div>
                <div className="text-gray-500 text-sm">Accepted</div>
              </div>
            )}
          </div>
        </div>

        {/* Token Selector */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setSelectedToken('USDC')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              selectedToken === 'USDC' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Bet with USDC
          </button>
          <button
            onClick={() => setSelectedToken('SOL')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              selectedToken === 'SOL' 
                ? 'bg-purple-600 text-white' 
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

                  {/* Bet Buttons */}
                  {!market.resolved && !isEnded && (
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => openBetModal(market.id, 'yes')}
                        className="py-3 bg-green-600 hover:bg-green-700 rounded-xl font-bold transition"
                      >
                        Buy YES
                      </button>
                      <button 
                        onClick={() => openBetModal(market.id, 'no')}
                        className="py-3 bg-red-600 hover:bg-red-700 rounded-xl font-bold transition"
                      >
                        Buy NO
                      </button>
                    </div>
                  )}

                  {/* Result */}
                  {market.resolved && (
                    <div className="py-3 bg-[#0a0a0a] rounded-xl text-center border border-gray-800">
                      Winner: <span className={`font-bold ${market.winningOutcome === 'yes' ? 'text-green-400' : 'text-red-400'}`}>
                        {market.winningOutcome?.toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Admin Resolve */}
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

      {/* Create Market Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">Create New Market</h2>
            <input 
              type="text"
              placeholder="Enter question (e.g., Will BTC hit $100k?)"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl p-4 mb-4 text-white focus:border-purple-500 focus:outline-none"
            />
            <input 
              type="datetime-local"
              value={newEndDate}
              onChange={(e) => setNewEndDate(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl p-4 mb-6 text-white focus:border-purple-500 focus:outline-none"
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium transition"
              >
                Cancel
              </button>
              <button 
                onClick={createMarket}
                className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-bold transition"
              >
                Create Market
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bet Modal */}
      {showBetModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-gray-800 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold mb-2">
              Buy <span className={betOutcome === 'yes' ? 'text-green-400' : 'text-red-400'}>{betOutcome?.toUpperCase()}</span>
            </h3>
            <p className="text-gray-400 text-sm mb-4">Enter amount in {selectedToken}</p>
            
            <div className="relative mb-4">
              <input 
                type="number"
                placeholder="0.00"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl p-4 text-2xl font-bold text-white focus:border-purple-500 focus:outline-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">{selectedToken}</span>
            </div>

            <div className="text-sm text-gray-400 mb-6">
              Balance: {selectedToken === 'USDC' ? userBalance.usdc.toFixed(2) : userBalance.sol.toFixed(4)} {selectedToken}
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

      {/* Auto BTC Market Modal */}
      {showAutoBTModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-2">⚡ Auto BTC Market</h2>
            <p className="text-gray-400 text-sm mb-6">Create BTC price prediction market automatically</p>
            
            <div className="bg-[#0a0a0a] rounded-xl p-4 mb-4 border border-gray-800">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Current BTC Price:</span>
                <span className="font-bold text-orange-400">${btcPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Target (% change):</span>
                <input 
                  type="number"
                  value={btcPercent}
                  onChange={(e) => {
                    setBtcPercent(Number(e.target.value));
                    setBtcTargetPrice(Math.round(btcPrice * (1 + Number(e.target.value) / 100)));
                  }}
                  className="w-20 bg-gray-800 rounded px-2 py-1 text-right"
                />
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Target Price:</span>
                <span className="font-bold text-green-400">${btcTargetPrice.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-purple-900/20 border border-purple-700/50 rounded-xl p-4 mb-6">
              <p className="text-sm text-purple-300">
                Question: Will BTC be above ${btcTargetPrice.toLocaleString()} by {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}?
              </p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowAutoBTModal(false)}
                className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={createBTCMarket}
                className="flex-1 py-4 bg-orange-600 hover:bg-orange-700 rounded-xl font-bold"
              >
                Create BTC Market
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
