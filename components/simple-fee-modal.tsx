"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';

interface SimpleFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function SimpleFeeModal({ isOpen, onClose, onConfirm }: SimpleFeeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative max-w-md w-full mx-4 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Transaction Fee Breakdown</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
            <div className="text-2xl font-bold text-white mb-2">
              ~0.004 SOL
            </div>
            <div className="text-sm text-gray-400">
              ≈ $0.80 USD (Ultra-Optimized)
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Base Transaction:</span>
              <span className="text-white">0.000005 SOL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Account Creation:</span>
              <span className="text-white">~0.003 SOL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Compute Units:</span>
              <span className="text-white">~0.0005 SOL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Priority Fee:</span>
              <span className="text-green-400">FREE (0 SOL)</span>
            </div>
          </div>

          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
            <div className="text-green-400 font-medium mb-1">Ultra-Optimized Transaction</div>
            <div className="text-gray-300 text-xs">
              • Zero priority fees for minimum cost<br/>
              • Optimized compute unit limits<br/>
              • Smart account pre-checking<br/>
              • Typical savings: 60-80% vs standard fees
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              Proceed with Mint
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
