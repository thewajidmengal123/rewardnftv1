"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { usePersistentWallet } from "@/contexts/persistent-wallet-context"
import { toast } from "@/components/ui/use-toast"

interface AuthContextType {
  hasNft: boolean
  isLoading: boolean
  checkNftOwnership: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { connected, publicKey } = usePersistentWallet()
  const [hasNft, setHasNft] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const router = useRouter()
  const pathname = usePathname()

  // Function to check if the user owns an NFT
  const checkNftOwnership = async (): Promise<boolean> => {
    if (!connected || !publicKey) return false

    try {
      // For demo purposes, we're simulating NFT ownership check
      // In a real app, you would query the blockchain or your backend

      // Simulate API call to check NFT ownership
      const hasNft = localStorage.getItem(`nft_minted_${publicKey.toString()}`) === "true"
      setHasNft(hasNft)
      return hasNft
    } catch (error) {
      console.error("Error checking NFT ownership:", error)
      return false
    }
  }

  // Check NFT ownership when wallet connection changes
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true)
      if (connected) {
        await checkNftOwnership()
      } else {
        setHasNft(false)
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [connected, publicKey])

  // Handle redirects for protected pages
  useEffect(() => {
    if (isLoading) return

    const restrictedPages = ["/mint", "/profile", "/referrals", "/quests", "/leaderboard"]
    const nftRequiredPages = ["/referrals", "/quests", "/leaderboard"]

    // If on a restricted page and not connected, redirect to home
    if (restrictedPages.includes(pathname) && !connected) {
      toast({
        title: "Wallet Connection Required",
        description: "Please connect your wallet to access this page",
        variant: "destructive",
      })
      router.push("/")
      return
    }

    // If on an NFT-required page and no NFT, redirect to mint page
    if (nftRequiredPages.includes(pathname) && !hasNft && connected) {
      toast({
        title: "NFT Required",
        description: "You need to mint an NFT to access this page",
        variant: "destructive",
      })
      router.push("/mint")
      return
    }
  }, [pathname, connected, hasNft, isLoading, router])

  return <AuthContext.Provider value={{ hasNft, isLoading, checkNftOwnership }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
