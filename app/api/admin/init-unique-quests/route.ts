import { type NextRequest, NextResponse } from "next/server"
import { isAdminWallet } from "@/config/admin"
import { db } from "@/lib/firebase"
import { collection, doc, writeBatch, getDocs, query, where, serverTimestamp } from "firebase/firestore"

// Define quest types and interfaces
type QuestType = "one-time" | "special"
type QuestDifficulty = "Easy" | "Medium" | "Hard"

interface Quest {
  id: string
  title: string
  description: string
  type: QuestType
  difficulty: QuestDifficulty
  reward: { xp: number }
  requirements: {
    type: "connect_discord" | "login_streak" | "share_twitter" | "refer_friends" | "play_minigame" | "join_community_call" | "follow_linkedin" | "engage_tweet" | "follow_x" | "join_telegram"
    count: number
    data?: any
  }
  isActive: boolean
  createdAt: any
}

// Predefined unique one-time quests
const DEFAULT_QUESTS: Omit<Quest, "id" | "createdAt">[] = [
  {
    title: "Connect Discord",
    description: "Link your Discord account to RewardNFT community",
    type: "one-time",
    difficulty: "Easy",
    reward: { xp: 100 },
    requirements: { type: "connect_discord", count: 1 },
    isActive: true,
  },
  {
    title: "Refer 3 Friends",
    description: "Get 3 friends to mint NFTs with your referral link",
    type: "one-time",
    difficulty: "Hard",
    reward: { xp: 500 },
    requirements: { type: "refer_friends", count: 3 },
    isActive: true,
  },
  {
    title: "Share on Twitter",
    description: "Share your NFT or RewardNFT on Twitter with #RewardNFT",
    type: "one-time",
    difficulty: "Easy",
    reward: { xp: 150 },
    requirements: { type: "share_twitter", count: 1 },
    isActive: true,
  },
  {
    title: "Play Mini-Game Challenge",
    description: "Score 1500+ points in the click challenge mini-game",
    type: "one-time",
    difficulty: "Medium",
    reward: { xp: 200 },
    requirements: { type: "play_minigame", count: 1500 },
    isActive: true,
  },
  {
    title: "Join Community Call",
    description: "Attend a RewardNFT community call on Discord",
    type: "one-time",
    difficulty: "Easy",
    reward: { xp: 250 },
    requirements: { type: "join_community_call", count: 1 },
    isActive: true,
  },
  {
    title: "Complete Login Streak",
    description: "Login to the platform for 5 consecutive days",
    type: "one-time",
    difficulty: "Medium",
    reward: { xp: 300 },
    requirements: { type: "login_streak", count: 5 },
    isActive: true,
  },
  {
    title: "Follow LinkedIn",
    description: "Follow RewardNFT on LinkedIn to stay updated",
    type: "one-time",
    difficulty: "Easy",
    reward: { xp: 100 },
    requirements: {
      type: "follow_linkedin",
      count: 1,
      data: { url: "https://www.linkedin.com/company/rewardnft" }
    },
    isActive: true,
  },
  {
    title: "Engage Tweet",
    description: "Like and retweet our latest announcement",
    type: "one-time",
    difficulty: "Easy",
    reward: { xp: 150 },
    requirements: {
      type: "engage_tweet",
      count: 1,
      data: { url: "https://x.com/RewardNFT_/status/1933524613067137437" }
    },
    isActive: true,
  },
  {
    title: "Follow X (Twitter)",
    description: "Follow @RewardNFT_ on X for latest updates",
    type: "one-time",
    difficulty: "Easy",
    reward: { xp: 100 },
    requirements: {
      type: "follow_x",
      count: 1,
      data: { url: "https://x.com/RewardNFT_" }
    },
    isActive: true,
  },
  {
    title: "Join Telegram",
    description: "Join our Telegram community for exclusive updates",
    type: "one-time",
    difficulty: "Easy",
    reward: { xp: 100 },
    requirements: {
      type: "join_telegram",
      count: 1,
      data: { url: "https://t.me/rewardsNFT" }
    },
    isActive: true,
  },
]

export async function POST(request: NextRequest) {
  try {
    // Get the wallet address from request body or headers
    const body = await request.json().catch(() => ({}))
    const walletAddress = body.walletAddress

    // Verify admin access
    if (!walletAddress || !isAdminWallet(walletAddress)) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      )
    }

    console.log("🎯 Admin initializing unique quests...")

    // Get existing quests
    const questsQuery = query(
      collection(db, "quests"),
      where("isActive", "==", true)
    )
    const existingQuests = await getDocs(questsQuery)
    const existingTitles = new Set(existingQuests.docs.map(doc => doc.data().title))

    const batch = writeBatch(db)
    let questsToAdd = 0

    // Only add quests that don't already exist
    for (const questData of DEFAULT_QUESTS) {
      if (!existingTitles.has(questData.title)) {
        const questRef = doc(collection(db, "quests"))
        const quest: Quest = {
          ...questData,
          id: questRef.id,
          createdAt: serverTimestamp(),
        }
        batch.set(questRef, quest)
        questsToAdd++
      }
    }

    if (questsToAdd > 0) {
      await batch.commit()
      console.log(`✅ Added ${questsToAdd} unique quests to the database`)
    } else {
      console.log(`✅ All unique quests already exist in the database`)
    }

    // Get all quests to return
    const allQuestsSnapshot = await getDocs(questsQuery)
    const allQuests = allQuestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quest))

    console.log(`✅ Successfully initialized ${allQuests.length} unique quests`)

    return NextResponse.json({
      success: true,
      message: `Successfully initialized ${allQuests.length} unique quests (${questsToAdd} new)`,
      quests: allQuests.map(q => ({
        id: q.id,
        title: q.title,
        type: q.type,
        reward: q.reward,
        requirements: q.requirements
      }))
    })
  } catch (error) {
    console.error("❌ Error initializing unique quests:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to initialize quests"
      },
      { status: 500 }
    )
  }
}

// Also allow GET for easy testing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get("wallet")

    // Verify admin access
    if (!walletAddress || !isAdminWallet(walletAddress)) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      )
    }

    console.log("🎯 Admin checking quest status...")

    // Get current quests using client Firebase
    const questsQuery = query(
      collection(db, "quests"),
      where("isActive", "==", true)
    )
    const questsSnapshot = await getDocs(questsQuery)
    const quests: Quest[] = questsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quest))

    return NextResponse.json({
      success: true,
      message: `Found ${quests.length} existing quests`,
      questCount: quests.length,
      quests: quests.map(q => ({
        id: q.id,
        title: q.title,
        type: q.type,
        reward: q.reward,
        requirements: q.requirements
      }))
    })
  } catch (error) {
    console.error("❌ Error checking quests:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to check quests"
      },
      { status: 500 }
    )
  }
}
