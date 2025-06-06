# Backend Data Maintenance System

## Overview

The backend now maintains a comprehensive system to track users, their referrals, and earnings across multiple Firebase collections. This ensures data consistency for both the leaderboard and referral pages.

## Data Structure

### Users Collection (`users`)
Each user document contains:
```typescript
interface UserProfile {
  id: string                    // Wallet address
  walletAddress: string
  displayName?: string
  referralCode: string          // Unique referral code
  referredBy?: string          // Who referred this user
  totalReferrals: number       // Count of users they referred
  totalEarned: number          // Total USDC earned from referrals
  nftsMinted: number           // Number of NFTs minted
  nftAddresses: string[]       // Array of minted NFT addresses
  createdAt: Timestamp
  lastActive: Timestamp
  // ... other fields
}
```

### Referrals Collection (`referrals`)
Each referral document tracks:
```typescript
interface ReferralRecord {
  id: string
  referrerWallet: string       // Who made the referral
  referredWallet: string       // Who was referred
  referralCode: string         // Code used
  status: "pending" | "completed" | "rewarded"
  nftMinted: boolean          // Has referred user minted NFT?
  rewardPaid: boolean         // Has referrer been paid?
  rewardAmount: number        // Amount earned (4 USDC)
  createdAt: Timestamp
  completedAt?: Timestamp     // When NFT was minted
  rewardedAt?: Timestamp      // When reward was paid
}
```

## Key Services

### 1. FirebaseUserService
- **Purpose**: Manages user profiles and basic operations
- **Key Methods**:
  - `createOrUpdateUser()` - Create/update user profile
  - `getUserByWallet()` - Get user by wallet address
  - `getUsersByReferrals()` - Get users sorted by referral count
  - `getUsersByEarnings()` - Get users sorted by earnings
  - `syncUserReferralData()` - Sync user data with actual referral records
  - `getUserReferredList()` - Get list of users referred by a wallet

### 2. FirebaseReferralService
- **Purpose**: Manages referral tracking and rewards
- **Key Methods**:
  - `trackReferral()` - Track new referral
  - `completeReferral()` - Mark referral as completed when NFT minted
  - `processReferralReward()` - Process reward payment
  - `getReferralStats()` - Get comprehensive referral statistics
  - `getReferralHistory()` - Get referral history with user details

### 3. FirebaseDataMaintenance
- **Purpose**: Ensures data consistency across collections
- **Key Methods**:
  - `syncUserData()` - Comprehensive sync for single user
  - `batchSyncUsers()` - Sync multiple users
  - `validateDataConsistency()` - Check for inconsistencies
  - `fixAllInconsistencies()` - Auto-fix data problems
  - `getUserDisplayData()` - Get complete user data for display

## API Endpoints

### User Referrals API (`/api/users/referrals`)
- **GET**: Get comprehensive user referral data
  - Returns: user profile, stats, history, referred users list
- **POST**: Update user data, sync, or get referral links

### Admin Data Maintenance API (`/api/admin/data-maintenance`)
- **GET**: Health checks, validation, user data retrieval
- **POST**: Sync operations, consistency fixes, batch operations

### Admin Sync Users API (`/api/admin/sync-users`)
- **GET**: Get leaderboard data, user lists, statistics
- **POST**: Sync single/multiple users, validate consistency

## Data Flow

### When User Mints NFT:
1. NFT minting service processes payment and creates NFT
2. `processNFTMintCompletion()` is called
3. User's NFT count is incremented
4. If user was referred, referral is marked as completed
5. Referrer receives 4 USDC reward
6. Both user and referrer data is synced
7. Leaderboard positions are updated

### When User Makes Referral:
1. `trackReferral()` creates referral record with "pending" status
2. Referrer's `totalReferrals` count is incremented
3. Referred user's `referredBy` field is set
4. When referred user mints NFT, referral becomes "completed"
5. Referrer receives reward and referral becomes "rewarded"

## Data Consistency

### Automatic Sync Points:
- After NFT minting completion
- After referral reward processing
- During leaderboard updates

### Manual Sync Options:
- Single user sync via API
- Batch sync for multiple users
- Full validation and auto-fix for all users

### Consistency Checks:
- User's `totalReferrals` matches actual referral records
- User's `totalEarned` matches sum of referral rewards
- Referral statuses are accurate
- Leaderboard positions reflect current data

## Usage for Frontend

### Leaderboard Page:
```typescript
// Uses FirebaseLeaderboardService
const { leaderboard, loading } = useFirebaseLeaderboard("referrals", 50)
```

### Referral Page:
```typescript
// Uses new comprehensive hook
const { 
  user, 
  stats, 
  referredUsers, 
  history 
} = useUserReferrals(walletAddress)
```

### Data Display:
- **Leaderboard**: Shows top users by referrals/earnings
- **Referral Page**: Shows user's referred users list with details
- **User Stats**: Real-time referral count and earnings
- **History**: Complete referral history with status tracking

## Maintenance Commands

### Sync Single User:
```bash
POST /api/admin/data-maintenance
{
  "action": "sync-single-user",
  "walletAddress": "..."
}
```

### Validate All Data:
```bash
POST /api/admin/data-maintenance
{
  "action": "validate-consistency",
  "limit": 100
}
```

### Fix All Issues:
```bash
POST /api/admin/data-maintenance
{
  "action": "fix-all-inconsistencies"
}
```

## Benefits

1. **Data Integrity**: Automatic consistency checks and fixes
2. **Real-time Updates**: Live data for leaderboards and referral pages
3. **Comprehensive Tracking**: Complete referral history and user relationships
4. **Scalable**: Efficient queries and batch operations
5. **Maintainable**: Clear separation of concerns and error handling
6. **Debuggable**: Detailed logging and validation reports

## Error Handling

- All operations include try-catch blocks
- Failed operations don't break the main flow (NFT minting)
- Comprehensive error logging
- Graceful degradation for display components
- Manual sync options for recovery

This system ensures that both the leaderboard and referral pages have accurate, up-to-date information about users, their referrals, and earnings.
