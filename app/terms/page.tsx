import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms & Conditions - RewardNFT",
  description: "Terms and conditions for using the RewardNFT platform",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-teal-400 to-green-400 bg-clip-text text-transparent">
          RewardNFT Terms and Conditions
        </h1>
        
        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p>
              Welcome to RewardNFT. By using our platform, you agree to these terms and conditions. 
              If you do not agree, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Eligibility</h2>
            <p>
              You must be at least 18 years old to use our platform. By using RewardNFT, 
              you confirm that you meet this requirement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. NFT Minting</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Users can mint an NFT on our platform for $10.</li>
              <li>Once an NFT is minted, users unlock access to the referral system, quests, mini-games, and airdrops.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Referral System</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>For each referral who mints an NFT, the referrer earns a $4 commission.</li>
              <li>Commissions are credited to the user's Phantom wallet on the Solana chain.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Quests and Rewards</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Users can participate in quests and mini-games to earn additional rewards.</li>
              <li>Rewards may vary and are subject to the platform's discretion.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. User Responsibilities</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Users are responsible for maintaining the security of their wallet and account information.</li>
              <li>Any activities conducted through their account are their responsibility.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. No Guarantees or Warranties</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>RewardNFT provides its services on an "as is" basis and does not guarantee specific earnings or outcomes.</li>
              <li>The platform is not responsible for any losses incurred by users.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Platform Changes</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>RewardNFT reserves the right to modify or discontinue any part of the platform at any time without prior notice.</li>
              <li>Users will be notified of significant changes where possible.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Termination</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>RewardNFT may suspend or terminate accounts that violate these terms or engage in fraudulent activities.</li>
              <li>Users may terminate their account at any time.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Intellectual Property</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>All content on the platform, including logos, graphics, and text, is the property of RewardNFT and protected by intellectual property laws.</li>
              <li>Users may not use this content without prior written consent.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Liability Limitations</h2>
            <p>
              RewardNFT is not liable for any indirect, incidental, or consequential damages 
              arising from the use of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">12. Governing Law</h2>
            <p>
              These terms and conditions are governed by and construed in accordance with the laws 
              of the jurisdiction in which RewardNFT operates.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">13. Changes to Terms</h2>
            <p>
              RewardNFT reserves the right to update these terms at any time. Continued use of the 
              platform constitutes acceptance of the updated terms.
            </p>
          </section>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  )
}
