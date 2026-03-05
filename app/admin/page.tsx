"use client"

import { CollectionAdmin } from "@/components/collection-admin"
import Link from "next/link"

export default function AdminPage() {
  return (
    <div className="min-h-screen p-4 bg-black text-white">
      {/* Prediction Market Link - BAS YEH ADD KIYA */}
      <div className="max-w-6xl mx-auto mb-6">
        <Link href="/prediction-market">
          <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-700/50 rounded-2xl p-6 hover:border-purple-500 transition cursor-pointer">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold mb-1">🎯 Prediction Markets</h2>
                <p className="text-gray-300">Manage betting markets →</p>
              </div>
              <span className="text-3xl">→</span>
            </div>
          </div>
        </Link>
      </div>

      {/* ORIGINAL - YEH WAISA HI RAHEGA */}
      <CollectionAdmin />
    </div>
  )
}
