"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { useWallet } from "@/contexts/wallet-context"
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

  return (
    <div className="min-h-screen flex flex-col">
      {/* <Header /> */}

      {/* Hero Section */}
      <FadeIn>
        <section className="relative pt-20 pb-32 px-6 flex-1 flex items-center">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-600/10 via-cyan-600/10 to-slate-600/10 z-0" />
          </div>

          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            <SlideInLeft delay={0.2}>
              <div className="space-y-8">
                <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                  <span className="text-white">Mint Your</span>{" "}
                  <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">NFT</span>
                  <br />
                  <span className="text-gray-300">Unlock the Future</span>
                </h1>
                <p className="text-xl text-gray-300 max-w-lg">
                  Join the RewardNFT ecosystem and experience exclusive rewards, referrals, quests, and our exciting mini-game.
                </p>
                <div className="flex flex-wrap gap-4 pt-4">
                  <Button asChild size="lg" className="gradient-button text-lg px-8">
                    <Link href="/mint">Connect Wallet</Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-teal-500/30 text-teal-400 hover:bg-teal-600/10 text-lg px-8"
                  >
                    <Link href="/mint">Mint NFT - $10</Link>
                  </Button>
                </div>

                {/* Stats - matching reference design */}
                <div className="flex gap-8 pt-4">
                  <div>
                    <div className="text-2xl md:text-3xl font-bold text-teal-400">500+</div>
                    <div className="text-sm text-gray-400 uppercase tracking-wide">NFTs Minted</div>
                  </div>
                  <div>
                    <div className="text-2xl md:text-3xl font-bold text-cyan-400">50K+</div>
                    <div className="text-sm text-gray-400 uppercase tracking-wide">USDC Earned</div>
                  </div>
                  <div>
                    <div className="text-2xl md:text-3xl font-bold text-teal-300">1000+</div>
                    <div className="text-sm text-gray-400 uppercase tracking-wide">Active Users</div>
                  </div>
                </div>
              </div>
            </SlideInLeft>

            <SlideInRight delay={0.4}>
              <div className="flex justify-end relative min-h-[500px] pr-8">
                {/* Autumn Card - Back Top */}
                  <img
                    src="/images/hero.png"
                    alt="Autumn Dreams"
                    className="w-full h-full object-cover"
                  />
</div>
                {/* Character Card - Front Left */}
            
            </SlideInRight>
          </div>
        </section>
      </FadeIn>

      {/* Features Section */}
      <section className="py-20 px-6 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <SlideUp delay={0.2}>
            <h2 className="text-4xl font-bold text-white text-center mb-16">How It Works</h2>
          </SlideUp>

          <StaggerContainer staggerDelay={0.15}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <StaggerItem>
                <HoverCard className="glass-card glass-card-hover p-6 h-full">
                  <div className="flex flex-col items-center text-center h-full">
                    <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mb-4">
                      <span className="text-purple-400 text-2xl font-bold">1</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Mint Your NFT</h3>
                    <p className="text-gray-300 flex-1">
                      Mint your exclusive Reward NFT using USDC on the Solana blockchain.
                    </p>
                    <Button asChild className="mt-4 bg-purple-600 hover:bg-purple-700 text-white">
                      <Link href="/mint">Mint Now</Link>
                    </Button>
                  </div>
                </HoverCard>
              </StaggerItem>

              <StaggerItem>
                <HoverCard className="glass-card glass-card-hover p-6 h-full">
                  <div className="flex flex-col items-center text-center h-full">
                    <div className="w-16 h-16 bg-violet-600/20 rounded-full flex items-center justify-center mb-4">
                      <span className="text-violet-400 text-2xl font-bold">2</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Refer Friends</h3>
                    <p className="text-gray-300 flex-1">
                      Share your unique referral link and earn USDC for each friend who mints an NFT.
                    </p>
                    <Button asChild className="mt-4 bg-violet-600 hover:bg-violet-700 text-white">
                      <Link href="/referrals">Get Referral Link</Link>
                    </Button>
                  </div>
                </HoverCard>
              </StaggerItem>

              <StaggerItem>
                <HoverCard className="glass-card glass-card-hover p-6 h-full">
                  <div className="flex flex-col items-center text-center h-full">
                    <div className="w-16 h-16 bg-indigo-600/20 rounded-full flex items-center justify-center mb-4">
                      <span className="text-indigo-400 text-2xl font-bold">3</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Complete Quests</h3>
                    <p className="text-gray-300 flex-1">
                      Earn additional USDC by completing daily, weekly, and special quests.
                    </p>
                    <Button asChild className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">
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
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 text-center">
                <p className="text-4xl font-bold text-[#00FFE0]">1,000+</p>
                <p className="text-white/70 mt-2">NFTs Minted</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 text-center">
                <p className="text-4xl font-bold text-[#FF5555]">5,000+</p>
                <p className="text-white/70 mt-2">USDC Earned</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 text-center">
                <p className="text-4xl font-bold text-[#FFC93C]">500+</p>
                <p className="text-white/70 mt-2">Active Users</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 text-center">
                <p className="text-4xl font-bold text-white">2,500+</p>
                <p className="text-white/70 mt-2">Quests Completed</p>
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
            <Button asChild size="lg" className="bg-white hover:bg-white/90 text-black text-lg px-8">
              <Link href={connected ? "/profile" : "/mint"}>{connected ? "View My Profile" : "Get Started"}</Link>
            </Button>
          </div>
        </section>
      </SlideUp>
    </div>
  )
}
