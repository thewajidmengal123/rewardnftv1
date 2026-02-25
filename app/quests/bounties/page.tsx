import { BountiesPageContent } from "@/components/bounties-page-content"
import { ProtectedRoute } from "@/components/protected-route"

export const metadata = {
  title: "Bounties | Reward NFT Platform",
  description: "Complete bounties to earn rewards",
}

export default function BountiesPage() {
  return (
    <ProtectedRoute requiresNFT={true}>
      <BountiesPageContent />
    </ProtectedRoute>
  )
}
