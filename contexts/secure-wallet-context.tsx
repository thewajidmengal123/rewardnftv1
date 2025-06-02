"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Transaction } from "@solana/web3.js"
import { useWallet } from "@/contexts/wallet-context"
import {
  secureSignTransaction,
  checkRateLimit,
  type TransactionVerificationOptions,
} from "@/utils/transaction-verification"
import { toast } from "@/components/ui/use-toast"

// Interface for secure wallet context
interface SecureWalletContextType {
  secureSignAndSendTransaction: (transaction: Transaction, options?: TransactionVerificationOptions) => Promise<string>
  isRateLimited: boolean
  transactionHistory: Array<{
    signature: string
    timestamp: number
    status: "success" | "error"
    error?: string
  }>
  clearTransactionHistory: () => void
}

// Create context
const SecureWalletContext = createContext<SecureWalletContextType>({
  secureSignAndSendTransaction: async () => "",
  isRateLimited: false,
  transactionHistory: [],
  clearTransactionHistory: () => {},
})

// Hook to use secure wallet context
export const useSecureWallet = () => useContext(SecureWalletContext)

// Provider props
interface SecureWalletProviderProps {
  children: ReactNode
  maxTransactionsPerMinute?: number
}

// Provider component
export function SecureWalletProvider({ children, maxTransactionsPerMinute = 5 }: SecureWalletProviderProps) {
  const { connected, publicKey, connection, signAndSendTransaction } = useWallet()
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [transactionHistory, setTransactionHistory] = useState<
    Array<{
      signature: string
      timestamp: number
      status: "success" | "error"
      error?: string
    }>
  >([])

  // Reset rate limit status after 1 minute
  useEffect(() => {
    if (isRateLimited) {
      const timer = setTimeout(() => {
        setIsRateLimited(false)
      }, 60000)
      return () => clearTimeout(timer)
    }
  }, [isRateLimited])

  // Secure sign and send transaction
  const secureSignAndSendTransaction = async (
    transaction: Transaction,
    options?: TransactionVerificationOptions,
  ): Promise<string> => {
    if (!connected || !publicKey) {
      throw new Error("Wallet not connected")
    }

    // Check rate limit
    const isWithinRateLimit = checkRateLimit("transaction", maxTransactionsPerMinute, 60000)
    if (!isWithinRateLimit) {
      setIsRateLimited(true)
      const error = `Rate limit exceeded. Maximum ${maxTransactionsPerMinute} transactions per minute.`
      toast({
        title: "Transaction Rejected",
        description: error,
        variant: "destructive",
      })
      throw new Error(error)
    }

    try {
      // Secure sign transaction
      const signedTransaction = await secureSignTransaction(
        transaction,
        async (tx) => {
          // This is where the wallet would normally sign the transaction
          return signAndSendTransaction(tx)
        },
        options,
      )

      // Add to transaction history
      setTransactionHistory((prev) => [
        {
          signature: signedTransaction,
          timestamp: Date.now(),
          status: "success",
        },
        ...prev,
      ])

      return signedTransaction
    } catch (error: any) {
      // Add failed transaction to history
      setTransactionHistory((prev) => [
        {
          signature: "failed",
          timestamp: Date.now(),
          status: "error",
          error: error.message,
        },
        ...prev,
      ])

      throw error
    }
  }

  // Clear transaction history
  const clearTransactionHistory = () => {
    setTransactionHistory([])
  }

  const value = {
    secureSignAndSendTransaction,
    isRateLimited,
    transactionHistory,
    clearTransactionHistory,
  }

  return <SecureWalletContext.Provider value={value}>{children}</SecureWalletContext.Provider>
}
