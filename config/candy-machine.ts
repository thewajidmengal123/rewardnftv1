import { PublicKey } from "@solana/web3.js"

// Actual deployed Candy Machine ID
export const CANDY_MACHINE_ID = new PublicKey("AMrF3PSDh8Th7ygYbMabMzzJ6vUKJGd7xFkziSVVGqsQ")

// Collection mint ID
export const COLLECTION_MINT_ID = new PublicKey("EnEnryMh6Lcxjr8Qard3kSFHJokSxCuqcwCfGLHbmMZa")

// Company wallet address
export const COMPANY_WALLET = new PublicKey("A9GT8pYUR5F1oRwUsQ9ADeZTWq7LJMfmPQ3TZLmV6cQP")

// USDC mint address (devnet)
export const USDC_MINT_ADDRESS = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")

// Collection metadata
export const COLLECTION_METADATA = {
  name: "RewardNFT Collection",
  symbol: "RNFT",
  description: "A collection of reward NFTs for platform users",
  image: "https://quicknode.quicknode-ipfs.com/ipfs/QmWrmCfPm6L85p1o8KMc9WZCsdwsgW89n37nQMJ6UCVYNW",
  external_url: "https://your-platform.com",
  seller_fee_basis_points: 500, // 5% royalty
  attributes: [
    {
      trait_type: "Collection",
      value: "Reward NFTs",
    },
    {
      trait_type: "Rarity",
      value: "Common",
    },
  ],
}

// NFT metadata template
export const NFT_METADATA_TEMPLATE = {
  name: "Reward NFT #",
  symbol: "RNFT",
  description: "A special reward NFT for completing platform activities",
  image: "https://quicknode.quicknode-ipfs.com/ipfs/QmWrmCfPm6L85p1o8KMc9WZCsdwsgW89n37nQMJ6UCVYNW",
  external_url: "https://your-platform.com",
  seller_fee_basis_points: 500,
  attributes: [
    {
      trait_type: "Type",
      value: "Reward",
    },
    {
      trait_type: "Rarity",
      value: "Common",
    },
    {
      trait_type: "Mint Date",
      value: new Date().toISOString().split("T")[0],
    },
  ],
}

// Candy Machine configuration
export const CANDY_MACHINE_CONFIG = {
  price: 10, // 10 USDC
  candyMachine: {
    itemsAvailable: 10000,
    symbol: "RNFT",
    sellerFeeBasisPoints: 500,
    maxEditionSupply: 0,
    isMutable: true,
    retainAuthority: true,
    goLiveDate: null,
  },
  guards: {
    tokenPayment: {
      amount: 10_000_000, // 10 USDC (6 decimals)
      mint: USDC_MINT_ADDRESS,
      destinationAta: null, // Will be set to company wallet ATA
    },
    mintLimit: {
      id: 1,
      limit: 1, // 1 NFT per wallet
    },
    solPayment: {
      amount: 0.001, // Small SOL fee for bot protection
      destination: COMPANY_WALLET,
    },
  },
}

// Network configuration
export const NETWORK_CONFIG = {
  cluster: "devnet",
  rpcUrl: process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC || "https://api.devnet.solana.com",
}
