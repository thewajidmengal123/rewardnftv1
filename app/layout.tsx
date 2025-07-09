import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { WalletProvider } from "@/contexts/wallet-context"
import { Toaster } from "@/components/ui/toaster"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ThemeProvider } from "@/components/theme-provider"
import { SocialMeta } from "@/components/social-meta"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Reward NFT Platform",
  description: "Mint NFTs, earn rewards, and build your network on Solana",
  generator: 'v0.dev',
  keywords: "NFT, Solana, Rewards, Referrals, Blockchain",
  authors: [{ name: "Reward NFT Team" }],
  creator: "Reward NFT Platform",
  publisher: "Reward NFT Platform",
  robots: "index, follow",
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#5bbad5' }
    ]
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: "RewardNFT Platform",
    description: "Mint NFTs, earn rewards, and build your network on Solana",
    type: "website",
    locale: "en_US",
    siteName: "RewardNFT",
  },
  twitter: {
    card: "summary_large_image",
    title: "RewardNFT Platform",
    description: "Mint NFTs, earn rewards, and build your network on Solana",
    site: "@RewardNFT_",
    creator: "@RewardNFT_",
  },
  verification: {
    other: {
      "wallet-verification": "reward-nft-platform"
    }
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <SocialMeta />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <WalletProvider>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <Toaster />
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
