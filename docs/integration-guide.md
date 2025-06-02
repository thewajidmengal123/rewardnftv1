# Firebase Referral System Integration Guide

## Quick Start

### 1. Add to Your Minting Component

```typescript
import { useReferralCodeHandler } from "@/hooks/use-firebase-referrals"
import { processNFTMintCompletion } from "@/utils/firebase-referral-integration"

function MintingComponent() {
  // Handle referral codes from URL
  useReferralCodeHandler()
  
  const handleMintSuccess = async (walletAddress: string, nftAddress: string, signature: string) => {
    // Process the mint completion and handle referrals
    const result = await processNFTMintCompletion(walletAddress, nftAddress, signature)
    
    if (result.success) {
      console.log("Mint processed successfully!")
      if (result.referralRewardProcessed) {
        // Show success message about referral reward
        toast.success(`Referral reward sent to ${result.referrerWallet}!`)
      }
    }
  }
  
  // Your existing minting logic...
}
```

### 2. Add to Your App Layout

```typescript
// In your main layout or App component
import { useFirebaseReferrals } from "@/hooks/use-firebase-referrals"

function App() {
  // Initialize referral system when wallet connects
  const { initializeUser } = useFirebaseReferrals()
  
  useEffect(() => {
    // This will automatically initialize when wallet connects
    initializeUser()
  }, [])
  
  return (
    // Your app content
  )
}
```

### 3. Update Your Referrals Page

The referrals page is already updated to use the Firebase system. Just make sure you're importing the updated component:

```typescript
import { ReferralsPageContent } from "@/components/referrals-page-content"

function ReferralsPage() {
  return <ReferralsPageContent />
}
```

## API Integration

### Call the NFT Mint Completion API

```typescript
// After successful NFT mint
const response = await fetch('/api/nft/mint-complete', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    walletAddress: wallet.publicKey.toString(),
    nftAddress: mintedNFTAddress,
    transactionSignature: signature,
  }),
})

const result = await response.json()
if (result.success) {
  console.log('Referral processing completed:', result.data)
}
```

## Testing the System

### 1. Test Referral Tracking

1. Create a referral link: `http://localhost:3000/mint?ref=REFERRAL_CODE`
2. Visit the link with a different wallet
3. Connect the wallet - referral should be tracked
4. Check the referrals page to see the pending referral

### 2. Test Referral Completion

1. Mint an NFT with the referred wallet
2. Check that the referral status changes to "completed"
3. Verify the referrer's earnings are updated
4. Check the leaderboard for updated positions

### 3. Test Leaderboard

1. Visit the referrals page
2. Check that the leaderboard shows current data
3. Test the refresh functionality
4. Verify user rankings are correct

## Environment Setup

Make sure your Firebase configuration is correct in `lib/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
}
```

## Firestore Security Rules

Update your Firestore rules to allow the referral system to work:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if true; // Adjust based on your auth requirements
    }
    
    // Referrals collection
    match /referrals/{referralId} {
      allow read, write: if true; // Adjust based on your auth requirements
    }
    
    // Leaderboard collection
    match /leaderboard/{userId} {
      allow read: if true;
      allow write: if true; // Adjust based on your auth requirements
    }
  }
}
```

## Monitoring

### Check Firebase Console

1. Go to your Firebase Console
2. Navigate to Firestore Database
3. Check the `users`, `referrals`, and `leaderboard` collections
4. Verify data is being written correctly

### Check Browser Console

The system logs important events to the console:
- Referral tracking
- Reward processing
- Error conditions

### API Logs

Check your Next.js server logs for API endpoint activity:
- `/api/referrals/track`
- `/api/referrals/complete`
- `/api/leaderboard`

## Troubleshooting

### Common Issues

1. **Referral not tracking**: Check that the referral code is valid and the wallet hasn't been referred before
2. **Rewards not processing**: Verify the NFT mint completion API is being called
3. **Leaderboard not updating**: Check Firebase permissions and network connectivity
4. **Hooks not working**: Ensure wallet is connected before using referral hooks

### Debug Steps

1. Check browser console for errors
2. Verify Firebase configuration
3. Test API endpoints directly
4. Check Firestore data in Firebase Console
5. Verify wallet connection status

## Performance Tips

1. **Caching**: The system includes built-in caching for leaderboard data
2. **Pagination**: Use appropriate limits for leaderboard queries
3. **Real-time Updates**: The system automatically refreshes data periodically
4. **Error Handling**: All components include proper error handling and loading states

## Next Steps

1. Test the complete flow with real wallets
2. Monitor Firebase usage and costs
3. Consider implementing additional features like:
   - Email notifications for referral rewards
   - Advanced analytics dashboard
   - Social sharing enhancements
   - Mobile app integration
