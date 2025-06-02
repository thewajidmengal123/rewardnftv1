import { PublicKey } from "@solana/web3.js"

/** COLLECTION CONFIGURATION **/
export const OFFICIAL_COLLECTION = "EnEnryMh6Lcxjr8Qard3kSFHJokSxCuqcwCfGLHbmMZa"

/** CANDY MACHINE CONFIGURATION **/
export const CANDY_MACHINE_ID = "AMrF3PSDh8Th7ygYbMabMzzJ6vUKJGd7xFkziSVVGqsQ"

/** NETWORK CONFIGURATION **/
export type SolanaNetwork = "mainnet-beta" | "devnet" | "testnet"

// Use environment variable or default to devnet
export const CURRENT_NETWORK: SolanaNetwork = (process.env.NEXT_PUBLIC_SOLANA_NETWORK as SolanaNetwork) || "devnet"

// RPC Endpoints with environment variable support
export const SOLANA_RPC_ENDPOINTS = {
  "mainnet-beta": process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC || "https://api.mainnet-beta.solana.com",
  devnet: process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC || "https://api.devnet.solana.com",
  testnet: process.env.NEXT_PUBLIC_SOLANA_TESTNET_RPC || "https://api.testnet.solana.com",
}

// Use custom RPC endpoint if provided, otherwise use network-specific endpoint
export const DEFAULT_RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_RPC_ENDPOINT || process.env.NEXT_PUBLIC_SOLANA_RPC || SOLANA_RPC_ENDPOINTS[CURRENT_NETWORK]

/** EXPLORER CONFIGURATION **/
export const SOLANA_EXPLORER_URLS = {
  "mainnet-beta": "https://explorer.solana.com",
  devnet: "https://explorer.solana.com?cluster=devnet",
  testnet: "https://explorer.solana.com?cluster=testnet",
}

export const DEFAULT_SOLANA_EXPLORER_URL =
  process.env.NEXT_PUBLIC_SOLANA_EXPLORER_URL || SOLANA_EXPLORER_URLS[CURRENT_NETWORK]

/** TOKEN ADDRESSES **/
// USDC mint addresses for different networks
export const USDC_TOKEN_ADDRESS = {
  "mainnet-beta": new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
  devnet: new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"),
  testnet: new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"),
}

export const getCurrentUSDCAddress = (): PublicKey => {
  return USDC_TOKEN_ADDRESS[CURRENT_NETWORK]
}

export const DEFAULT_USDC_TOKEN_ADDRESS = getCurrentUSDCAddress()

/** PLATFORM SETTINGS **/
export const PLATFORM_WALLET_ADDRESS = new PublicKey(
  process.env.NEXT_PUBLIC_PLATFORM_WALLET_ADDRESS || "A9GT8pYUR5F1oRwUsQ9ADeZTWq7LJMfmPQ3TZLmV6cQP",
)

export const NFT_MINT_COST_USDC = 10

/** NFT METADATA **/
export const NFT_CID = "QmWrmCfPm6L85p1o8KMc9WZCsdwsgW89n37nQMJ6UCVYNW"

export const NFT_IPFS_URLS = {
  quicknode: `https://quicknode.quicknode-ipfs.com/ipfs/${NFT_CID}`,
  gateway: `https://ipfs.io/ipfs/${NFT_CID}`,
}

export const NFT_METADATA = {
  name: "RewardNFT Mint Pass",
  symbol: "RNFT",
  description: "Mint and earn with RewardNFT. This is your gateway to quests, referrals, and rewards.",
  image: NFT_IPFS_URLS.quicknode,
  external_url: "https://reward-nft-platform.vercel.app",
  attributes: [
    { trait_type: "Collection", value: "Solana Rewards" },
    { trait_type: "Rarity", value: "Legendary" },
    { trait_type: "Type", value: "Membership" },
    { trait_type: "Network", value: CURRENT_NETWORK },
    { trait_type: "CID", value: NFT_CID },
  ],
  properties: {
    files: [
      {
        uri: NFT_IPFS_URLS.quicknode,
        type: "image/png",
      },
    ],
    category: "image",
    creators: [
      {
        address: PLATFORM_WALLET_ADDRESS.toString(),
        share: 100,
      },
    ],
  },
}

/** TRANSACTION CONFIRMATION **/
export const CONFIRMATION_SETTINGS = {
  maxRetries: 30,
  retryInterval: 2000, // in ms
}

/** DEBUG INFO **/
export const getNetworkInfo = () => ({
  currentNetwork: CURRENT_NETWORK,
  rpcEndpoint: DEFAULT_RPC_ENDPOINT,
  usdcAddress: getCurrentUSDCAddress().toString(),
  platformWallet: PLATFORM_WALLET_ADDRESS.toString(),
  explorerUrl: DEFAULT_SOLANA_EXPLORER_URL,
  nftPrice: NFT_MINT_COST_USDC,
  collectionMint: OFFICIAL_COLLECTION,
  candyMachineId: CANDY_MACHINE_ID,
  nftCid: NFT_CID,
  nftImageUrl: NFT_IPFS_URLS.quicknode,
})

/** HELPER FUNCTIONS **/
export const getExplorerUrl = (address: string, type: "address" | "tx" = "address") => {
  const baseUrl = DEFAULT_SOLANA_EXPLORER_URL
  const cluster = CURRENT_NETWORK !== "mainnet-beta" ? `?cluster=${CURRENT_NETWORK}` : ""
  return `${baseUrl}/${type}/${address}${cluster}`
}

export const isMainnet = () => CURRENT_NETWORK === "mainnet-beta"
export const isDevnet = () => CURRENT_NETWORK === "devnet"
export const isTestnet = () => CURRENT_NETWORK === "testnet"
