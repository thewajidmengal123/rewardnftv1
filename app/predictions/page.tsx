'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/contexts/wallet-context';
import { TrendingUp, Clock, BarChart3, Bitcoin } from 'lucide-react';
import PredictionCard from '@/components/PredictionCard';

export default function PredictionsPage() {
  const { publicKey } = useWallet();
  const [predictions, setPredictions] = useState<any[]>([]);
  const [btcRound, setBtcRound] = useState<any>(null);
  const [myBets, setMyBets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'trending' | 'ending' | 'all'>('trending');
  const [btcPrice, setBtcPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);

  useEffect(() => {
    fetchData();
    fetchPrice();
    const interval = setInterval(() => {
      fetchData();
      fetchPrice();
    }, 30000);
    return () => clearInterval(interval);
  }, [publicKey]);

  const fetchPrice = async () => {
    try {
      const res = await fetch('/api/predictions/price');
      const data = await res.json();
      if (data.success) {
        setBtcPrice(data.btc.price);
        setPriceChange(data.btc.change24h);
      }
    } catch (error) {
      console.error('Price fetch error:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [predRes, btcRes, betsRes] = await Promise.all([
        fetch('/api/predictions?status=active'),
        fetch('/api/predictions/btc-rounds'),
        publicKey ? fetch(`/api/predictions/bet?wallet=${publicKey.toString()}`) : Promise.resolve(null)
      ]);

      const predData = await predRes.json();
      const btcData = await btcRes.json();
      
      console.log('Predictions:', predData);
      console.log('BTC Data:', btcData);
      
      if (predData.success) {
        setPredictions(predData.predictions.filter((p: any) => p.category === 'manual'));
      }
      
      if (btcData.success && btcData.currentRound) {
        setBtcRound(btcData.currentRound);
      } else {
        setBtcRound(null);
      }
      
      if (betsRes) {
        const betsData = await betsRes.json();
        if (betsData.success) setMyBets(betsData.bets);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Example predictions for demo
  const examplePredictions = [
    {
      id: '1',
      title: 'Will Bitcoin reach $100K by end of March?',
      description: 'BTC price target before March 31, 2026',
      category: 'manual',
      totalPool: 12500,
      upPool: 8750,
      downPool: 3750,
      totalBets: 234,
      endTime: { toMillis: () => Date.now() + 7 * 24 * 60 * 60 * 1000 },
    },
    {
      id: '2',
      title: 'Will SOL be above $150 on March 10?',
      description: 'Solana price prediction',
      category: 'manual',
      totalPool: 5400,
      upPool: 3240,
      downPool: 2160,
      totalBets: 89,
      endTime: { toMillis: () => Date.now() + 5 * 24 * 60 * 60 * 1000 },
    },
  ];

  const displayPredictions = predictions.length > 0 ? predictions : examplePredictions;

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pt-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#161b22] to-[#0d1117] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Prediction Market
              </h1>
              <p className="text-gray-400">Bet on crypto outcomes and earn rewards</p>
            </div>
            
            <div className="bg-[#1a1d29] rounded-2xl px-6 py-4 border border-gray-800 flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                <Bitcoin className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400">BTC Price</p>
                <p className="text-2xl font-bold font-mono">${btcPrice.toLocaleString()}</p>
                <p className={`text-sm ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {priceChange >= 0 ? '+' : ''}{priceChange?.toFixed(2)}% (24h)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs - NO "Create a Duel" button for users */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: 'trending', label: 'Trending', icon: TrendingUp },
            { id: 'ending', label: 'Ending Soon', icon: Clock },
            { id: 'all', label: 'All Markets', icon: BarChart3 },
          ].map((tab: any) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'bg-white text-black' : 'bg-[#1a1d29] text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* BTC 5-Min Section */}
            {btcRound && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <span className="animate-pulse text-orange-500">⚡</span>
                    Live BTC 5-Minute Round
                  </h2>
                  <span className="bg-orange-500/20 text-orange-400 text-xs px-3 py-1 rounded-full border border-orange-500/30">
                    Auto-resolves every 5 min
                  </span>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <PredictionCard 
                    prediction={btcRound} 
                    onBetPlaced={fetchData}
                    variant="compact"
                  />
                </div>
              </section>
            )}

            {!btcRound && !loading && (
              <section className="bg-[#1a1d29] rounded-xl p-6 border border-gray-800">
                <div className="flex items-center gap-3 text-gray-400">
                  <Bitcoin className="w-6 h-6" />
                  <p>BTC 5-Minute rounds will appear here automatically</p>
                </div>
              </section>
            )}

            {/* Trending Predictions */}
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                Trending Predictions
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {displayPredictions.map((pred) => (
                  <PredictionCard 
                    key={pred.id} 
                    prediction={pred} 
                    onBetPlaced={fetchData}
                    variant="compact"
                  />
                ))}
              </div>
            </section>

            {/* My Bets */}
            {publicKey && myBets.length > 0 && (
              <section className="bg-[#1a1d29] rounded-2xl p-6 border border-gray-800">
                <h2 className="text-xl font-bold mb-4">My Active Bets</h2>
                <div className="space-y-3">
                  {myBets.slice(0, 5).map((bet: any) => (
                    <div 
                      key={bet.id}
                      className="flex items-center justify-between p-4 bg-[#0d1117] rounded-xl border border-gray-800"
                    >
                      <div>
                        <p className="font-semibold text-white">{bet.predictionId?.title || 'BTC Round'}</p>
                        <p className="text-sm text-gray-400">
                          You bet: <span className={bet.side === 'up' ? 'text-green-400' : 'text-red-400'}>
                            {bet.side.toUpperCase()}
                          </span> • {bet.amount} {bet.token}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        bet.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        bet.status === 'won' ? 'bg-green-500/20 text-green-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {bet.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
