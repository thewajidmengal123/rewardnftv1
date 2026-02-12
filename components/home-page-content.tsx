"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { useWallet } from "@/contexts/wallet-context"
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { usePlatformStats } from "@/hooks/use-platform-stats"
import {
  FadeIn,
  SlideUp,
  SlideInLeft,
  SlideInRight,
  StaggerContainer,
  StaggerItem,
  HoverCard,
} from "@/components/ui/animations"

export function HomePageContent() {
  const { connected } = useWallet()
  const { stats, loading: statsLoading } = usePlatformStats()

  return (
    <div className="min-h-screen flex flex-col">
      {/* <Header /> */}

      {/* Hero Section */}
      <FadeIn>
        <section className="relative pt-20 pb-32 px-6 flex-1 flex items-center">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-600/10 via-cyan-600/10 to-slate-600/10 z-0" />
            {/* Enhanced animated gradient orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 rounded-full blur-3xl animate-gradient-x bg-400%" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/20 via-teal-500/20 to-purple-500/20 rounded-full blur-3xl animate-gradient-x bg-400%" />
            <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-pink-500/15 via-red-500/15 to-orange-500/15 rounded-full blur-2xl animate-gradient-x bg-400%" />
          </div>

          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            <SlideInLeft delay={0.2}>
              <div className="space-y-8">
                <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                  <span className="relative inline-block">
                    <span className="bg-gradient-to-r from-yellow-300 via-orange-400 via-yellow-400 to-orange-500 bg-clip-text text-transparent animate-gradient-x bg-400% font-black">
                      Mint Your
                    </span>
                    {/* Glow effect */}
                    <span className="absolute inset-0 bg-gradient-to-r from-yellow-300 via-orange-400 via-yellow-400 to-orange-500 bg-clip-text text-transparent blur-sm opacity-40 animate-gradient-x bg-400%">
                      Mint Your
                    </span>
                  </span>{" "}
                  <span className="relative inline-block">
                    <span className="bg-gradient-to-r from-red-400 via-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent animate-gradient-x bg-400% font-black">
                      NFT
                    </span>
                    {/* Enhanced glow effect */}
                    <span className="absolute inset-0 bg-gradient-to-r from-red-400 via-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent blur-sm opacity-50 animate-gradient-x bg-400%">
                      NFT
                    </span>
                  </span>
                  <br />
                  <span className="text-gray-400">Unlock the Future</span>
                </h1>
                <p className="text-xl text-gray-300 max-w-lg animate-fade-in-up delay-700">
                  Join the RewardNFT ecosystem and experience exclusive rewards, referrals, quests, and our exciting mini-game.
                </p>
                <div className="flex flex-wrap gap-4 pt-4 animate-fade-in-up delay-1000">
                  {!connected ? (
                    <WalletConnectButton className="bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-500 hover:to-cyan-500 text-black font-bold text-lg px-8 hover:scale-105 transition-transform border-0" size="lg" />
                  ) : (
                    <Button asChild size="lg" className="bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-500 hover:to-cyan-500 text-black font-bold text-lg px-8 hover:scale-105 transition-transform border-0">
                      <Link href="/profile">View Profile</Link>
                    </Button>
                  )}
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-teal-500/30 text-teal-400 hover:bg-teal-600/10 text-lg px-8 hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/25"
                  >
                    <Link href="/mint">Mint NFT - $2.5</Link>
                  </Button>
                </div>

                {/* Stats - Updated with vibrant colors matching the image */}
                <div className="flex gap-8 pt-4 animate-fade-in-up delay-1200">
                  <div className="group">
                    <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-teal-300 via-cyan-400 to-teal-500 bg-clip-text text-transparent bg-400% animate-gradient-x group-hover:scale-110 transition-transform">
                      {statsLoading ? "..." : `${stats?.nftsMinted || 500}+`}
                    </div>
                    <div className="text-sm text-gray-400 uppercase tracking-wide">NFTs Minted</div>
                  </div>
                  <div className="group">
                    <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-yellow-300 via-orange-400 to-yellow-500 bg-clip-text text-transparent bg-400% animate-gradient-x group-hover:scale-110 transition-transform">
                      {statsLoading ? "..." : `${Math.floor((stats?.usdcEarned || 50000) / 1000)}K+`}
                    </div>
                    <div className="text-sm text-gray-400 uppercase tracking-wide">USDC Earned</div>
                  </div>
                  <div className="group">
                    <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-red-400 via-pink-500 to-red-600 bg-clip-text text-transparent bg-400% animate-gradient-x group-hover:scale-110 transition-transform">
                      {statsLoading ? "..." : `${stats?.activeUsers || 1000}+`}
                    </div>
                    <div className="text-sm text-gray-400 uppercase tracking-wide">Active Users</div>
                  </div>
                </div>
              </div>
            </SlideInLeft>

            <SlideInRight delay={0.4}>
              <div className="flex justify-end relative min-h-[500px] pr-8">
                {/* Clean NFT cards without background box */}
                <div className="relative group max-w-md w-full">
                  <img
                    src="/images/hero.png"
                    alt="NFT Collection"
                    className="w-full h-auto object-contain rounded-2xl group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>
            </SlideInRight>
          </div>
        </section>
      </FadeIn>

      {/* Features Section */}
      <section className="py-20 px-6 bg-black/40 backdrop-blur-sm relative">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/5 via-transparent to-cyan-900/5" />
        <div className="max-w-7xl mx-auto relative z-10">
          <SlideUp delay={0.2}>
            <h2 className="text-4xl font-bold text-white text-center mb-16">How It Works</h2>
          </SlideUp>

          <StaggerContainer staggerDelay={0.15}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <StaggerItem>
                <HoverCard className="bg-black/40 backdrop-blur-xl border border-gray-800/50 hover:border-teal-500/30 rounded-2xl p-6 h-full transition-all duration-300">
                  <div className="flex flex-col items-center text-center h-full">
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-full flex items-center justify-center mb-4 border border-teal-500/30">
                      <span className="text-teal-400 text-2xl font-bold">1</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Mint Your NFT</h3>
                    <p className="text-gray-300 flex-1">
                      Mint your exclusive Reward NFT using USDC on the Solana blockchain.
                    </p>
                    <Button asChild className="mt-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-black font-bold border-0">
                      <Link href="/mint">Mint Now</Link>
                    </Button>
                  </div>
                </HoverCard>
              </StaggerItem>

              <StaggerItem>
                <HoverCard className="bg-black/40 backdrop-blur-xl border border-gray-800/50 hover:border-cyan-500/30 rounded-2xl p-6 h-full transition-all duration-300">
                  <div className="flex flex-col items-center text-center h-full">
                    <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 rounded-full flex items-center justify-center mb-4 border border-cyan-500/30">
                      <span className="text-cyan-400 text-2xl font-bold">2</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Refer Friends</h3>
                    <p className="text-gray-300 flex-1">
                      Share your unique referral link and earn USDC for each friend who mints an NFT.
                    </p>
                    <Button asChild className="mt-4 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-black font-bold border-0">
                      <Link href="/referrals">Get Referral Link</Link>
                    </Button>
                  </div>
                </HoverCard>
              </StaggerItem>

              <StaggerItem>
                <HoverCard className="bg-black/40 backdrop-blur-xl border border-gray-800/50 hover:border-teal-500/30 rounded-2xl p-6 h-full transition-all duration-300">
                  <div className="flex flex-col items-center text-center h-full">
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-full flex items-center justify-center mb-4 border border-teal-500/30">
                      <span className="text-teal-400 text-2xl font-bold">3</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Complete Quests</h3>
                    <p className="text-gray-300 flex-1">
                      Earn additional XP by completing daily, weekly, and special quests.
                    </p>
                    <Button asChild className="mt-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-black font-bold border-0">
                      <Link href="/quests">View Quests</Link>
                    </Button>
                  </div>
                </HoverCard>
              </StaggerItem>
            </div>
          </StaggerContainer>
        </div>
      </section>

      {/* Stats Section */}
      <FadeIn delay={0.3}>
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 text-center hover:scale-105 transition-transform">
                <p className="text-4xl font-bold bg-gradient-to-r from-teal-300 via-cyan-400 to-teal-500 bg-clip-text text-transparent bg-400% animate-gradient-x">
                  {statsLoading ? "..." : `${stats?.nftsMinted || 500}+`}
                </p>
                <p className="text-white/70 mt-2">NFTs Minted</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 text-center hover:scale-105 transition-transform">
                <p className="text-4xl font-bold bg-gradient-to-r from-yellow-300 via-orange-400 to-yellow-500 bg-clip-text text-transparent bg-400% animate-gradient-x">
                  {statsLoading ? "..." : `${Math.floor((stats?.usdcEarned || 50000) / 1000)}K+`}
                </p>
                <p className="text-white/70 mt-2">USDC Earned</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 text-center hover:scale-105 transition-transform">
                <p className="text-4xl font-bold bg-gradient-to-r from-red-400 via-pink-500 to-red-600 bg-clip-text text-transparent bg-400% animate-gradient-x">
                  {statsLoading ? "..." : `${stats?.activeUsers || 1000}+`}
                </p>
                <p className="text-white/70 mt-2">Active Users</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 text-center hover:scale-105 transition-transform">
                <p className="text-4xl font-bold text-white">
                  {statsLoading ? "..." : `${stats?.totalReferrals || 250}+`}
                </p>
                <p className="text-white/70 mt-2">Referrals Made</p>
              </div>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* CTA Section */}
      <SlideUp delay={0.2}>
        <section className="py-20 px-6 bg-gradient-to-r from-[#FF5555]/20 to-[#00FFE0]/20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-6">Ready to Start Earning?</h2>
            <p className="text-xl text-white/80 mb-8">
              Join our community today and start earning USDC rewards through NFT minting, referrals, and quests.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button asChild size="lg" className="bg-white hover:bg-white/90 text-black text-lg px-8 hover:scale-105 transition-transform">
                <Link href={connected ? "/profile" : "/mint"}>{connected ? "View My Profile" : "Get Started"}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 text-lg px-8 hover:scale-105 transition-transform">
                <Link href="https://rewardnft.gitbook.io/rewardnft" target="_blank" rel="noopener noreferrer">
                  Learn More
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </SlideUp>
    </div>
  )
}
