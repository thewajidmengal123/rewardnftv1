"use client"

import { useWallet } from "@/contexts/wallet-context"
import { isAdminWallet } from "@/config/admin"
import { Badge } from "@/components/ui/badge"
import { Shield, Crown } from "lucide-react"

interface AdminAccessIndicatorProps {
  showBadge?: boolean
  showIcon?: boolean
  className?: string
}

export function AdminAccessIndicator({ 
  showBadge = true, 
  showIcon = true, 
  className = "" 
}: AdminAccessIndicatorProps) {
  const { connected, publicKey } = useWallet()
  
  if (!connected || !isAdminWallet(publicKey?.toString())) {
    return null
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && (
        <Crown className="w-4 h-4 text-yellow-400" />
      )}
      {showBadge && (
        <Badge variant="outline" className="bg-yellow-900/50 text-yellow-300 border-yellow-700">
          <Shield className="w-3 h-3 mr-1" />
          Admin
        </Badge>
      )}
    </div>
  )
}

interface AdminOnlyProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AdminOnly({ children, fallback = null }: AdminOnlyProps) {
  const { connected, publicKey } = useWallet()
  
  if (!connected || !isAdminWallet(publicKey?.toString())) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

export function useAdminAccess() {
  const { connected, publicKey } = useWallet()
  
  return {
    isAdmin: connected && isAdminWallet(publicKey?.toString()),
    adminWallet: publicKey?.toString(),
    connected
  }
}
