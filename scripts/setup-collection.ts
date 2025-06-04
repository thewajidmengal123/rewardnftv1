/**
 * Collection Setup Script
 * 
 * This script helps you create the NFT collection for your project.
 * Run this once to deploy the collection, then update your environment variables.
 */

import { Connection, PublicKey, Keypair } from "@solana/web3.js"
import { CollectionNFTService, COLLECTION_CONFIG } from "@/services/collection-nft-service"

// Configuration
const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet"
const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com"

async function setupCollection() {
  console.log("🚀 Setting up NFT Collection...")
  console.log(`Network: ${NETWORK}`)
  console.log(`RPC URL: ${RPC_URL}`)

  // Initialize connection
  const connection = new Connection(RPC_URL, "confirmed")
  const nftService = new CollectionNFTService(connection)

  console.log("\n📋 Collection Configuration:")
  console.log(`Name: ${COLLECTION_CONFIG.name}`)
  console.log(`Symbol: ${COLLECTION_CONFIG.symbol}`)
  console.log(`Description: ${COLLECTION_CONFIG.description}`)
  console.log(`Max Supply: 1000 NFTs`)
  console.log(`Price: 10 USDC per NFT`)
  console.log(`Max per Wallet: 5 NFTs`)

  console.log("\n💰 Referral Configuration:")
  console.log("- With Referrer: 6 USDC to treasury, 4 USDC to referrer")
  console.log("- Without Referrer: 10 USDC to treasury")

  console.log("\n⚠️  IMPORTANT SETUP STEPS:")
  console.log("1. Make sure you have a wallet with SOL for transaction fees")
  console.log("2. Connect your wallet to the application")
  console.log("3. Use the collection creation function in your admin panel")
  console.log("4. Save the collection mint address to your environment variables")

  console.log("\n🔧 Environment Variables to Set:")
  console.log("NEXT_PUBLIC_COLLECTION_MINT_ADDRESS=<your_collection_mint_address>")

  console.log("\n📝 Next Steps:")
  console.log("1. Go to your mint page")
  console.log("2. Connect your admin wallet")
  console.log("3. Create the collection (one-time setup)")
  console.log("4. Update the collection mint address in your code")
  console.log("5. Test minting with referral codes")

  console.log("\n✅ Setup guide complete!")
}

// Helper function to validate collection setup
export async function validateCollectionSetup(connection: Connection, collectionMint: PublicKey) {
  try {
    console.log("🔍 Validating collection setup...")
    
    // Check if collection mint exists
    const accountInfo = await connection.getAccountInfo(collectionMint)
    if (!accountInfo) {
      throw new Error("Collection mint account not found")
    }

    console.log("✅ Collection mint account exists")
    console.log(`Collection Mint: ${collectionMint.toString()}`)

    // TODO: Add more validation checks
    // - Check metadata account
    // - Verify collection authority
    // - Check master edition

    return {
      success: true,
      collectionMint: collectionMint.toString(),
    }
  } catch (error) {
    console.error("❌ Collection validation failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Helper function to get collection info
export async function getCollectionInfo(connection: Connection, collectionMint: PublicKey) {
  try {
    const nftService = new CollectionNFTService(connection)
    nftService.setCollectionMint(collectionMint)

    const supplyInfo = await nftService.getSupplyInfo()
    
    return {
      success: true,
      collectionMint: collectionMint.toString(),
      supplyInfo,
      config: {
        name: COLLECTION_CONFIG.name,
        symbol: COLLECTION_CONFIG.symbol,
        maxSupply: 1000,
        pricePerNFT: 10,
        maxPerWallet: 5,
      }
    }
  } catch (error) {
    console.error("Error getting collection info:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  setupCollection().catch(console.error)
}

export { setupCollection }
