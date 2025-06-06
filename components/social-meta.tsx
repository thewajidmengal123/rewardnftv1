export function SocialMeta() {
  return (
    <>
      {/* Social Media Links */}
      <link rel="me" href="https://x.com/RewardNFT_" />
      <link rel="me" href="https://t.me/rewardsNFT" />
      <link rel="me" href="https://www.linkedin.com/company/rewardnft" />
      <link rel="me" href="https://discord.gg/fZ7SDHeAtr" />
      
      {/* Additional Meta Tags */}
      <meta name="application-name" content="RewardNFT" />
      <meta name="theme-color" content="#000000" />
      <meta name="msapplication-TileColor" content="#000000" />
      
      {/* Social Verification */}
      <meta name="twitter:site" content="@RewardNFT_" />
      <meta name="twitter:creator" content="@RewardNFT_" />
      
      {/* Additional OpenGraph */}
      <meta property="og:site_name" content="RewardNFT" />
      <meta property="og:type" content="website" />
      
      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "RewardNFT",
            "description": "Mint NFTs, earn rewards, and build your network on Solana",
            "url": "https://rewardnft.com",
            "applicationCategory": "GameApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "10",
              "priceCurrency": "USD",
              "description": "NFT Minting"
            },
            "sameAs": [
              "https://x.com/RewardNFT_",
              "https://t.me/rewardsNFT",
              "https://www.linkedin.com/company/rewardnft",
              "https://discord.gg/fZ7SDHeAtr",
              "https://rewardnft.gitbook.io/rewardnft"
            ]
          })
        }}
      />
    </>
  )
}
