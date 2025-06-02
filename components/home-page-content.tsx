"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
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
  const [showVideo, setShowVideo] = useState(false)

  return (
    <div className="min-h-screen flex flex-col ">
      <Header transparent />

      {/* Hero Section */}
      <FadeIn>
        <section className="relative pt-20 pb-32 px-6 flex-1 flex items-center">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF5555]/20 via-[#00FFE0]/20 to-[#FFC93C]/20 z-0" />
          </div>

          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            <SlideInLeft delay={0.2}>
              <div className="space-y-6">
                <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
                  Mint, Refer, <span className="text-[#00FFE0]">Earn</span>
                </h1>
                <p className="text-xl text-white/80 max-w-lg">
                  Join our exclusive NFT platform on Solana. Mint your NFT, refer friends, complete quests, and earn
                  USDC rewards.
                </p>
                <div className="flex flex-wrap gap-4 pt-4">
                  <Button asChild size="lg" className="bg-[#00FFE0] hover:bg-[#00FFE0]/90 text-black text-lg px-8">
                    <Link href="/mint">Mint NFT</Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-white/30 text-black hover:bg-white/10 text-lg px-8"
                  >
                    <Link href="/referrals">Earn Rewards</Link>
                  </Button>
                </div>
              </div>
            </SlideInLeft>

            <SlideInRight delay={0.4}>
              <div className="flex justify-center">
                <div className="relative w-72 md:w-96 aspect-square rounded-3xl border border-white/20 bg-white/10 backdrop-blur-sm p-6 rotate-3 hover:rotate-0 transition-transform duration-500">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Image
                      src="/images/mint-nft-box.png"
                      alt="NFT Preview"
                      width={300}
                      height={300}
                      className="object-contain"
                    />
                  </div>
                  <div className="absolute bottom-6 left-6 right-6 bg-black/40 backdrop-blur-md rounded-xl p-4 text-center">
                    <p className="text-white font-semibold">Exclusive Identity NFT</p>
                    <p className="text-white/80 text-sm">Mint Price: 10 USDC</p>
                  </div>
                </div>
              </div>
            </SlideInRight>
          </div>
        </section>
      </FadeIn>

      {/* Features Section */}
      <section className="py-20 px-6 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <SlideUp delay={0.2}>
            <h2 className="text-4xl font-bold text-white text-center mb-16">How It Works</h2>
          </SlideUp>

          <StaggerContainer staggerDelay={0.15}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <StaggerItem>
                <HoverCard className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 h-full">
                  <div className="flex flex-col items-center text-center h-full">
                    <div className="w-16 h-16 bg-[#FF5555]/20 rounded-full flex items-center justify-center mb-4">
                      <span className="text-[#FF5555] text-2xl font-bold">1</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Mint Your NFT</h3>
                    <p className="text-white/70 flex-1">
                      Mint your exclusive Reward NFT using USDC on the Solana blockchain.
                    </p>
                    <Button asChild className="mt-4 bg-[#FF5555] hover:bg-[#FF5555]/80 text-white">
                      <Link href="/mint">Mint Now</Link>
                    </Button>
                  </div>
                </HoverCard>
              </StaggerItem>

              <StaggerItem>
                <HoverCard className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 h-full">
                  <div className="flex flex-col items-center text-center h-full">
                    <div className="w-16 h-16 bg-[#00FFE0]/20 rounded-full flex items-center justify-center mb-4">
                      <span className="text-[#00FFE0] text-2xl font-bold">2</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Refer Friends</h3>
                    <p className="text-white/70 flex-1">
                      Share your unique referral link and earn USDC for each friend who mints an NFT.
                    </p>
                    <Button asChild className="mt-4 bg-[#00FFE0] hover:bg-[#00FFE0]/80 text-black">
                      <Link href="/referrals">Get Referral Link</Link>
                    </Button>
                  </div>
                </HoverCard>
              </StaggerItem>

              <StaggerItem>
                <HoverCard className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 h-full">
                  <div className="flex flex-col items-center text-center h-full">
                    <div className="w-16 h-16 bg-[#FFC93C]/20 rounded-full flex items-center justify-center mb-4">
                      <span className="text-[#FFC93C] text-2xl font-bold">3</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Complete Quests</h3>
                    <p className="text-white/70 flex-1">
                      Earn additional USDC by completing daily, weekly, and special quests.
                    </p>
                    <Button asChild className="mt-4 bg-[#FFC93C] hover:bg-[#FFC93C]/80 text-black">
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
