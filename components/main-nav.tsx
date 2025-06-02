import type React from "react"
import Image from "next/image"
import Link from "next/link"

interface MainNavProps {
  className?: string
}

export const MainNav: React.FC<MainNavProps> = ({ className }) => {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "Reward NFT Platform"

  return (
    <nav className={`flex items-center justify-between p-4 ${className}`}>
      <Link href="/" className="flex items-center space-x-2">
        <Image src="/images/logo.png" alt="Logo" width={32} height={32} className="rounded-full" />
        <span className="font-bold">{appName}</span>
      </Link>

      <div className="hidden md:flex items-center space-x-6">
        <Link href="/" className="text-sm font-medium transition-colors hover:text-foreground/80">
          Home
        </Link>
        <Link href="/mint" className="text-sm font-medium transition-colors hover:text-foreground/80">
          Mint
        </Link>
        <Link href="/profile" className="text-sm font-medium transition-colors hover:text-foreground/80">
          Profile
        </Link>
        <Link href="/leaderboard" className="text-sm font-medium transition-colors hover:text-foreground/80">
          Leaderboard
        </Link>
        <Link href="/referrals" className="text-sm font-medium transition-colors hover:text-foreground/80">
          Referrals
        </Link>
        <Link href="/quests" className="text-sm font-medium transition-colors hover:text-foreground/80">
          Quests
        </Link>
      </div>
    </nav>
  )
}

// Also export as default for backward compatibility
export default MainNav
