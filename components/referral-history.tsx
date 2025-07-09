"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, DollarSign } from "lucide-react"

interface ReferralHistoryProps {
  referrals?: {
    address: string
    displayName?: string
    date: string
    status: "pending" | "completed"
    points: number
    nftsMinted?: number
    totalEarned?: number
    lastActive?: any
  }[]
}

export function ReferralHistory({ referrals = [] }: ReferralHistoryProps) {
  // Debug logging
  console.log("🔍 ReferralHistory component received:", {
    referralsCount: referrals.length,
    referrals: referrals
  })

  return (
    <div className="space-y-4">
      {/* Header with count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-teal-400" />
          <h3 className="text-xl font-medium text-white">Referred Users</h3>
        </div>
        <Badge variant="outline" className="bg-teal-900/30 text-teal-300 border-teal-700">
          {referrals.length} {referrals.length === 1 ? 'User' : 'Users'}
        </Badge>
      </div>

      <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-gray-800/50 overflow-hidden">
        {referrals.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-gray-500" />
            </div>
            <p className="text-gray-400 text-lg font-medium mb-2">No referrals yet</p>
            <p className="text-gray-500 text-sm">
              Share your referral link to start tracking your referrals!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800/50">
            {referrals.map((referral, index) => (
              <div key={index} className="p-4 hover:bg-gray-800/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="bg-teal-600/30 h-10 w-10 border border-teal-500/30">
                      <AvatarFallback className="text-teal-300 font-medium">
                        {referral.address.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-white font-medium">
                        {referral.displayName || `${referral.address.slice(0, 6)}...${referral.address.slice(-4)}`}
                      </p>
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Calendar className="h-3 w-3" />
                        <span>{referral.date}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        NFTs Minted: {(referral.nftsMinted && referral.nftsMinted > 0) ? 1 : 0} | Earned: ${(referral.totalEarned || 0).toFixed(2)}
                        {(referral as any).referralId && (
                          <span className="ml-2 text-gray-600">ID: {(referral as any).referralId.slice(0, 8)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      className={
                        referral.status === "completed"
                          ? "bg-teal-900/50 text-teal-300 border-teal-700/50"
                          : "bg-yellow-900/50 text-yellow-300 border-yellow-700/50"
                      }
                    >
                      {referral.status === "completed" ? "✓ Completed" : "⏳ Pending"}
                      {(referral as any).referralStatus === "rewarded" && " 💰"}
                    </Badge>
                    <div className="flex items-center gap-1 text-teal-400 font-medium">
                      <DollarSign className="h-4 w-4" />
                      <span>{referral.status === "completed" ? "4" : "0"}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary footer */}
      {referrals.length > 0 && (
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-800/50 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Total Referrals Tracked:</span>
            <div className="flex items-center gap-1 text-teal-400 font-medium">
              <DollarSign className="h-4 w-4" />
              <span>{referrals.filter(ref => ref.status === "completed").length} Referrals</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
