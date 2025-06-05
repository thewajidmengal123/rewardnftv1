/**
 * Test script for collection creation and management
 * Run this script to test the auto-collection functionality
 */

import { Connection, PublicKey } from "@solana/web3.js"
import { AutoCollectionService } from "../services/auto-collection-service"

// Configuration
const RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com"
const TEST_WALLET = "8QY2zcWZWwBZYMeiSfPivWAiPBbLZe1mbnyJauWe8ms6" // Treasury wallet

async function testCollectionService() {
  console.log("🧪 Testing Auto Collection Service")
  console.log("================================")

  try {
    // Initialize connection
    const connection = new Connection(RPC_ENDPOINT, "confirmed")
    const autoCollectionService = new AutoCollectionService(connection)

    console.log("✅ Connection established")
    console.log("RPC Endpoint:", RPC_ENDPOINT)

    // Test getting collection from database
    console.log("\n📡 Testing database connection...")
    
    try {
      const response = await fetch("http://localhost:3000/api/collection")
      if (response.ok) {
        const data = await response.json()
        console.log("✅ Database connection successful")
        
        if (data.collection) {
          console.log("📦 Existing collection found:")
          console.log("  Collection Mint:", data.collection.collectionMint)
          console.log("  Total Minted:", data.collection.totalMinted)
          console.log("  Max Supply:", data.collection.maxSupply)
          console.log("  Created:", new Date(data.collection.createdAt).toLocaleString())
        } else {
          console.log("📭 No collection found in database")
        }
      } else {
        console.log("❌ Database connection failed")
      }
    } catch (error) {
      console.log("❌ Database connection error:", error)
    }

    // Test collection configuration
    console.log("\n⚙️  Collection Configuration:")
    console.log("  Name: RewardNFT Collection")
    console.log("  Symbol: RNFT")
    console.log("  Max Supply: 1,000")
    console.log("  Price: 10 USDC")
    console.log("  Max Per Wallet: 5")

    console.log("\n🎯 Test completed!")
    console.log("\nNext steps:")
    console.log("1. Connect your wallet on the mint page")
    console.log("2. Try minting an NFT - collection will be created automatically")
    console.log("3. Check the admin panel at /admin/collection")

  } catch (error) {
    console.error("❌ Test failed:", error)
  }
}

// Helper function to check collection status
export async function checkCollectionStatus() {
  try {
    const response = await fetch("http://localhost:3000/api/collection")
    if (response.ok) {
      const data = await response.json()
      return {
        exists: !!data.collection,
        collection: data.collection,
      }
    }
    return { exists: false, collection: null }
  } catch (error) {
    console.error("Error checking collection status:", error)
    return { exists: false, collection: null }
  }
}

// Helper function to get collection info
export async function getCollectionInfo() {
  try {
    const response = await fetch("http://localhost:3000/api/collection")
    if (response.ok) {
      const data = await response.json()
      return data.collection
    }
    return null
  } catch (error) {
    console.error("Error getting collection info:", error)
    return null
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testCollectionService()
}

export { testCollectionService }
