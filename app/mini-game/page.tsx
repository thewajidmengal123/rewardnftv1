import MiniGamePageContent from "@/components/mini-game-page-content"
import { ProtectedRoute } from "@/components/protected-route"

export const metadata = {
  title: "Mini Game | Reward NFT Platform",
  description: "Play mini games and earn rewards on the Reward NFT Platform",
}

export default function MiniGamePage() {
  return (
    <ProtectedRoute requiresNFT={true}>
      <MiniGamePageContent />
    </ProtectedRoute>
  )
}
