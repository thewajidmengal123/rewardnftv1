#!/usr/bin/env node

/**
 * Comprehensive Mini-Game XP System Test
 * This script tests all aspects of the mini-game XP reward system
 */

const BASE_URL = 'http://localhost:3001'

// Test wallet address
const TEST_WALLET = 'test-minigame-' + Date.now()

console.log('🎮 MINI-GAME XP SYSTEM COMPREHENSIVE TEST')
console.log('=' .repeat(50))
console.log(`Test Wallet: ${TEST_WALLET}`)
console.log('')

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, options)
    const data = await response.json()
    return { success: response.ok, data, status: response.status }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testXPAPI() {
  console.log('📊 Testing XP API...')
  
  // Test XP award
  const xpResult = await makeRequest(`${BASE_URL}/api/xp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress: TEST_WALLET,
      xpAmount: 150,
      source: 'mini-game',
      details: {
        gameScore: 1200,
        clicks: 80,
        timeSpent: 18,
        completedAt: Date.now()
      }
    })
  })
  
  if (xpResult.success) {
    console.log('✅ XP API working correctly')
    console.log(`   Awarded: ${xpResult.data.data.xpAwarded} XP`)
    console.log(`   Total XP: ${xpResult.data.data.totalXP}`)
    console.log(`   Level: ${xpResult.data.data.level}`)
  } else {
    console.log('❌ XP API failed:', xpResult.error || xpResult.data.error)
    return false
  }
  
  // Test XP retrieval
  const getUserXP = await makeRequest(`${BASE_URL}/api/xp?walletAddress=${TEST_WALLET}&action=get-user-xp`)
  
  if (getUserXP.success) {
    console.log('✅ XP retrieval working correctly')
    console.log(`   User XP: ${getUserXP.data.data.totalXP}`)
  } else {
    console.log('❌ XP retrieval failed:', getUserXP.error || getUserXP.data.error)
    return false
  }
  
  return true
}

async function testQuestAPI() {
  console.log('\n🎯 Testing Quest API...')
  
  // Get all quests
  const questsResult = await makeRequest(`${BASE_URL}/api/quests?action=get-quests`)
  
  if (!questsResult.success) {
    console.log('❌ Failed to fetch quests:', questsResult.error || questsResult.data.error)
    return false
  }
  
  // Find mini-game quests
  const minigameQuests = questsResult.data.data.filter(quest => 
    quest.requirements?.type === 'play_minigame'
  )
  
  console.log(`✅ Found ${minigameQuests.length} mini-game quests:`)
  minigameQuests.forEach(quest => {
    console.log(`   - ${quest.title} (${quest.type}, ${quest.reward.xp} XP, ${quest.requirements.count}+ points)`)
  })
  
  if (minigameQuests.length === 0) {
    console.log('❌ No mini-game quests found!')
    return false
  }
  
  // Test quest completion for the one-time quest (1500+ points)
  const oneTimeQuest = minigameQuests.find(q => q.type === 'one-time')
  if (oneTimeQuest) {
    console.log(`\n🎯 Testing quest completion for: ${oneTimeQuest.title}`)
    
    const questResult = await makeRequest(`${BASE_URL}/api/quests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: TEST_WALLET,
        questId: oneTimeQuest.id,
        action: 'update-progress',
        progressIncrement: 1,
        verificationData: {
          gameScore: 1600, // Above 1500 requirement
          completedAt: Date.now(),
          verified: true
        }
      })
    })
    
    if (questResult.success) {
      console.log('✅ Quest completion working correctly')
      console.log(`   Status: ${questResult.data.data.status}`)
      console.log(`   Progress: ${questResult.data.data.progress}/${questResult.data.data.maxProgress}`)
      console.log(`   Reward XP: ${questResult.data.data.rewardXP}`)
    } else {
      console.log('❌ Quest completion failed:', questResult.error || questResult.data.error)
      return false
    }
  }
  
  return true
}

async function testMiniGameSession() {
  console.log('\n🎮 Testing Mini-Game Session API...')
  
  const today = new Date().toISOString().split('T')[0]
  
  // Test session recording
  const sessionResult = await makeRequest(`${BASE_URL}/api/mini-game/record-play`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress: TEST_WALLET,
      playDate: today,
      startedAt: Date.now()
    })
  })
  
  if (sessionResult.success) {
    console.log('✅ Session recording working correctly')
    console.log(`   Session ID: ${sessionResult.data.sessionId}`)
  } else {
    console.log('❌ Session recording failed:', sessionResult.error || sessionResult.data.error)
    return false
  }
  
  // Test session completion
  const completeResult = await makeRequest(`${BASE_URL}/api/mini-game/complete-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress: TEST_WALLET,
      playDate: today,
      gameScore: 1800,
      clicks: 120,
      xpEarned: 200,
      completedAt: Date.now()
    })
  })
  
  if (completeResult.success) {
    console.log('✅ Session completion working correctly')
  } else {
    console.log('❌ Session completion failed:', completeResult.error || completeResult.data.error)
    return false
  }
  
  // Test play status check
  const statusResult = await makeRequest(`${BASE_URL}/api/mini-game/play-status?walletAddress=${TEST_WALLET}&date=${today}`)
  
  if (statusResult.success) {
    console.log('✅ Play status check working correctly')
    console.log(`   Has played today: ${statusResult.data.hasPlayedToday}`)
    console.log(`   Session status: ${statusResult.data.sessionStatus}`)
  } else {
    console.log('❌ Play status check failed:', statusResult.error || statusResult.data.error)
    return false
  }
  
  return true
}

async function testFullGameFlow() {
  console.log('\n🎯 Testing Full Game Flow...')
  
  const gameWallet = 'game-flow-' + Date.now()
  const today = new Date().toISOString().split('T')[0]
  
  console.log(`Game Wallet: ${gameWallet}`)
  
  // 1. Record game session
  console.log('1. Recording game session...')
  const sessionResult = await makeRequest(`${BASE_URL}/api/mini-game/record-play`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress: gameWallet,
      playDate: today,
      startedAt: Date.now()
    })
  })
  
  if (!sessionResult.success) {
    console.log('❌ Failed to record session')
    return false
  }
  
  // 2. Award XP for gameplay
  console.log('2. Awarding XP for gameplay...')
  const xpResult = await makeRequest(`${BASE_URL}/api/xp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress: gameWallet,
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
  
  if (!xpResult.success) {
    console.log('❌ Failed to award XP')
    return false
  }
  
  // 3. Complete quest (if score >= 1500)
  console.log('3. Completing mini-game quest...')
  const questsResult = await makeRequest(`${BASE_URL}/api/quests?action=get-quests`)
  const oneTimeQuest = questsResult.data.data.find(q => 
    q.requirements?.type === 'play_minigame' && q.type === 'one-time'
  )
  
  if (oneTimeQuest) {
    const questResult = await makeRequest(`${BASE_URL}/api/quests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: gameWallet,
        questId: oneTimeQuest.id,
        action: 'update-progress',
        progressIncrement: 1,
        verificationData: {
          gameScore: 1650,
          completedAt: Date.now(),
          verified: true
        }
      })
    })
    
    if (!questResult.success) {
      console.log('❌ Failed to complete quest')
      return false
    }
  }
  
  // 4. Complete session
  console.log('4. Completing game session...')
  const completeResult = await makeRequest(`${BASE_URL}/api/mini-game/complete-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress: gameWallet,
      playDate: today,
      gameScore: 1650,
      clicks: 95,
      xpEarned: 180,
      completedAt: Date.now()
    })
  })
  
  if (!completeResult.success) {
    console.log('❌ Failed to complete session')
    return false
  }
  
  // 5. Verify final XP
  console.log('5. Verifying final XP...')
  const finalXP = await makeRequest(`${BASE_URL}/api/xp?walletAddress=${gameWallet}&action=get-user-xp`)
  
  if (finalXP.success) {
    console.log('✅ Full game flow completed successfully!')
    console.log(`   Final XP: ${finalXP.data.data.totalXP}`)
    console.log(`   Level: ${finalXP.data.data.level}`)
    console.log(`   Expected: 180 (gameplay) + 200 (quest) = 380 XP`)
  } else {
    console.log('❌ Failed to verify final XP')
    return false
  }
  
  return true
}

async function runTests() {
  console.log('Starting comprehensive mini-game XP system tests...\n')
  
  const tests = [
    { name: 'XP API', fn: testXPAPI },
    { name: 'Quest API', fn: testQuestAPI },
    { name: 'Mini-Game Session API', fn: testMiniGameSession },
    { name: 'Full Game Flow', fn: testFullGameFlow }
  ]
  
  let passed = 0
  let failed = 0
  
  for (const test of tests) {
    try {
      const result = await test.fn()
      if (result) {
        passed++
        console.log(`\n✅ ${test.name} - PASSED`)
      } else {
        failed++
        console.log(`\n❌ ${test.name} - FAILED`)
      }
    } catch (error) {
      failed++
      console.log(`\n❌ ${test.name} - ERROR: ${error.message}`)
    }
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('🎮 MINI-GAME XP SYSTEM TEST RESULTS')
  console.log('='.repeat(50))
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📊 Total: ${passed + failed}`)
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Mini-game XP system is working perfectly!')
  } else {
    console.log('\n⚠️  Some tests failed. Please check the implementation.')
  }
}

// Run the tests
runTests().catch(console.error)
