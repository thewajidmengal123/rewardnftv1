import { AdminDashboardContent } from "@/components/admin-dashboard-content"
import PredictionManager from "@/components/admin/PredictionManager"

export const metadata = {
  title: "Admin Dashboard | Reward NFT Platform",
  description: "Admin dashboard for the Reward NFT Platform",
}

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <AdminDashboardContent />
      
      {/* Prediction Market Admin Section */}
      <div className="border-t border-gray-800 pt-8">
        <PredictionManager />
      </div>
    </div>
  )
}
