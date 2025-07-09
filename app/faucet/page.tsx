import { DevnetFaucet } from "@/components/devnet-faucet"

export default function FaucetPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Devnet Faucet</h1>
          <p className="text-gray-600">Get free SOL and USDC tokens for testing NFT minting on Solana Devnet</p>
        </div>

        <DevnetFaucet />
      </div>
    </div>
  )
}
