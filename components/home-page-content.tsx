"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { useWallet } from "@/contexts/wallet-context"
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { usePlatformStats } from "@/hooks/use-platform-stats"
import { motion } from "framer-motion"
import Image from "next/image"
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
    <div className="min-h-screen flex flex-col bg-[#020203]">
      {/* Hero Section */}
      <FadeIn>
        <section className="relative min-h-screen flex items-center px-6 lg:px-16 pt-24 pb-16 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0">
            <div className="absolute top-1/3 left-1/4 w-[800px] h-[800px] bg-teal-500/10 rounded-full blur-[150px]" />
            <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px]" />
          </div>

          <div className="max-w-[1400px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
            
            {/* Left Content - MASSIVE TEXT like reference */}
            <SlideInLeft delay={0.2}>
              <div className="space-y-10">
                
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-medium">
                  <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></span>
                  Built with &lt;3 on Solana
                </div>

                {/* Main Heading - EXTREMELY MASSIVE */}
                <h1 className="font-black leading-[0.9] tracking-tight">
                  <span className="block text-[50px] md:text-[70px] lg:text-[90px] xl:text-[110px] text-white mb-2">
                    Mint Your
                  </span>
                  
                  {/* Gradient Badge Style NFT Text */}
                  <span className="inline-block relative">
                    <span className="block text-[50px] md:text-[70px] lg:text-[90px] xl:text-[110px] bg-gradient-to-r from-purple-500 via-cyan-400 to-teal-400 bg-clip-text text-transparent px-4 py-2 rounded-2xl">
                      NFT
                    </span>
                  </span>
                  
                  {/* Unlock the Future - Theme Color (Teal/Cyan) */}
                  <span className="block text-[40px] md:text-[55px] lg:text-[70px] xl:text-[85px] text-teal-400 mt-4">
                    Unlock the
                  </span>
                  <span className="block text-[40px] md:text-[55px] lg:text-[70px] xl:text-[85px] text-teal-400">
                    Future
                  </span>
                </h1>

                {/* Subtext - White with Teal RewardNFT */}
                <p className="text-xl md:text-2xl text-white max-w-2xl leading-relaxed font-medium">
                  Join the <span className="text-teal-400 font-bold">RewardNFT</span> ecosystem and experience exclusive rewards, referrals, quests, and our exciting mini-game.
                </p>

                {/* Buttons - Animated & Colorful */}
                <div className="flex flex-wrap gap-6 pt-6">
                  {!connected ? (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <WalletConnectButton 
                        className="bg-teal-400 hover:bg-teal-500 text-black font-black text-xl px-12 py-6 h-auto rounded-2xl transition-all shadow-[0_0_30px_rgba(45,212,191,0.3)] hover:shadow-[0_0_50px_rgba(45,212,191,0.5)]" 
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        asChild 
                        className="bg-teal-400 hover:bg-teal-500 text-black font-black text-xl px-12 py-6 h-auto rounded-2xl transition-all shadow-[0_0_30px_rgba(45,212,191,0.3)] hover:shadow-[0_0_50px_rgba(45,212,191,0.5)]"
                      >
                        <Link href="/profile">View Profile</Link>
                      </Button>
                    </motion.div>
                  )}
                  
                  {/* Animated Mint NFT Button */}
                  <motion.div
                    whileHover={{ scale: 1.08, rotate: 1 }}
                    whileTap={{ scale: 0.95 }}
                    animate={{ 
                      boxShadow: [
                        "0 0 20px rgba(168, 85, 247, 0.4)",
                        "0 0 40px rgba(168, 85, 247, 0.6)",
                        "0 0 20px rgba(168, 85, 247, 0.4)"
                      ]
                    }}
                    transition={{ 
                      boxShadow: {
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }
                    }}
                  >
                    <Button
                      asChild
                      className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 hover:from-purple-500 hover:via-pink-400 hover:to-orange-400 text-white font-black text-xl px-12 py-6 h-auto rounded-2xl transition-all border-0"
                    >
                      <Link href="/mint" className="relative z-10 flex items-center gap-3">
                        <motion.span
                          animate={{ rotate: [0, 15, -15, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                        >
                          ✨
                        </motion.span>
                        Mint NFT - $2.5
                        <motion.span
                          animate={{ rotate: [0, -15, 15, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3, delay: 0.25 }}
                        >
                          ✨
                        </motion.span>
                      </Link>
                    </Button>
                    {/* Shimmer Effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
                      animate={{ x: ["-200%", "200%"] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </motion.div>
                </div>

                {/* Stats - MASSIVE NUMBERS */}
                <div className="flex gap-16 pt-10">
                  <div className="group">
                    <div className="text-6xl md:text-7xl lg:text-8xl font-black text-teal-400 mb-2 group-hover:scale-110 transition-transform">
                      {statsLoading ? "..." : `${stats?.nftsMinted || 500}+`}
                    </div>
                    <div className="text-lg text-gray-500 uppercase tracking-widest font-bold">NFTs Minted</div>
                  </div>
                  <div className="group">
                    <div className="text-6xl md:text-7xl lg:text-8xl font-black text-orange-400 mb-2 group-hover:scale-110 transition-transform">
                      {statsLoading ? "..." : `${Math.floor((stats?.usdcEarned || 50000) / 1000)}K+`}
                    </div>
                    <div className="text-lg text-gray-500 uppercase tracking-widest font-bold">USDC Earned</div>
                  </div>
                </div>
              </div>
            </SlideInLeft>

            {/* Right Content - Animated Floating Cards with Correct Image */}
            <SlideInRight delay={0.4}>
              <div className="flex justify-center lg:justify-end relative h-[700px]">
                {/* Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-teal-500/20 to-cyan-500/20 rounded-full blur-[120px]" />
                
                <div className="relative w-full max-w-xl h-full">
                  
                  {/* Back Card */}
                  <motion.div 
                    className="absolute top-0 right-0 w-64 h-80 rounded-3xl overflow-hidden shadow-2xl"
                    animate={{ y: [0, -30, 0], rotate: [0, 8, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Image 
                      src="/images/NFT-character.jpeg" 
                      alt="NFT Character" 
                      fill
                      className="object-cover"
                      priority
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </motion.div>

                  {/* Middle Card */}
                  <motion.div 
                    className="absolute top-24 left-0 w-72 h-96 rounded-3xl overflow-hidden shadow-2xl z-10"
                    animate={{ y: [0, -20, 0], rotate: [0, -5, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  >
                    <Image 
                      src="/images/NFT-character.jpeg" 
                      alt="NFT Character" 
                      fill
                      className="object-cover"
                      priority
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </motion.div>

                  {/* Front Card */}
                  <motion.div 
                    className="absolute bottom-0 right-12 w-80 h-[420px] rounded-3xl overflow-hidden shadow-2xl z-20 border-4 border-teal-500/30"
                    animate={{ y: [0, -35, 0], rotate: [0, 5, 0], scale: [1, 1.03, 1] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  >
                    <Image 
                      src="/images/NFT-character.jpeg" 
                      alt="NFT Character" 
                      fill
                      className="object-cover"
                      priority
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="bg-black/60 backdrop-blur-md rounded-xl px-4 py-3 text-center">
                        <p className="text-white font-bold text-lg">Reward NFT</p>
                        <p className="text-teal-400 text-sm">Genesis Collection</p>
                      </div>
                    </div>
                  </motion.div>

                </div>
              </div>
            </SlideInRight>
          </div>
        </section>
      </FadeIn>

      {/* How It Works */}
      <section className="py-32 px-6 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <SlideUp delay={0.2}>
            <h2 className="text-7xl md:text-8xl lg:text-9xl font-black text-white text-center mb-24">
              How It <span className="text-teal-400">Works</span>
            </h2>
          </SlideUp>

          <StaggerContainer staggerDelay={0.15}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[1, 2, 3].map((num, idx) => (
                <StaggerItem key={idx}>
                  <HoverCard className="bg-gray-900/20 backdrop-blur border border-gray-800 hover:border-teal-500/50 rounded-3xl p-10 h-full transition-all duration-300 group">
                    <div className="flex flex-col items-center text-center h-full">
                      <div className="w-24 h-24 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mb-8 border-2 border-teal-500/30 group-hover:scale-110 transition-transform">
                        <span className="text-teal-400 text-4xl font-black">{num}</span>
                      </div>
                      <h3 className="text-3xl font-black text-white mb-6">
                        {num === 1 ? "Mint Your NFT" : num === 2 ? "Refer Friends" : "Complete Quests"}
                      </h3>
                      <p className="text-xl text-gray-400 flex-1 leading-relaxed mb-8">
                        {num === 1 ? "Mint your exclusive Reward NFT using USDC on the Solana blockchain." : 
                         num === 2 ? "Share your unique referral link and earn USDC for each friend who mints an NFT." : 
                         "Earn additional XP by completing daily, weekly, and special quests."}
                      </p>
                      <Button asChild className="bg-teal-500 hover:bg-teal-600 text-black font-black text-lg px-10 py-5 h-auto rounded-xl">
                        <Link href={num === 1 ? "/mint" : num === 2 ? "/referrals" : "/quests"}>
                          {num === 1 ? "Mint Now" : num === 2 ? "Get Referral Link" : "View Quests"}
                        </Link>
                      </Button>
                    </div>
                  </HoverCard>
                </StaggerItem>
              ))}
            </div>
          </StaggerContainer>
        </div>
      </section>

      {/* Stats Section */}
      <FadeIn delay={0.3}>
        <section className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: `${stats?.nftsMinted || 500}+`, label: "NFTs Minted", color: "text-teal-400" },
                { value: `${Math.floor((stats?.usdcEarned || 50000) / 1000)}K+`, label: "USDC Earned", color: "text-orange-400" },
                { value: `${stats?.activeUsers || 1000}+`, label: "Active Users", color: "text-pink-400" },
                { value: `${stats?.totalReferrals || 250}+`, label: "Referrals", color: "text-white" },
              ].map((stat, idx) => (
                <div key={idx} className="bg-gray-900/20 backdrop-blur border border-gray-800 rounded-3xl p-10 text-center hover:scale-105 transition-transform group">
                  <p className={`text-6xl md:text-7xl font-black ${stat.color} mb-3 group-hover:scale-110 transition-transform`}>
                    {statsLoading ? "..." : stat.value}
                  </p>
                  <p className="text-gray-500 text-lg uppercase tracking-widest font-bold">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* CTA Section */}
      <SlideUp delay={0.2}>
        <section className="py-32 px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-600/20 via-cyan-600/20 to-purple-600/20" />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-7xl md:text-8xl lg:text-9xl font-black text-white mb-8">
              Ready to <span className="text-teal-400">Earn?</span>
            </h2>
            <p className="text-2xl text-gray-400 mb-12 max-w-2xl mx-auto">
              Join our community today and start earning USDC rewards through NFT minting, referrals, and quests.
            </p>
            <div className="flex flex-wrap gap-6 justify-center">
              <Button 
                asChild 
                className="bg-white hover:bg-gray-100 text-black font-black text-xl px-12 py-6 h-auto rounded-2xl hover:scale-105 transition-transform"
              >
                <Link href={connected ? "/profile" : "/mint"}>
                  {connected ? "View Profile" : "Get Started"}
                </Link>
              </Button>
              <Button 
                asChild 
                variant="outline" 
                className="border-2 border-gray-700 text-white hover:bg-white/5 text-xl px-12 py-6 h-auto rounded-2xl hover:scale-105 transition-transform hover:border-teal-500/50"
              >
                <Link href="https://rewardnft.gitbook.io/rewardnft " target="_blank" rel="noopener noreferrer">
                  Documentation
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </SlideUp>
    </div>
  )
}
