import type { VerificationResult } from "@/utils/nft-verification"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CheckCircle, AlertCircle, HelpCircle, ShieldAlert } from "lucide-react"

interface NftVerificationBadgeProps {
  verification: VerificationResult
  size?: "sm" | "md" | "lg"
  showTooltip?: boolean
}

export function NftVerificationBadge({ verification, size = "md", showTooltip = true }: NftVerificationBadgeProps) {
  const { status, message, details } = verification

  // Determine badge style based on verification status
  const getBadgeStyle = () => {
    switch (status) {
      case "verified":
        return "bg-green-500/20 text-green-500 hover:bg-green-500/30"
      case "suspicious":
        return "bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30"
      case "unverified":
        return "bg-red-500/20 text-red-500 hover:bg-red-500/30"
      case "pending":
      default:
        return "bg-blue-500/20 text-blue-500 hover:bg-blue-500/30"
    }
  }

  // Determine icon based on verification status
  const getIcon = () => {
    switch (status) {
      case "verified":
        return <CheckCircle className={size === "sm" ? "h-3 w-3 mr-1" : "h-4 w-4 mr-1.5"} />
      case "suspicious":
        return <ShieldAlert className={size === "sm" ? "h-3 w-3 mr-1" : "h-4 w-4 mr-1.5"} />
      case "unverified":
        return <AlertCircle className={size === "sm" ? "h-3 w-3 mr-1" : "h-4 w-4 mr-1.5"} />
      case "pending":
      default:
        return <HelpCircle className={size === "sm" ? "h-3 w-3 mr-1" : "h-4 w-4 mr-1.5"} />
    }
  }

  // Get text based on verification status
  const getText = () => {
    switch (status) {
      case "verified":
        return "Verified"
      case "suspicious":
        return "Suspicious"
      case "unverified":
        return "Unverified"
      case "pending":
      default:
        return "Pending"
    }
  }

  // Generate tooltip content with detailed verification info
  const getTooltipContent = () => {
    return (
      <div className="space-y-2 max-w-xs">
        <p className="font-medium">{message}</p>
        <div className="text-xs space-y-1">
          <p>✓ Name: {details.nameMatch ? "Verified" : "Unverified"}</p>
          <p>✓ Symbol: {details.symbolMatch ? "Verified" : "Unverified"}</p>
          <p>✓ Description: {details.descriptionMatch ? "Verified" : "Unverified"}</p>
          <p>✓ Image: {details.imageMatch ? "Verified" : "Unverified"}</p>
          <p>✓ Creator: {details.creatorMatch ? "Verified" : "Unverified"}</p>
          <p>✓ Collection: {details.collectionMatch ? "Verified" : "Unverified"}</p>
        </div>
      </div>
    )
  }

  const badge = (
    <Badge
      variant="outline"
      className={`flex items-center ${getBadgeStyle()} ${
        size === "sm" ? "text-xs py-0 px-1.5" : size === "lg" ? "text-sm py-1 px-3" : "text-xs py-0.5 px-2"
      }`}
    >
      {getIcon()}
      <span>{getText()}</span>
    </Badge>
  )

  if (!showTooltip) {
    return badge
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="top" align="center">
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
