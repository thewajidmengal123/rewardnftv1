// Collection mint ID provided by user
export const OFFICIAL_COLLECTION = "EnEnryMh6Lcxjr8Qard3kSFHJokSxCuqcwCfGLHbmMZa"

// Candy machine ID provided by user
export const CANDY_MACHINE_ID = "AMrF3PSDh8Th7ygYbMabMzzJ6vUKJGd7xFkziSVVGqsQ"

// Company wallet for receiving payments
export const COMPANY_WALLET = process.env.NEXT_PUBLIC_PLATFORM_WALLET_ADDRESS || "11111111111111111111111111111111"

// Version tracking
export const CONTRACT_VERSION = "1.0.0"

// Metadata
export const CONTRACT_METADATA = {
  name: "Reward NFT Platform",
  symbol: "RNFT",
  description: "Official NFT collection for the Reward NFT Platform",
  sellerFeeBasisPoints: 500, // 5%
}

// Export all as a single object for convenience
export const DEPLOYED_CONTRACTS = {
  OFFICIAL_COLLECTION,
  CANDY_MACHINE_ID,
  COMPANY_WALLET,
  CONTRACT_VERSION,
  CONTRACT_METADATA,
}
