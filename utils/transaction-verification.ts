import type { Transaction, VersionedTransaction } from "@solana/web3.js"
import { toast } from "@/components/ui/use-toast"

// Interface for transaction verification options
export interface TransactionVerificationOptions {
  maxFeeLimit?: number // Maximum fee in lamports
  allowedProgramIds?: string[] // List of allowed program IDs
  allowedDestinations?: string[] // List of allowed destination addresses
  requireRecentBlockhash?: boolean // Require recent blockhash
  maxInstructions?: number // Maximum number of instructions
  requireSignature?: boolean // Require signature
}

// Default verification options
const defaultOptions: TransactionVerificationOptions = {
  maxFeeLimit: 100000, // 0.0001 SOL
  requireRecentBlockhash: true,
  maxInstructions: 10,
  requireSignature: true,
}

// Verify transaction before signing
export function verifyTransaction(
  transaction: Transaction | VersionedTransaction,
  options: TransactionVerificationOptions = {},
): { isValid: boolean; reason?: string } {
  const opts = { ...defaultOptions, ...options }

  // Check if transaction is a legacy transaction
  const isLegacyTransaction = "instructions" in transaction

  try {
    // Check if transaction has a recent blockhash
    if (opts.requireRecentBlockhash && isLegacyTransaction && !transaction.recentBlockhash) {
      return { isValid: false, reason: "Transaction does not have a recent blockhash" }
    }

    // Check if transaction has too many instructions
    if (isLegacyTransaction && opts.maxInstructions && transaction.instructions.length > opts.maxInstructions) {
      return {
        isValid: false,
        reason: `Transaction has too many instructions (${transaction.instructions.length} > ${opts.maxInstructions})`,
      }
    }

    // Check if transaction is using allowed program IDs
    if (isLegacyTransaction && opts.allowedProgramIds && opts.allowedProgramIds.length > 0) {
      for (const instruction of transaction.instructions) {
        const programId = instruction.programId.toString()
        if (!opts.allowedProgramIds.includes(programId)) {
          return { isValid: false, reason: `Transaction uses unauthorized program: ${programId}` }
        }
      }
    }

    // Check if transaction is sending to allowed destinations
    if (isLegacyTransaction && opts.allowedDestinations && opts.allowedDestinations.length > 0) {
      for (const instruction of transaction.instructions) {
        for (const key of instruction.keys) {
          if (key.isWritable) {
            const address = key.pubkey.toString()
            if (!opts.allowedDestinations.includes(address)) {
              return { isValid: false, reason: `Transaction sends to unauthorized address: ${address}` }
            }
          }
        }
      }
    }

    // All checks passed
    return { isValid: true }
  } catch (error) {
    console.error("Error verifying transaction:", error)
    return { isValid: false, reason: "Error verifying transaction" }
  }
}

// Secure transaction signing with verification
export async function secureSignTransaction<T extends Transaction | VersionedTransaction>(
  transaction: T,
  signTransaction: (transaction: T) => Promise<T>,
  options: TransactionVerificationOptions = {},
): Promise<T> {
  // Verify transaction
  const verification = verifyTransaction(transaction, options)

  if (!verification.isValid) {
    toast({
      title: "Transaction Rejected",
      description: verification.reason || "Transaction failed security verification",
      variant: "destructive",
    })
    throw new Error(verification.reason || "Transaction failed security verification")
  }

  // Sign transaction
  return signTransaction(transaction)
}

// Rate limiting for wallet operations
const operationTimestamps: Record<string, number[]> = {}

export function checkRateLimit(operation: string, maxOperations: number, timeWindowMs: number): boolean {
  const now = Date.now()

  if (!operationTimestamps[operation]) {
    operationTimestamps[operation] = []
  }

  // Remove timestamps outside the time window
  operationTimestamps[operation] = operationTimestamps[operation].filter((timestamp) => now - timestamp < timeWindowMs)

  // Check if rate limit is exceeded
  if (operationTimestamps[operation].length >= maxOperations) {
    return false
  }

  // Add current timestamp
  operationTimestamps[operation].push(now)
  return true
}
