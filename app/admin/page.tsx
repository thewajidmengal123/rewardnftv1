"use client"

import Link from "next/link"
import { CollectionAdmin } from "@/components/collection-admin"

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="mb-6">
        <Link href="/prediction-market" className="text-purple-400 hover:text-purple-300">
          → Go to Prediction Market
        </Link>
      </div>
      <CollectionAdmin />
    </div>
  )
}
