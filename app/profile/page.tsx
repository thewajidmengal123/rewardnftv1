import { ProfilePageContent } from "@/components/profile-page-content"
import { TransactionSecurityDashboard } from "@/components/transaction-security-dashboard"

export const metadata = {
  title: "User Profile | Reward NFT Platform",
  description: "View and edit your profile on the Reward NFT Platform",
}

export default function ProfilePage() {
  return (
    <>
      <ProfilePageContent />
      <TransactionSecurityDashboard />
    </>
  )
}
