// Generate a random Solana wallet address
export function generateRandomWalletAddress(): string {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
  let result = ""
  for (let i = 0; i < 44; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Generate a random transaction signature
export function generateRandomTransactionSignature(): string {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
  let result = ""
  for (let i = 0; i < 88; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Generate a random amount of USDC
export function generateRandomUsdcAmount(min = 1, max = 100): number {
  return Number.parseFloat((Math.random() * (max - min) + min).toFixed(2))
}

// Generate a random date within a range
export function generateRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// Generate mock referral data
export function generateMockReferralData(count = 10) {
  const referrals = []

  for (let i = 0; i < count; i++) {
    const referrerWallet = generateRandomWalletAddress()
    const referredWallet = generateRandomWalletAddress()
    const timestamp = generateRandomDate(new Date(2023, 0, 1), new Date()).getTime()
    const amount = generateRandomUsdcAmount(2, 10)
    const transactionId = generateRandomTransactionSignature()

    referrals.push({
      referrerWallet,
      referredWallet,
      timestamp,
      amount,
      transactionId,
      status: Math.random() > 0.3 ? "completed" : "pending",
    })
  }

  return referrals
}

// Generate mock quest completion data
export function generateMockQuestData(count = 10) {
  const quests = []
  const questTypes = ["daily", "weekly", "special"]
  const questDifficulties = ["Easy", "Medium", "Hard"]

  for (let i = 0; i < count; i++) {
    const walletAddress = generateRandomWalletAddress()
    const questId = `quest_${i}`
    const questType = questTypes[Math.floor(Math.random() * questTypes.length)]
    const difficulty = questDifficulties[Math.floor(Math.random() * questDifficulties.length)]
    const completedAt = generateRandomDate(new Date(2023, 0, 1), new Date()).getTime()
    const amount = generateRandomUsdcAmount(0.5, 25)
    const transactionId = Math.random() > 0.3 ? generateRandomTransactionSignature() : undefined

    quests.push({
      walletAddress,
      questId,
      questType,
      difficulty,
      completedAt,
      amount,
      transactionId,
      status: transactionId ? "claimed" : "completed",
    })
  }

  return quests
}

// Generate mock airdrop data
export function generateMockAirdropData(count = 5) {
  const airdrops = []
  const airdropTypes = ["token", "nft"]
  const eligibilityTypes = ["top_referrers", "quest_completions", "nft_holders", "active_users", "manual_selection"]
  const statuses = ["scheduled", "in_progress", "completed", "failed"]

  for (let i = 0; i < count; i++) {
    const id = `airdrop_${i}`
    const name = `Airdrop ${i + 1}`
    const description = `Description for airdrop ${i + 1}`
    const type = airdropTypes[Math.floor(Math.random() * airdropTypes.length)]
    const amount = generateRandomUsdcAmount(5, 50)
    const eligibility = eligibilityTypes[Math.floor(Math.random() * eligibilityTypes.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const scheduledAt = generateRandomDate(new Date(2023, 0, 1), new Date()).getTime()
    const completedAt =
      status === "completed" ? generateRandomDate(new Date(scheduledAt), new Date()).getTime() : undefined

    const recipients = []
    const recipientCount = Math.floor(Math.random() * 20) + 1

    for (let j = 0; j < recipientCount; j++) {
      recipients.push({
        wallet: generateRandomWalletAddress(),
        amount,
        transactionId: status === "completed" ? generateRandomTransactionSignature() : undefined,
        status: status === "completed" ? "success" : status === "failed" ? "failed" : "pending",
      })
    }

    airdrops.push({
      id,
      name,
      description,
      type,
      amount,
      eligibility,
      eligibilityParams: {},
      status,
      scheduledAt,
      completedAt,
      recipients,
      createdBy: generateRandomWalletAddress(),
    })
  }

  return airdrops
}

// Generate mock NFT data
export function generateMockNftData(count = 5) {
  const nfts = []

  for (let i = 0; i < count; i++) {
    const mintAddress = generateRandomWalletAddress()
    const name = `Reward NFT #${i + 1}`
    const description = `This is a reward NFT #${i + 1}`
    const image = `https://example.com/nft-${i + 1}.png`
    const attributes = [
      {
        trait_type: "Rarity",
        value: ["Common", "Uncommon", "Rare", "Epic", "Legendary"][Math.floor(Math.random() * 5)],
      },
      { trait_type: "Level", value: Math.floor(Math.random() * 100) },
      { trait_type: "Power", value: Math.floor(Math.random() * 1000) },
    ]

    nfts.push({
      mintAddress,
      name,
      description,
      image,
      attributes,
      owner: generateRandomWalletAddress(),
      mintedAt: generateRandomDate(new Date(2023, 0, 1), new Date()).getTime(),
    })
  }

  return nfts
}

// Generate mock transaction data
export function generateMockTransactionData(count = 10) {
  const transactions = []
  const transactionTypes = ["mint", "referral", "quest_reward", "airdrop"]

  for (let i = 0; i < count; i++) {
    const signature = generateRandomTransactionSignature()
    const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)]
    const fromWallet = generateRandomWalletAddress()
    const toWallet = generateRandomWalletAddress()
    const amount = generateRandomUsdcAmount(1, 100)
    const timestamp = generateRandomDate(new Date(2023, 0, 1), new Date()).getTime()

    transactions.push({
      signature,
      type,
      fromWallet,
      toWallet,
      amount,
      timestamp,
      status: Math.random() > 0.1 ? "confirmed" : "failed",
    })
  }

  return transactions
}
