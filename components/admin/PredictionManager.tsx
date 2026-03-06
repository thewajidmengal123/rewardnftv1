'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Trophy, 
  X, 
  Image as ImageIcon, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Clock,
  Users
} from 'lucide-react';
import { createPrediction, getAllPredictions, settlePrediction, Prediction } from '@/lib/predictions';
import { Timestamp } from 'firebase/firestore';

export default function PredictionManager() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    endTime: '',
    platformFee: 2,
  });

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    const data = await getAllPredictions();
    setPredictions(data);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endTime = new Date(formData.endTime);
      
      await createPrediction({
        title: formData.title,
        description: formData.description,
        image: formData.image || '/images/default-prediction.png',
        category: 'manual',
        status: 'active',
        startTime: new Date(),
        endTime: endTime,
        totalPool: 0,
        upPool: 0,
        downPool: 0,
        totalBets: 0,
        totalUsers: 0,
        createdBy: 'admin',
        platformFee: formData.platformFee,
      });

      alert('✅ Prediction created successfully!');
      setShowCreate(false);
      setFormData({ title: '', description: '', image: '', endTime: '', platformFee: 2 });
      fetchPredictions();
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSettle = async (predictionId: string, outcome: 'up' | 'down') => {
    if (!confirm(`Are you sure you want to settle this prediction as ${outcome.toUpperCase()}?`)) return;
    
    setLoading(true);
    try {
      await settlePrediction(predictionId, outcome, 'admin');
      alert(`✅ Prediction settled as ${outcome.toUpperCase()}`);
      fetchPredictions();
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="bg-[#1a1d29] rounded-2xl p-6 border border-gray-800">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Prediction Market Admin
          </h2>
          <p className="text-gray-400 text-sm mt-1">Create and manage prediction duels</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors"
        >
          {showCreate ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showCreate ? 'Cancel' : 'Create a Duel'}
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="mb-8 bg-[#0d1117] rounded-xl p-6 border border-gray-800 space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4">Create New Prediction</h3>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">Title</label>
            <input
              type="text"
              required
              placeholder="e.g., Will BTC reach $100K?"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-[#1a1d29] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Description</label>
            <textarea
              required
              placeholder="Describe the prediction details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-[#1a1d29] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none h-24"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Image URL
            </label>
            <input
              type="url"
              placeholder="https://example.com/image.png or /images/local.png"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full bg-[#1a1d29] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty for default image</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                End Time
              </label>
              <input
                type="datetime-local"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full bg-[#1a1d29] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Platform Fee (%)
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={formData.platformFee}
                onChange={(e) => setFormData({ ...formData, platformFee: parseInt(e.target.value) })}
                className="w-full bg-[#1a1d29] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? 'Creating...' : '🚀 Create Prediction Duel'}
          </button>
        </form>
      )}

      {/* Predictions List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4">All Predictions</h3>
        
        {predictions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No predictions created yet</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {predictions.map((pred) => (
              <div 
                key={pred.id} 
                className="bg-[#0d1117] rounded-xl p-4 border border-gray-800 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Image */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                    {pred.image ? (
                      <img 
                        src={pred.image} 
                        alt={pred.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/default-prediction.png';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-white truncate">{pred.title}</h4>
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">{pred.description}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        pred.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        pred.status === 'settled' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-700 text-gray-400'
                      }`}>
                        {pred.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 mt-3 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        Pool: ${pred.totalPool?.toLocaleString() || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        Bets: {pred.totalBets || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Ends: {formatDate(pred.endTime)}
                      </span>
                    </div>

                    {/* Settlement Buttons */}
                    {pred.status === 'active' && (
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleSettle(pred.id!, 'up')}
                          disabled={loading}
                          className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors border border-green-500/30"
                        >
                          <TrendingUp className="w-4 h-4" />
                          Settle UP
                        </button>
                        <button
                          onClick={() => handleSettle(pred.id!, 'down')}
                          disabled={loading}
                          className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/30"
                        >
                          <TrendingDown className="w-4 h-4" />
                          Settle DOWN
                        </button>
                      </div>
                    )}

                    {pred.status === 'settled' && (
                      <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                        <p className="text-sm text-blue-400">
                          Winner: <span className="font-bold">{pred.winningSide?.toUpperCase()}</span>
                          {pred.payoutCalculated && ' • Payouts distributed'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
