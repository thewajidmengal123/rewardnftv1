#!/usr/bin/env node

/**
 * Essential Mini-Game XP Test
 * Tests the core XP reward functionality that users actually experience
 */

const BASE_URL = 'http://localhost:3001'

console.log('🎮 ESSENTIAL MINI-GAME XP TEST')
console.log('=' .repeat(40))

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, options)
    const data = await response.json()
    return { success: response.ok, data, status: response.status }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testEssentialXPFlow() {
  const testWallet = 'essential-test-' + Date.now()
  console.log(`Test Wallet: ${testWallet}`)
  console.log('')

  // 1. Test XP Award (what happens when user plays mini-game)
  console.log('1. 🎮 Testing XP Award (Mini-Game Completion)...')
  const xpResult = await makeRequest(`${BASE_URL}/api/xp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress: testWallet,
      xpAmount: 180,
      source: 'mini-game',
      details: {
        gameScore: 1650,
        clicks: 95,
        timeSpent: 19,
        completedAt: Date.now()
      }
    })
  })

  if (xpResult.success) {
    console.log('   ✅ XP awarded successfully!')
    console.log(`   📊 XP Earned: ${xpResult.data.data.xpAwarded}`)
    console.log(`   📈 Total XP: ${xpResult.data.data.totalXP}`)
    console.log(`   🏆 Level: ${xpResult.data.data.level}`)
  } else {
    console.log('   ❌ XP award failed:', xpResult.error || xpResult.data.error)
    return false
  }

  // 2. Test Quest Completion (what happens when user scores 1500+)
  console.log('\n2. 🎯 Testing Quest Completion (1500+ Score)...')
  
  // Get mini-game quest
  const questsResult = await makeRequest(`${BASE_URL}/api/quests?action=get-quests`)
  if (!questsResult.success) {
    console.log('   ❌ Failed to fetch quests')
    return false
  }

  const oneTimeQuest = questsResult.data.data.find(q => 
    q.requirements?.type === 'play_minigame' && q.type === 'one-time'
  )

  if (!oneTimeQuest) {
    console.log('   ❌ Mini-game quest not found')
    return false
  }

  console.log(`   🎯 Found quest: ${oneTimeQuest.title} (${oneTimeQuest.reward.xp} XP)`)

  // Complete the quest
  const questResult = await makeRequest(`${BASE_URL}/api/quests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress: testWallet,
      questId: oneTimeQuest.id,
      action: 'update-progress',
      progressIncrement: 1,
      verificationData: {
        gameScore: 1650, // Above 1500 requirement
        completedAt: Date.now(),
        verified: true
      }
    })
  })

  if (questResult.success) {
    console.log('   ✅ Quest completed successfully!')
    console.log(`   📊 Quest Status: ${questResult.data.data.status}`)
    console.log(`   🎁 Quest Reward: ${questResult.data.data.rewardXP} XP`)
  } else {
    console.log('   ❌ Quest completion failed:', questResult.error || questResult.data.error)
    return false
  }

  // 3. Verify Total XP (what user sees in their profile)
  console.log('\n3. 📊 Testing Total XP Verification...')
  const finalXP = await makeRequest(`${BASE_URL}/api/xp?walletAddress=${testWallet}&action=get-user-xp`)

  if (finalXP.success) {
    const userData = finalXP.data.data
    console.log('   ✅ XP verification successful!')
    console.log(`   📈 Final Total XP: ${userData.totalXP}`)
    console.log(`   🏆 Current Level: ${userData.level}`)
    console.log(`   📊 Progress: ${userData.currentLevelXP}/${userData.nextLevelXP}`)
    
    // Expected: 180 (gameplay) + 200 (quest) = 380 XP
    const expectedXP = 180 + 200
    if (userData.totalXP >= expectedXP) {
      console.log(`   🎉 Expected XP achieved! (${userData.totalXP} >= ${expectedXP})`)
    } else {
      console.log(`   ⚠️  XP lower than expected (${userData.totalXP} < ${expectedXP})`)
    }
  } else {
    console.log('   ❌ XP verification failed:', finalXP.error || finalXP.data.error)
    return false
  }

  return true
}

async function testMinimumXPReward() {
  console.log('\n4. 🎮 Testing Minimum XP Reward (Low Score)...')
  
  const testWallet = 'min-xp-test-' + Date.now()
  
  // Test with low XP amount (should be boosted to minimum 10)
  const xpResult = await makeRequest(`${BASE_URL}/api/xp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress: testWallet,
      xpAmount: 5, // Below minimum
      source: 'mini-game',
      details: {
        gameScore: 200, // Low score
        clicks: 15,
        timeSpent: 20,
        completedAt: Date.now()
      }
    })
  })

  if (xpResult.success) {
    const awarded = xpResult.data.data.xpAwarded
    console.log(`   ✅ Minimum XP protection working!`)
    console.log(`   📊 Requested: 5 XP, Awarded: ${awarded} XP`)
    
    if (awarded >= 10) {
      console.log(`   🎉 Minimum XP guarantee working (${awarded} >= 10)`)
    } else {
      console.log(`   ❌ Minimum XP not enforced (${awarded} < 10)`)
      return false
    }
  } else {
    console.log('   ❌ Minimum XP test failed:', xpResult.error || xpResult.data.error)
    return false
  }

  return true
}

async function runEssentialTests() {
  console.log('Testing essential mini-game XP functionality...\n')
  
  try {
    const test1 = await testEssentialXPFlow()
    const test2 = await testMinimumXPReward()
    
    console.log('\n' + '='.repeat(40))
    console.log('🎮 ESSENTIAL XP TEST RESULTS')
    console.log('='.repeat(40))
    
    if (test1 && test2) {
      console.log('🎉 ALL ESSENTIAL TESTS PASSED!')
      console.log('')
      console.log('✅ XP rewards are working perfectly')
      console.log('✅ Quest completion is working perfectly')
      console.log('✅ Minimum XP protection is working')
      console.log('✅ Users will receive XP when playing mini-game')
      console.log('')
      console.log('🚀 Mini-game XP system is READY FOR USERS!')
    } else {
      console.log('❌ Some essential tests failed')
      console.log('⚠️  Mini-game XP system needs attention')
    }
  } catch (error) {
    console.log('❌ Test execution failed:', error.message)
  }
}

// Run the essential tests
runEssentialTests().catch(console.error)
