// Admin configuration
export const ADMIN_CONFIG = {
  // Admin wallet address
  ADMIN_WALLET: "6nHPbBNxh31qpKfLrs3WzzDGkDjmQYQGuVsh9qB7VLBQ",
  // ADMIN_WALLET: "9gQMg6z6A3FroStYWc6BVYVNBnk8XyrsDjoimxJTCEKr",
  
  // Admin permissions
  PERMISSIONS: {
    VIEW_ALL_USERS: true,
    VIEW_TRANSACTIONS: true,
    VIEW_NFT_MINTS: true,
    VIEW_REFERRALS: true,
    MANAGE_AIRDROPS: true,
    EXPORT_DATA: true,
    SYSTEM_MAINTENANCE: true,
  },
  
  // Admin dashboard features
  FEATURES: {
    USER_MANAGEMENT: true,
    TRANSACTION_MONITORING: true,
    NFT_ANALYTICS: true,
    REFERRAL_ANALYTICS: true,
    REVENUE_TRACKING: true,
    SYSTEM_HEALTH: true,
  }
}

// Helper function to check if a wallet is admin
export function isAdminWallet(walletAddress: string | null | undefined): boolean {
  if (!walletAddress) return false
  return walletAddress === ADMIN_CONFIG.ADMIN_WALLET
}

// Admin access levels
export enum AdminAccessLevel {
  NONE = 0,
  READ_ONLY = 1,
  FULL_ACCESS = 2,
}

// Get admin access level for a wallet
export function getAdminAccessLevel(walletAddress: string | null | undefined): AdminAccessLevel {
  if (isAdminWallet(walletAddress)) {
    return AdminAccessLevel.FULL_ACCESS
  }
  return AdminAccessLevel.NONE
}
