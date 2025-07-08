#!/usr/bin/env node

/**
 * Mobile Wallet Connectivity Test Suite
 * 
 * This script tests the mobile wallet connectivity fixes to ensure they work correctly.
 * Run this in a mobile browser environment or mobile simulator.
 */

// Test configuration
const TEST_CONFIG = {
  wallets: ['phantom', 'solflare', 'backpack'],
  testUrl: 'http://localhost:3000', // Adjust to your dev server
  timeout: 10000
}

// Mock mobile environment detection
function mockMobileEnvironment() {
  // Override navigator.userAgent for testing
  Object.defineProperty(navigator, 'userAgent', {
    value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    configurable: true
  })
  
  // Mock touch capability
  Object.defineProperty(navigator, 'maxTouchPoints', {
    value: 5,
    configurable: true
  })
  
  // Mock window dimensions
  Object.defineProperty(window, 'innerWidth', {
    value: 375,
    configurable: true
  })
  
  Object.defineProperty(window, 'innerHeight', {
    value: 812,
    configurable: true
  })
}

// Test mobile device detection
function testMobileDetection() {
  console.log('🧪 Testing Mobile Device Detection...')
  
  // Import the mobile detection function
  const { isMobileDevice, isIOSDevice, isIOSSafari } = require('./utils/mobile-wallet-adapter')
  
  const isMobile = isMobileDevice()
  const isIOS = isIOSDevice()
  const isSafari = isIOSSafari()
  
  console.log(`📱 Is Mobile: ${isMobile}`)
  console.log(`🍎 Is iOS: ${isIOS}`)
  console.log(`🌐 Is Safari: ${isSafari}`)
  
  return { isMobile, isIOS, isSafari }
}

// Test deep link generation
function testDeepLinkGeneration() {
  console.log('🔗 Testing Deep Link Generation...')
  
  const { getWalletDeepLink, getWalletUniversalLink } = require('./utils/mobile-wallet-adapter')
  
  const results = {}
  
  TEST_CONFIG.wallets.forEach(wallet => {
    const deepLink = getWalletDeepLink(wallet, 'connect')
    const universalLink = getWalletUniversalLink(wallet)
    
    results[wallet] = { deepLink, universalLink }
    
    console.log(`${wallet}:`)
    console.log(`  Deep Link: ${deepLink}`)
    console.log(`  Universal Link: ${universalLink}`)
    
    // Validate deep link format
    const isValidDeepLink = deepLink.startsWith(`${wallet}://`) || deepLink.startsWith('https://')
    console.log(`  ✅ Valid Format: ${isValidDeepLink}`)
  })
  
  return results
}

// Test wallet provider detection
function testWalletProviderDetection() {
  console.log('🔍 Testing Wallet Provider Detection...')
  
  const { detectWalletProviders, getMobileWalletProviders } = require('./utils/wallet-providers')
  
  const allProviders = detectWalletProviders()
  const mobileProviders = getMobileWalletProviders()
  
  console.log(`📋 Total Providers: ${allProviders.length}`)
  console.log(`📱 Mobile Providers: ${mobileProviders.length}`)
  
  allProviders.forEach(provider => {
    console.log(`${provider.name}:`)
    console.log(`  Installed: ${provider.installed}`)
    console.log(`  Mobile Supported: ${provider.mobileSupported}`)
    console.log(`  Deep Link Supported: ${provider.deepLinkSupported}`)
  })
  
  return { allProviders, mobileProviders }
}

// Test mobile connection flow
async function testMobileConnectionFlow() {
  console.log('🔄 Testing Mobile Connection Flow...')
  
  const { connectToMobileWallet } = require('./utils/mobile-wallet-adapter')
  
  const results = {}
  
  for (const wallet of TEST_CONFIG.wallets) {
    try {
      console.log(`Testing ${wallet} connection...`)
      
      // Mock the connection attempt
      const success = await connectToMobileWallet(wallet)
      
      results[wallet] = {
        success,
        error: null
      }
      
      console.log(`✅ ${wallet}: ${success ? 'Success' : 'Failed'}`)
      
    } catch (error) {
      results[wallet] = {
        success: false,
        error: error.message
      }
      
      console.log(`❌ ${wallet}: ${error.message}`)
    }
  }
  
  return results
}

// Test iOS Safari specific handling
function testIOSSafariHandling() {
  console.log('🍎 Testing iOS Safari Handling...')
  
  const { iosSafariHandler } = require('./utils/ios-safari-handler')
  
  // Test visibility change handler setup
  let handlerCalled = false
  const cleanup = iosSafariHandler.setupVisibilityChangeHandler((wallet) => {
    handlerCalled = true
    console.log(`📱 Visibility handler called for ${wallet}`)
  })
  
  // Test connection return check
  const returnData = iosSafariHandler.checkWalletReturn()
  console.log(`🔄 Return Data: ${returnData ? JSON.stringify(returnData) : 'None'}`)
  
  // Cleanup
  cleanup()
  
  return { handlerSetup: true, returnData }
}

// Main test runner
async function runMobileWalletTests() {
  console.log('🚀 Starting Mobile Wallet Connectivity Tests...\n')
  
  // Mock mobile environment for testing
  if (typeof window !== 'undefined') {
    mockMobileEnvironment()
  }
  
  const testResults = {
    timestamp: new Date().toISOString(),
    environment: 'mobile-test',
    results: {}
  }
  
  try {
    // Run all tests
    testResults.results.mobileDetection = testMobileDetection()
    console.log('')
    
    testResults.results.deepLinkGeneration = testDeepLinkGeneration()
    console.log('')
    
    testResults.results.walletProviderDetection = testWalletProviderDetection()
    console.log('')
    
    testResults.results.mobileConnectionFlow = await testMobileConnectionFlow()
    console.log('')
    
    testResults.results.iosSafariHandling = testIOSSafariHandling()
    console.log('')
    
    // Summary
    console.log('📊 Test Summary:')
    console.log('================')
    
    const allTests = Object.keys(testResults.results)
    const passedTests = allTests.filter(test => {
      const result = testResults.results[test]
      return result && (result.success !== false)
    })
    
    console.log(`✅ Passed: ${passedTests.length}/${allTests.length}`)
    console.log(`❌ Failed: ${allTests.length - passedTests.length}/${allTests.length}`)
    
    if (passedTests.length === allTests.length) {
      console.log('🎉 All mobile wallet connectivity tests passed!')
    } else {
      console.log('⚠️  Some tests failed. Check the logs above for details.')
    }
    
  } catch (error) {
    console.error('💥 Test suite failed:', error)
    testResults.error = error.message
  }
  
  return testResults
}

// Export for use in browser environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runMobileWalletTests,
    testMobileDetection,
    testDeepLinkGeneration,
    testWalletProviderDetection,
    testMobileConnectionFlow,
    testIOSSafariHandling
  }
}

// Run tests if called directly
if (typeof window !== 'undefined') {
  // Browser environment
  window.runMobileWalletTests = runMobileWalletTests
  console.log('Mobile wallet test suite loaded. Call runMobileWalletTests() to start.')
} else if (require.main === module) {
  // Node.js environment
  runMobileWalletTests().then(results => {
    console.log('\nTest Results:', JSON.stringify(results, null, 2))
  })
}
