import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RPCStatusIndicator } from "./rpc-status-indicator"
import { QuickNodeConfigDisplay } from "./quicknode-config-display"

const EnvStatus = () => {
  const envVars = [
    { name: "NEXT_PUBLIC_APP_NAME", value: process.env.NEXT_PUBLIC_APP_NAME },
    { name: "VERCEL_ENV", value: process.env.VERCEL_ENV },
    { name: "NEXT_PUBLIC_ALCHEMY_ID", value: process.env.NEXT_PUBLIC_ALCHEMY_ID },
    { name: "NEXT_PUBLIC_INFURA_ID", value: process.env.NEXT_PUBLIC_INFURA_ID },
    { name: "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID", value: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID },
  ]

  return (
    <div className="space-y-4">
      <QuickNodeConfigDisplay />

      <Card>
        <CardHeader>
          <CardTitle>RPC Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          <RPCStatusIndicator />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
          <CardDescription>Status of key environment variables.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {envVars.map((envVar) => (
            <div key={envVar.name} className="space-y-1">
              <div className="flex items-center justify-between font-medium">
                <span>{envVar.name}</span>
                {envVar.value ? <Badge variant="secondary">Set</Badge> : <Badge variant="destructive">Not Set</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{envVar.value || "Not defined"}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export default EnvStatus
