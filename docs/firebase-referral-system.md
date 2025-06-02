# Firebase Referral System Documentation

## Overview

The Firebase Referral System is a comprehensive solution that integrates referral tracking, rewards processing, and leaderboard functionality with Firebase Firestore. This system replaces the previous localStorage-based referral system with a robust, scalable backend solution.

## Architecture

### Core Components

1. **Firebase Services**
   - `FirebaseReferralService` - Handles referral tracking and rewards
   - `FirebaseLeaderboardService` - Manages leaderboard data and rankings
   - `FirebaseUserService` - User profile management

2. **React Hooks**
   - `useFirebaseReferrals` - Main hook for referral functionality
   - `useFirebaseLeaderboard` - Hook for leaderboard data
   - `useReferralCodeHandler` - Handles URL referral codes

3. **API Routes**
   - `/api/referrals/track` - Track new referrals
   - `/api/referrals/complete` - Complete referrals when NFT is minted
   - `/api/referrals/reward` - Process referral rewards
   - `/api/leaderboard` - Get leaderboard data
   - `/api/nft/mint-complete` - Handle NFT mint completion

4. **UI Components**
   - `FirebaseLeaderboard` - Real-time leaderboard component
   - Updated `ReferralsPageContent` - Main referrals page

## Database Schema

### Collections

#### `users`
```typescript
interface UserProfile {
  id: string
  walletAddress: string
  displayName?: string
  referralCode: string
  referredBy?: string
  totalReferrals: number
  totalEarned: number
  nftsMinted: number
  questsCompleted: number
  createdAt: Timestamp
  lastActive: Timestamp
}
```

#### `referrals`
```typescript
interface ReferralRecord {
  id: string
  referrerWallet: string
  referredWallet: string
  referralCode: string
  status: "pending" | "completed" | "rewarded"
  rewardAmount: number
  createdAt: Timestamp
  completedAt?: Timestamp
  rewardedAt?: Timestamp
  rewardTransactionSignature?: string
}
```

#### `leaderboard`
```typescript
interface LeaderboardEntry {
  walletAddress: string
  referralRank: number
  earningsRank: number
  questRank: number
  totalReferrals: number
  totalEarned: number
  questsCompleted: number
  lastUpdated: Timestamp
}
```

## Features

### 1. Referral Tracking
- Automatic referral code generation for each user
- URL-based referral tracking (`/mint?ref=CODE`)
- Prevention of self-referrals and duplicate referrals
- Real-time referral status updates

### 2. Reward System
- 4 USDC reward per successful referral
- Automatic reward processing when referred user mints NFT
- Transaction signature tracking for transparency
- Real-time earnings updates

### 3. Leaderboard System
- Multiple leaderboard types: referrals, earnings, quests, overall
- Real-time ranking updates
- User position tracking
- Comprehensive statistics

### 4. User Experience
- Seamless integration with existing wallet connection
- Real-time data updates
- Error handling and loading states
- Mobile-responsive design

## Usage Examples

### Basic Referral Tracking

```typescript
import { useFirebaseReferrals } from "@/hooks/use-firebase-referrals"

function ReferralComponent() {
  const {
    referralLink,
    stats,
    history,
    error,
  } = useFirebaseReferrals()

  return (
    <div>
      <p>Your referral link: {referralLink}</p>
      <p>Total referrals: {stats?.totalReferrals}</p>
      <p>Total earned: {stats?.totalEarned} USDC</p>
    </div>
  )
}
```

### Leaderboard Display

```typescript
import { FirebaseLeaderboard } from "@/components/firebase-leaderboard"

function LeaderboardPage() {
  return (
    <FirebaseLeaderboard 
      type="referrals" 
      limit={10} 
      showRefresh={true}
    />
  )
}
```

### Processing NFT Mint Completion

```typescript
import { processNFTMintCompletion } from "@/utils/firebase-referral-integration"

async function handleNFTMint(walletAddress: string, nftAddress: string, signature: string) {
  const result = await processNFTMintCompletion(walletAddress, nftAddress, signature)
  
  if (result.success) {
    console.log("NFT mint processed successfully")
    if (result.referralRewardProcessed) {
      console.log("Referral reward processed for:", result.referrerWallet)
    }
  }
}
```

## API Endpoints

### Track Referral
```
POST /api/referrals/track
Body: { referralCode: string, walletAddress: string }
```

### Complete Referral
```
POST /api/referrals/complete
Body: { walletAddress: string, transactionSignature?: string }
```

### Get Leaderboard
```
GET /api/leaderboard?type=referrals&limit=10&wallet=ADDRESS
```

## Integration Points

### 1. Wallet Connection
When a user connects their wallet, the system automatically:
- Initializes their user profile
- Generates a unique referral code
- Loads their referral stats and history

### 2. NFT Minting
When a user mints an NFT, the system:
- Completes any pending referral
- Processes referral rewards
- Updates leaderboard positions
- Records the NFT in user profile

### 3. URL Handling
The system automatically:
- Detects referral codes in URLs
- Tracks referrals when users visit with codes
- Cleans URLs after processing

## Configuration

### Environment Variables
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
```

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
    match /referrals/{referralId} {
      allow read, write: if request.auth != null;
    }
    match /leaderboard/{userId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Performance Considerations

1. **Caching**: Leaderboard data is cached for 5 minutes
2. **Pagination**: Leaderboard supports configurable limits
3. **Real-time Updates**: Uses Firebase real-time listeners where appropriate
4. **Error Handling**: Comprehensive error handling with fallbacks

## Security Features

1. **Validation**: All inputs are validated on both client and server
2. **Duplicate Prevention**: Prevents duplicate referrals and self-referrals
3. **Transaction Verification**: Links rewards to actual blockchain transactions
4. **Rate Limiting**: API endpoints include rate limiting considerations

## Monitoring and Analytics

The system provides comprehensive logging for:
- Referral tracking events
- Reward processing
- Error conditions
- Performance metrics

## Future Enhancements

1. **Advanced Analytics**: Detailed referral performance metrics
2. **Reward Tiers**: Different reward amounts based on user level
3. **Social Features**: Enhanced sharing and social integration
4. **Gamification**: Achievement system and badges
5. **Mobile App**: React Native integration
