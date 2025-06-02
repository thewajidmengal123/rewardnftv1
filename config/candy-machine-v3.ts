import { PublicKey } from "@solana/web3.js"

// Actual deployed Candy Machine ID
export const CANDY_MACHINE_ID = new PublicKey("AMrF3PSDh8Th7ygYbMabMzzJ6vUKJGd7xFkziSVVGqsQ")

// Collection mint ID
export const COLLECTION_MINT_ID = new PublicKey("EnEnryMh6Lcxjr8Qard3kSFHJokSxCuqcwCfGLHbmMZa")

// Company wallet address
export const COMPANY_WALLET = new PublicKey("A9GT8pYUR5F1oRwUsQ9ADeZTWq7LJMfmPQ3TZLmV6cQP")

// USDC mint address (devnet) - your specific USDC-Dev
export const USDC_MINT_ADDRESS = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr")

// Collection metadata
export const COLLECTION_CONFIG = {
  name: "Reward NFT Collection",
  symbol: "RNFT",
  description: "A premium collection of reward NFTs for platform users",
  image: "https://quicknode.quicknode-ipfs.com/ipfs/QmWrmCfPm6L85p1o8KMc9WZCsdwsgW89n37nQMJ6UCVYNW",
  external_url: "https://your-platform.com",
  seller_fee_basis_points: 500, // 5% royalty
  creators: [
    {
      address: COMPANY_WALLET.toString(),
      verified: true,
      share: 100,
    },
  ],
  collection: {
    name: "Reward NFT Collection",
    family: "RewardNFTs",
  },
  attributes: [
    {
      trait_type: "Collection",
      value: "Reward NFTs",
    },
    {
      trait_type: "Rarity",
      value: "Common",
    },
    {
      trait_type: "Utility",
      value: "Platform Access",
    },
  ],
}

// NFT metadata template
export const NFT_METADATA_TEMPLATE = {
  name: "Reward NFT #{{number}}",
  symbol: "RNFT",
  description:
    "A special reward NFT for completing platform activities. This NFT grants access to exclusive features and rewards.",
  image: "https://quicknode.quicknode-ipfs.com/ipfs/QmWrmCfPm6L85p1o8KMc9WZCsdwsgW89n37nQMJ6UCVYNW",
  external_url: "https://your-platform.com/nft/{{number}}",
  seller_fee_basis_points: 500,
  creators: [
    {
      address: COMPANY_WALLET.toString(),
      verified: true,
      share: 100,
    },
  ],
  collection: {
    name: "Reward NFT Collection",
    family: "RewardNFTs",
  },
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
      value: "{{mint_date}}",
    },
    {
      trait_type: "Platform",
      value: "RewardNFT Platform",
    },
  ],
}

// Candy Machine V3 configuration
export const CANDY_MACHINE_V3_CONFIG = {
  // Basic settings
  itemsAvailable: 10000,
  symbol: "RNFT",
  maxEditionSupply: 0,
  isMutable: true,
  retainAuthority: true,

  // Pricing
  price: 10, // 10 USDC

  // Guards configuration
  guards: {
    // USDC payment guard
    tokenPayment: {
      amount: 10_000_000, // 10 USDC (6 decimals)
      mint: USDC_MINT_ADDRESS,
      destinationAta: null, // Will be set to company wallet ATA
    },

    // Mint limit per wallet
    mintLimit: {
      id: 1,
      limit: 1, // 1 NFT per wallet
    },

    // Bot protection
    solPayment: {
      amount: 0.001, // Small SOL fee for bot protection
      destination: COMPANY_WALLET,
    },

    // Start date (optional)
    startDate: {
      date: Math.floor(Date.now() / 1000), // Start immediately
    },

    // End date (optional)
    endDate: {
      date: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60, // 1 year from now
    },
  },

  // Collection settings
  collection: {
    size: 10000,
    updateAuthority: COMPANY_WALLET,
  },

  // Creator settings
  creators: [
    {
      address: COMPANY_WALLET,
      verified: true,
      share: 100,
    },
  ],
}

// Network configuration
export const NETWORK_CONFIG = {
  cluster: "devnet",
  rpcUrl: process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC || "https://api.devnet.solana.com",
  commitment: "confirmed" as const,
}

// Deployment settings
export const DEPLOYMENT_CONFIG = {
  batchSize: 10, // Number of NFTs to upload in each batch
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  confirmationTimeout: 30000, // 30 seconds
}
