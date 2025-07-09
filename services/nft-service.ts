import { PublicKey, Connection } from "@solana/web3.js"
import { Metaplex } from "@metaplex-foundation/js"
import { OFFICIAL_COLLECTION } from "@/config/deployed-contracts"

export interface NFT {
  mint: string
  name: string
  image: string
  attributes: Array<{ trait_type: string; value: string }>
  collection?: string
  owner?: string
}

class NFTService {
  private connection: Connection
  private metaplex: Metaplex

  constructor() {
    // Initialize with default connection - will be updated when used
    this.connection = new Connection(process.env.NEXT_PUBLIC_RPC_ENDPOINT || "https://api.mainnet-beta.solana.com")
    this.metaplex = new Metaplex(this.connection)
  }

  setConnection(connection: Connection) {
    this.connection = connection
    this.metaplex = new Metaplex(connection)
  }

  async getNFTsByOwner(owner: string | PublicKey): Promise<NFT[]> {
    try {
      const ownerPublicKey = typeof owner === "string" ? new PublicKey(owner) : owner

      console.log(`Fetching NFTs for owner: ${ownerPublicKey.toString()}`)

      const nfts = await this.metaplex.nfts().findAllByOwner({ owner: ownerPublicKey })

      console.log(`Found ${nfts.length} NFTs for owner`)

      return nfts.map((nft) => ({
        mint: nft.address.toString(),
        name: nft.name,
        image: nft.json?.image || "/placeholder.svg",
        attributes: (nft.json?.attributes || []).map(attr => ({
          trait_type: attr.trait_type || "",
          value: attr.value || ""
        })),
        collection: nft.collection?.address?.toString(),
        owner: ownerPublicKey.toString(),
      }))
    } catch (error) {
      console.error("Error fetching NFTs by owner:", error)
      return []
    }
  }

  async getNFTsByCollection(collectionId: string = OFFICIAL_COLLECTION): Promise<NFT[]> {
    try {
      const collectionPublicKey = new PublicKey(collectionId)

      console.log(`Fetching NFTs for collection: ${collectionId}`)

      const nfts = await this.metaplex.nfts().findAllByCreator({ creator: collectionPublicKey })

      console.log(`Found ${nfts.length} NFTs in collection`)

      return nfts.map((nft) => ({
        mint: nft.address.toString(),
        name: nft.name,
        image: nft.json?.image || "/placeholder.svg",
        attributes: (nft.json?.attributes || []).map(attr => ({
          trait_type: attr.trait_type || "",
          value: attr.value || ""
        })),
        collection: collectionId,
      }))
    } catch (error) {
      console.error("Error fetching NFTs by collection:", error)
      return []
    }
  }

  async getNFTByMint(mintAddress: string): Promise<NFT | null> {
    try {
      const mintPublicKey = new PublicKey(mintAddress)

      console.log(`Fetching NFT for mint: ${mintAddress}`)

      const nft = await this.metaplex.nfts().findByMint({ mintAddress: mintPublicKey })

      return {
        mint: nft.address.toString(),
        name: nft.name,
        image: nft.json?.image || "/placeholder.svg",
        attributes: (nft.json?.attributes || []).map(attr => ({
          trait_type: attr.trait_type || "",
          value: attr.value || ""
        })),
        collection: nft.collection?.address?.toString(),
      }
    } catch (error) {
      console.error("Error fetching NFT by mint:", error)
      return null
    }
  }

  async isNFTFromCollection(mintAddress: string, collectionId: string = OFFICIAL_COLLECTION): Promise<boolean> {
    try {
      const nft = await this.getNFTByMint(mintAddress)
      return nft?.collection === collectionId
    } catch (error) {
      console.error("Error checking if NFT is from collection:", error)
      return false
    }
  }

  async hasUserMinted(userAddress: PublicKey, collectionId: string = OFFICIAL_COLLECTION): Promise<boolean> {
    try {
      const userNFTs = await this.getNFTsByOwner(userAddress)
      return userNFTs.some(nft => nft.collection === collectionId)
    } catch (error) {
      console.error("Error checking if user has minted:", error)
      return false
    }
  }
}

// Create a singleton instance
const nftService = new NFTService()

// Export both the class and the instance as default
export default nftService
export { NFTService }
