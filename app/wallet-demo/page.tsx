import { WalletIntegrationDemo } from "@/components/wallet-integration-demo"

export default function WalletDemoPage() {
  return (
    <div className="container mx-auto py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Solana Web3.js Wallet Integration</h1>
      <WalletIntegrationDemo />
    </div>
  )
}
