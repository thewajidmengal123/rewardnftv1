"use client"

import { CollectionAdmin } from "@/components/collection-admin"
import PredictionManager from "@/components/admin/PredictionManager"

export default function AdminPage() {
  return (
    <div className="min-h-screen p-4 space-y-8">
      <CollectionAdmin />
      
      {/* Add Prediction Manager Section */}
      <div className="border-t border-gray-800 pt-8">
        <PredictionManager />
      </div>
    </div>
  )
}
