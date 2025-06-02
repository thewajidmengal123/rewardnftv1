"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useSecureWallet } from "@/contexts/secure-wallet-context"
import { Shield, AlertTriangle, Clock, CheckCircle, XCircle } from "lucide-react"
import { FadeIn } from "@/components/ui/animations"

export function TransactionSecurityDashboard() {
  const { transactionHistory, clearTransactionHistory } = useSecureWallet()
  const [showAll, setShowAll] = useState(false)

  // Calculate statistics
  const totalTransactions = transactionHistory.length
  const successfulTransactions = transactionHistory.filter((tx) => tx.status === "success").length
  const failedTransactions = totalTransactions - successfulTransactions

  // Get transactions to display
  const displayTransactions = showAll ? transactionHistory : transactionHistory.slice(0, 5)

  return (
    <FadeIn>
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-white flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Transaction Security
          </CardTitle>
          <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/50">
            Protected
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Total Transactions</p>
                  <p className="text-2xl font-bold text-white">{totalTransactions}</p>
                </div>
                <div className="bg-white/10 p-2 rounded-full">
                  <Clock className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Successful</p>
                  <p className="text-2xl font-bold text-green-400">{successfulTransactions}</p>
                </div>
                <div className="bg-white/10 p-2 rounded-full">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Failed/Blocked</p>
                  <p className="text-2xl font-bold text-red-400">{failedTransactions}</p>
                </div>
                <div className="bg-white/10 p-2 rounded-full">
                  <XCircle className="h-5 w-5 text-red-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <p className="text-white/80 text-sm font-medium">Recent Transactions</p>
              {transactionHistory.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => clearTransactionHistory()}>
                  Clear History
                </Button>
              )}
            </div>

            {transactionHistory.length === 0 ? (
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <p className="text-white/50">No transaction history available</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {displayTransactions.map((tx, index) => (
                  <div
                    key={index}
                    className="bg-white/5 rounded-lg p-3 flex items-center justify-between border border-white/10"
                  >
                    <div className="flex items-center">
                      {tx.status === "success" ? (
                        <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-400 mr-2" />
                      )}
                      <div>
                        <p className="text-white text-sm font-medium">
                          {tx.status === "success"
                            ? tx.signature.slice(0, 8) + "..." + tx.signature.slice(-8)
                            : "Transaction Failed"}
                        </p>
                        <p className="text-white/50 text-xs">
                          {new Date(tx.timestamp).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    {tx.status === "error" && tx.error && (
                      <div className="text-right max-w-[50%]">
                        <p className="text-red-400 text-xs truncate" title={tx.error}>
                          {tx.error.length > 30 ? tx.error.slice(0, 30) + "..." : tx.error}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {transactionHistory.length > 5 && (
            <Button
              variant="outline"
              size="sm"
              className="w-full border-white/20 text-white hover:bg-white/10"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? "Show Less" : `Show All (${transactionHistory.length})`}
            </Button>
          )}

          <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start">
              <Shield className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
              <div>
                <p className="text-white/80 text-sm font-medium">Enhanced Security Active</p>
                <p className="text-white/60 text-xs mt-1">
                  All transactions are verified for security before signing. Rate limiting and transaction verification
                  are enabled to protect your wallet.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </FadeIn>
  )
}
