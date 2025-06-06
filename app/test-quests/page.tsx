import { QuestTestComponent } from "@/components/quest-test-component"

export default function TestQuestsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Quest System Test</h1>
        <QuestTestComponent />
      </div>
    </div>
  )
}
