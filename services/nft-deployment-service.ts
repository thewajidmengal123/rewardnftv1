import { type Connection, PublicKey, type Transaction } from "@solana/web3.js"
import { CollectionService } from "./collection-service"
import { CandyMachineService } from "./candy-machine-service"
import { enhancedRPCService } from "./enhanced-rpc-service"

export interface DeploymentResult {
  success: boolean
  collectionMint?: string
  candyMachine?: string
  signatures?: string[]
  error?: string
}

export interface DeploymentProgress {
  step: "collection" | "candy-machine" | "configuration" | "complete"
  message: string
  progress: number
}

export class NFTDeploymentService {
  private connection: Connection
  private collectionService: CollectionService
  private candyMachineService: CandyMachineService

  constructor(connection?: Connection) {
    this.connection = connection || enhancedRPCService.getConnection()
    this.collectionService = new CollectionService(this.connection)
    this.candyMachineService = new CandyMachineService(this.connection)
  }

  // Deploy complete NFT system
  async deployNFTSystem(
    authority: PublicKey,
    signTransaction: (transaction: Transaction) => Promise<Transaction>,
    onProgress?: (progress: DeploymentProgress) => void,
  ): Promise<DeploymentResult> {
    const signatures: string[] = []

    try {
      // Step 1: Create Collection
      onProgress?.({
        step: "collection",
        message: "Creating collection NFT...",
        progress: 25,
      })

      const collectionResult = await this.collectionService.createCollection(authority, signTransaction)

      if (!collectionResult.success || !collectionResult.collectionMint) {
        return {
          success: false,
          error: collectionResult.error || "Failed to create collection",
        }
      }

      if (collectionResult.signature) {
        signatures.push(collectionResult.signature)
      }

      // Step 2: Create Candy Machine
      onProgress?.({
        step: "candy-machine",
        message: "Deploying Candy Machine V3...",
        progress: 75,
      })

      const candyMachineResult = await this.candyMachineService.createCandyMachine(
        authority,
        new PublicKey(collectionResult.collectionMint),
        signTransaction,
      )

      if (!candyMachineResult.success || !candyMachineResult.candyMachine) {
        return {
          success: false,
          error: candyMachineResult.error || "Failed to create Candy Machine",
          collectionMint: collectionResult.collectionMint,
          signatures,
        }
      }

      if (candyMachineResult.signature) {
        signatures.push(candyMachineResult.signature)
      }

      // Step 3: Complete
      onProgress?.({
        step: "complete",
        message: "NFT system deployed successfully!",
        progress: 100,
      })

      return {
        success: true,
        collectionMint: collectionResult.collectionMint,
        candyMachine: candyMachineResult.candyMachine,
        signatures,
      }
    } catch (error: any) {
      console.error("Deployment error:", error)
      return {
        success: false,
        error: error.message || "Failed to deploy NFT system",
        signatures,
      }
    }
  }

  // Quick deploy for testing
  async quickDeploy(
    authority: PublicKey,
    signTransaction: (transaction: Transaction) => Promise<Transaction>,
  ): Promise<DeploymentResult> {
    console.log("🚀 Starting quick NFT deployment...")

    return await this.deployNFTSystem(authority, signTransaction, (progress) => {
      console.log(`📦 ${progress.message} (${progress.progress}%)`)
    })
  }
}
