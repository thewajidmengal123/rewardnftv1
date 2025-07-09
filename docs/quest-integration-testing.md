# Quest Integration Testing Guide

## Overview
This document outlines the testing procedures for the mini-game quest integration and referral quest auto-completion system.

## 🎮 Mini-Game Quest Integration

### Implementation Summary
- **Quest Type**: `play_minigame`
- **Requirement**: Score 1500+ points
- **Reward**: 200 XP
- **Auto-Detection**: Automatically detects and completes quest when score requirement is met

### Testing Steps

#### 1. **Mini-Game Quest Completion Test**
```bash
# Test Flow:
1. Connect wallet to platform
2. Navigate to /quests page
3. Start "Play Mini-Game" quest
4. Navigate to /mini-game page
5. Play game and achieve 1500+ points
6. Verify quest auto-completion
7. Check XP reward in profile
```

#### 2. **Expected Behavior**
- Game automatically detects when score ≥ 1500
- Quest completion API call is triggered
- Success toast notification appears
- XP is awarded to user account
- Quest status updates to "completed"

#### 3. **Verification Points**
```typescript
// Console logs to verify:
🎮 Score 1500 meets quest requirement (1500+), checking for mini-game quest...
🎮 Found mini-game quest: [quest object]
🎮 Quest completion response: {success: true}
🎉 Quest Completed! Mini-game quest completed with 1500 points! You earned 200 XP!
```

#### 4. **API Integration Test**
```javascript
// Test API endpoint directly:
POST /api/quests
{
  "walletAddress": "user_wallet_address",
  "questId": "minigame_quest_id",
  "action": "update-progress",
  "progressIncrement": 1,
  "verificationData": {
    "gameScore": 1500,
    "completedAt": Date.now(),
    "verified": true
  }
}
```

## 👥 Referral Quest Auto-Completion

### Implementation Summary
- **Quest Type**: `refer_friends`
- **Requirement**: 3 successful referrals
- **Reward**: 500 XP
- **Auto-Completion**: Triggers when user reaches 3rd referral

### Testing Steps

#### 1. **Referral Quest Auto-Completion Test**
```bash
# Test Flow:
1. User A connects wallet and gets referral link
2. User B mints NFT using User A's referral link
3. User C mints NFT using User A's referral link  
4. User D mints NFT using User A's referral link (3rd referral)
5. Verify auto-completion triggers for User A
6. Check quest status and XP reward
```

#### 2. **Manual Quest Check Test**
```bash
# Alternative Test Flow:
1. User with 3+ referrals visits /quests page
2. Clicks "Check Referrals" button on referral quest
3. System verifies referral count ≥ 3
4. Quest auto-completes
5. XP reward is awarded
```

#### 3. **Auto-Detection on Page Load**
```bash
# Test Flow:
1. User with 3+ referrals visits /quests page
2. useQuestSystem hook auto-checks referral count
3. Quest auto-completes if not already completed
4. User sees updated quest status
```

#### 4. **Verification Points**
```typescript
// Console logs to verify:
👥 User wallet_address has 3 referrals, checking quest completion...
👥 Auto-completing referral quest for wallet_address
✅ Referral quest auto-completed for wallet_address
🎉 Referral Quest Auto-Completed! You have 3 referrals! Quest completed automatically! You earned 500 XP!
```

## 🔧 Technical Integration Points

### 1. **Mini-Game Integration**
```typescript
// File: components/mini-game-page-content.tsx
const checkAndCompleteMinigameQuest = async (finalScore: number) => {
  // Finds active mini-game quest
  // Checks if already completed
  // Auto-completes if score ≥ 1500
}
```

### 2. **Referral Integration**
```typescript
// File: services/firebase-referral-service.ts
const checkAndCompleteReferralQuest = async (walletAddress: string) => {
  // Checks user referral count
  // Auto-completes quest if count ≥ 3
  // Prevents duplicate completions
}
```

### 3. **Quest System Hook**
```typescript
// File: hooks/use-quest-system.ts
useEffect(() => {
  // Auto-checks referral quest on page load
  // Triggers when quests and progress are loaded
}, [connected, publicKey, quests, userProgress])
```

## 🧪 Test Scenarios

### Scenario 1: New User Mini-Game
1. **Setup**: New user, no quests completed
2. **Action**: Play mini-game, score 1600 points
3. **Expected**: Quest auto-completes, 200 XP awarded
4. **Verify**: Check Firebase userXP collection

### Scenario 2: Existing User Referrals
1. **Setup**: User with 2 referrals, quest in progress
2. **Action**: 3rd user mints with referral link
3. **Expected**: Quest auto-completes immediately
4. **Verify**: Check quest status and XP balance

### Scenario 3: Page Load Auto-Check
1. **Setup**: User with 3+ referrals, quest not completed
2. **Action**: Visit /quests page
3. **Expected**: Quest auto-completes on page load
4. **Verify**: Toast notification and quest status

### Scenario 4: Duplicate Prevention
1. **Setup**: User with completed referral quest
2. **Action**: Get additional referrals
3. **Expected**: No duplicate quest completion
4. **Verify**: XP balance remains unchanged

## 📊 Verification Checklist

### Mini-Game Quest
- [ ] Quest appears in quest list
- [ ] Game detects score ≥ 1500
- [ ] API call succeeds
- [ ] XP is awarded correctly
- [ ] Quest status updates
- [ ] Toast notification appears
- [ ] Firebase data is updated

### Referral Quest
- [ ] Quest auto-completes at 3rd referral
- [ ] Manual check works correctly
- [ ] Page load auto-check works
- [ ] Duplicate prevention works
- [ ] XP reward is correct (500 XP)
- [ ] Firebase data is consistent

### Integration Points
- [ ] Mini-game → Quest system
- [ ] Referral system → Quest system
- [ ] Quest system → XP system
- [ ] Firebase data consistency
- [ ] Real-time updates work

## 🐛 Common Issues & Solutions

### Issue 1: Quest Not Auto-Completing
**Symptoms**: Score meets requirement but quest doesn't complete
**Solution**: Check console logs for API errors, verify quest ID matching

### Issue 2: Duplicate Quest Completions
**Symptoms**: User gets multiple XP rewards for same quest
**Solution**: Verify status checking logic, ensure proper completion flags

### Issue 3: XP Not Updating
**Symptoms**: Quest completes but XP doesn't increase
**Solution**: Check Firebase userXP collection, verify XP calculation logic

### Issue 4: Referral Count Mismatch
**Symptoms**: Referral quest doesn't complete despite having 3+ referrals
**Solution**: Verify referral tracking in Firebase, check totalReferrals field

## 🎯 Success Criteria

### Mini-Game Quest Success
✅ User plays mini-game and scores 1500+ points
✅ Quest automatically detects completion
✅ 200 XP is awarded to user account
✅ Quest status updates to "completed"
✅ User can claim additional rewards if applicable

### Referral Quest Success
✅ User reaches 3 successful referrals
✅ Quest auto-completes immediately or on next page visit
✅ 500 XP is awarded to user account
✅ No duplicate completions occur
✅ System handles edge cases gracefully

## 📈 Performance Monitoring

### Metrics to Track
- Quest completion rates
- API response times
- XP distribution accuracy
- User engagement with quests
- Error rates and failure points

### Monitoring Tools
- Firebase Analytics for quest events
- Console logging for debugging
- User feedback for UX issues
- Admin dashboard for quest statistics

## 🔄 Continuous Testing

### Automated Tests
- Unit tests for quest completion logic
- Integration tests for API endpoints
- End-to-end tests for user flows

### Manual Testing
- Weekly quest system verification
- User acceptance testing
- Edge case scenario testing
- Performance and load testing

This comprehensive testing guide ensures both mini-game and referral quest integrations work correctly and provide users with the sweet rewards they deserve! 🍯
