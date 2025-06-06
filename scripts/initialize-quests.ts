// Script to initialize default quests in the database
// Run this once to set up the quest system

export async function initializeQuests() {
  try {
    const response = await fetch('/api/quests/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const result = await response.json()
    
    if (result.success) {
      console.log('✅ Default quests initialized successfully')
      return true
    } else {
      console.error('❌ Failed to initialize quests:', result.error)
      return false
    }
  } catch (error) {
    console.error('❌ Error initializing quests:', error)
    return false
  }
}

// Auto-run if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment - can be called manually
  (window as any).initializeQuests = initializeQuests
}
