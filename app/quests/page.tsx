import { QuestPageContent } from "@/components/quest-page-content"
import { ProtectedRoute } from "@/components/protected-route"

export const metadata = {
  title: "Quests | Reward NFT Platform",
  description: "Complete quests to earn XP and climb the leaderboard",
}

export default function QuestsPage() {
  return (
    <ProtectedRoute requiresNFT={true}>
      <QuestPageContent />
    </ProtectedRoute>
  )
}
