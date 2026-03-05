'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/wallet-context';
import { Plus, X, Check, Clock, DollarSign, Users } from 'lucide-react';

export default function PredictionManager() {
  const { publicKey, connected } = useWallet();
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    platformFee: 2,
  });

  const ADMIN_WALLET = '6nHPbBNxh31qpKfLrs3WzzDGkDjmQYQGuVsh9qB7VLBQ';
  const isAdmin = connected && publicKey?.toString() === ADMIN_WALLET;

  useEffect(() => {
    if (isAdmin) {
      fetchPredictions();
    }
  }, [isAdmin]);

  const fetchPredictions = async () => {
    try {
      const res = await fetch('/api/predictions?status=all');
      const data = await res.json();
      if (data.success) setPredictions(data.predictions);
    } catch (error) {
      console.error('Fetch predictions error:', error);
    }
  };

  const createPrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Admin only!');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          category: 'manual',
          adminWallet: publicKey?.toString(),
        }),
      });
      
      if (res.ok) {
        alert('✅ Prediction created successfully!');
        setShowCreate(false);
        setFormData({ title: '', description: '', startTime: '', endTime: '', platformFee: 2 });
        fetchPredictions();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create');
      }
    } catch (error) {
      alert('❌ Error creating prediction');
    } finally {
      setLoading(false);
    }
  };

  const settlePrediction = async (id: string, outcome: 'up' | 'down') => {
    if (!confirm(`Settle as ${outcome.toUpperCase()}?`)) return;
    
    const res = await fetch('/api/predictions/settle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        predictionId: id,
        outcome,
        adminWallet: publicKey?.toString(),
      }),
    });
    
    if (res.ok) {
      alert('✅ Settled!');
      fetchPredictions();
    }
  };

  const triggerAutoSettle = async () => {
    const res = await fetch('/api/predictions/settle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auto: true }),
    });
    
    const data = await res.json();
    if (data.success) {
      alert(`✅ Auto-settled ${data.settled} rounds`);
      fetchPredictions();
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-red-400 bg-red-500/10 rounded-2xl border border-red-500/20">
        <p className="text-lg font-bold">⚠️ Admin Access Required</p>
        <p className="text-sm mt-2">Connect admin wallet to manage predictions</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-[#1a1d29] p-6 rounded-2xl border border-gray-800">
        <div>
          <h2 className="text-2xl font-bold text-white">🎯 Prediction Market Admin</h2>
          <p className="text-gray-400 text-sm mt-1">Create and manage prediction markets</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={triggerAutoSettle}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 border border-orange-500/30"
          >
            <Clock className="w-4 h-4" />
            Auto-Settle BTC
          </button>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold"
          >
            {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showCreate ? 'Cancel' : 'Create Market'}
          </button>
        </div>
      </div>

      {showCreate && (
        <form onSubmit={createPrediction} className="bg-[#1a1d29] p-6 rounded-2xl border border-gray-800 space-y-4">
          <h3 className="text-lg font-bold text-white mb-4">Create New Prediction Market</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-gray-400 text-sm mb-2">Prediction Title</label>
              <input
                type="text"
                required
                placeholder="e.g., Will SOL reach $150 by March 10?"
                className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-gray-400 text-sm mb-2">Description</label>
              <textarea
                required
                rows={3}
                placeholder="Detailed description of the prediction..."
                className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">Start Time</label>
              <input
                type="datetime-local"
                required
                className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                value={formData.startTime}
                onChange={(e) => setFormData({...formData, startTime: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">End Time</label>
              <input
                type="datetime-local"
                required
                className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                value={formData.endTime}
                onChange={(e) => setFormData({...formData, endTime: e.target.value})}
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg"
          >
            {loading ? 'Creating...' : 'Create Prediction Market'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        <h3 className="text-lg font-bold text-white mb-4">All Markets</h3>
        {predictions.length === 0 ? (
          <div className="text-center py-12 bg-[#1a1d29] rounded-2xl border border-gray-800">
            <p className="text-gray-500">No predictions created yet</p>
          </div>
        ) : (
          predictions.map((pred) => (
            <div key={pred.id} className="bg-[#1a1d29] p-5 rounded-xl border border-gray-800">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      pred.category === 'btc-5min' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {pred.category === 'btc-5min' ? '⚡ BTC 5-Min' : '📊 Manual'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      pred.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {pred.status?.toUpperCase()}
                    </span>
                  </div>
                  
                  <h4 className="text-lg font-semibold text-white mb-1">{pred.title}</h4>
                  <p className="text-gray-400 text-sm mb-3">{pred.description}</p>
                  
                  <div className="flex gap-4 text-sm">
                    <span className="text-gray-500">Pool: <span className="text-white font-semibold">${pred.totalPool?.toLocaleString() || 0}</span></span>
                    <span className="text-gray-500">Bets: <span className="text-white font-semibold">{pred.totalBets || 0}</span></span>
                  </div>
                </div>
                
                {pred.status === 'active' && pred.category === 'manual' && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => settlePrediction(pred.id, 'up')}
                      className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 border border-green-500/30 font-semibold"
                    >
                      <Check className="w-4 h-4 inline mr-1" />
                      UP Wins
                    </button>
                    <button
                      onClick={() => settlePrediction(pred.id, 'down')}
                      className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 border border-red-500/30 font-semibold"
                    >
                      <X className="w-4 h-4 inline mr-1" />
                      DOWN Wins
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
