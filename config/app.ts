// App-wide configuration using environment variables
export const APP_CONFIG = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "Reward NFT Platform",
  description: "Mint NFTs, earn rewards, and build your network on Solana",
  version: "1.0.0",
  network: process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet",

  // RPC Configuration - Only QuickNode and fallback
  rpc: {
    primary: process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.devnet.solana.com",
    fallback: "https://api.devnet.solana.com",
  },

  // Feature Flags
  features: {
    analytics: true,
    referrals: true,
    quests: true,
    leaderboard: true,
    firebase: true,
  },

  // URLs
  urls: {
    website: "https://rewardnft.app",
    docs: "https://docs.rewardnft.app",
    support: "https://support.rewardnft.app",
    github: "https://github.com/rewardnft/platform",
  },
}

export default APP_CONFIG
