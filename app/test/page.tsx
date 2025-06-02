import { EnhancedEnvStatus } from "@/components/enhanced-env-status"
import { QuickNodeConfigDisplay } from "@/components/quicknode-config-display"
import { RPCPerformanceMonitor } from "@/components/rpc-performance-monitor"

export default function TestPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">System Status & Testing</h1>
        <p className="text-muted-foreground">Monitor environment configuration, RPC performance, and system health</p>
      </div>

      <div className="grid gap-8">
        <EnhancedEnvStatus />
        <QuickNodeConfigDisplay />
        <RPCPerformanceMonitor />
      </div>
    </div>
  )
}
