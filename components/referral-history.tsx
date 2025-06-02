"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface ReferralHistoryProps {
  referrals?: {
    address: string
    date: string
    status: "pending" | "completed"
    points: number
  }[]
}

export function ReferralHistory({ referrals = [] }: ReferralHistoryProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-medium text-white">Recent Referrals</h3>

      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4 space-y-2">
        {referrals.length === 0 ? (
          <p className="text-white/80 text-center py-4">No referrals yet</p>
        ) : (
          referrals.map((referral, index) => (
            <div key={index} className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
              <div className="flex items-center gap-3">
                <Avatar className="bg-purple-500/30 h-10 w-10">
                  <AvatarFallback className="text-white">{referral.address.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white font-medium">{referral.address}</p>
                  <p className="text-white/60 text-sm">{referral.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  className={
                    referral.status === "completed"
                      ? "bg-green-500/20 text-green-300"
                      : "bg-yellow-500/20 text-yellow-300"
                  }
                >
                  {referral.status === "completed" ? "Completed" : "Pending"}
                </Badge>
                <span className="text-white font-medium">+{referral.points} pts</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
