"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Info, DollarSign, Zap, Database, Clock, X } from 'lucide-react';
import { PublicKey } from '@solana/web3.js';
import { SimpleNFTMintingService } from '@/services/simple-nft-minting-service';
import { useConnection } from '@solana/wallet-adapter-react';
import { JSX } from 'react/jsx-runtime';

interface FeeBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  minter: PublicKey | null;
  quantity: number;
  referrerWallet?: PublicKey;
}

interface FeeBreakdown {
  totalEstimatedSOL: number;
  totalEstimatedUSD: number;
  breakdown: {
    baseFee: number;
    accountCreation: number;
    computeUnits: number;
    priorityFee: number;
  };
  accountsNeeded: {
    userUSDC: boolean;
    treasuryUSDC: boolean;
    referrerUSDC: boolean;
  };
}

export function FeeBreakdownModal({
  isOpen,
  onClose,
  onConfirm,
  minter,
  quantity,
  referrerWallet
}: FeeBreakdownModalProps): JSX.Element | null {
  const { connection } = useConnection();
  const [feeBreakdown, setFeeBreakdown] = useState<FeeBreakdown | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && minter) {
      loadFeeBreakdown();
    }
  }, [isOpen, minter, quantity, referrerWallet]);

  const loadFeeBreakdown = async () => {
    if (!minter) return;

    setLoading(true);
    try {
      const mintingService = new SimpleNFTMintingService(connection);
      const breakdown = await mintingService.getDetailedFeeBreakdown(
        minter,
        quantity,
        referrerWallet
      );
      setFeeBreakdown(breakdown);
    } catch (error) {
      console.error('Error loading fee breakdown:', error);
      // Set fallback breakdown
      setFeeBreakdown({
        totalEstimatedSOL: 0.004 * quantity,
        totalEstimatedUSD: 0.004 * quantity * 200,
        breakdown: {
          baseFee: 0.000005 * quantity,
          accountCreation: 0.003 * quantity,
          computeUnits: 0.0005 * quantity,
          priorityFee: 0
        },
        accountsNeeded: {
          userUSDC: true,
          treasuryUSDC: true,
          referrerUSDC: !!referrerWallet
        }
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative max-w-md w-full mx-4 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-2 text-white">
            <Info className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold">Transaction Fee Breakdown</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-400">Calculating optimized fees...</p>
            </div>
          ) : feeBreakdown ? (
            <>
              {/* Total Cost Summary */}
              <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Total Network Fees</span>
                  <Badge variant="secondary" className="bg-green-900/50 text-green-400">
                    Ultra-Optimized
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-white">
                  {feeBreakdown.totalEstimatedSOL.toFixed(4)} SOL
                </div>
                <div className="text-sm text-gray-400">
                  ≈ ${feeBreakdown.totalEstimatedUSD.toFixed(2)} USD
                </div>
              </div>

              {/* Fee Breakdown */}
              <div className="space-y-3">
                <h4 className="text-white font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Fee Breakdown
                </h4>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-300">Base Transaction</span>
                    </div>
                    <span className="text-white">{feeBreakdown.breakdown.baseFee.toFixed(6)} SOL</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-purple-400" />
                      <span className="text-gray-300">Account Creation</span>
                    </div>
                    <span className="text-white">{feeBreakdown.breakdown.accountCreation.toFixed(6)} SOL</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      <span className="text-gray-300">Compute Units</span>
                    </div>
                    <span className="text-white">{feeBreakdown.breakdown.computeUnits.toFixed(6)} SOL</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-green-400" />
                      <span className="text-gray-300">Priority Fee</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white">{feeBreakdown.breakdown.priorityFee.toFixed(6)} SOL</span>
                      <Badge variant="outline" className="text-xs border-green-500 text-green-400">
                        FREE
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-700"></div>

              {/* Account Creation Info */}
              <div className="space-y-2">
                <h4 className="text-white font-medium text-sm">Accounts to Create:</h4>
                <div className="space-y-1 text-xs">
                  {feeBreakdown.accountsNeeded.userUSDC && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      Your USDC token account
                    </div>
                  )}
                  {feeBreakdown.accountsNeeded.treasuryUSDC && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      Treasury USDC account
                    </div>
                  )}
                  {feeBreakdown.accountsNeeded.referrerUSDC && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      Referrer USDC account
                    </div>
                  )}
                  {!feeBreakdown.accountsNeeded.userUSDC && 
                   !feeBreakdown.accountsNeeded.treasuryUSDC && 
                   !feeBreakdown.accountsNeeded.referrerUSDC && (
                    <div className="flex items-center gap-2 text-green-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      All accounts exist - lower fees!
                    </div>
                  )}
                </div>
              </div>

              {/* Optimization Notice */}
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-green-400 mt-0.5" />
                  <div className="text-xs">
                    <div className="text-green-400 font-medium mb-1">Ultra-Optimized Transaction</div>
                    <div className="text-gray-300">
                      • Zero priority fees for minimum cost
                      • Optimized compute unit limits
                      • Smart account pre-checking
                      • Typical savings: 60-80% vs standard fees
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
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
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
