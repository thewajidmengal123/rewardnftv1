"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  AlertTriangle, 
  XCircle, 
  Wifi, 
  DollarSign, 
  Clock, 
  RefreshCw,
  ExternalLink,
  Copy,
  CheckCircle
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface ProfessionalErrorModalProps {
  isOpen: boolean
  onClose: () => void
  error: string
  title?: string
  onRetry?: () => void
  showRetryButton?: boolean
  showSupportButton?: boolean
}

export function ProfessionalErrorModal({
  isOpen,
  onClose,
  error,
  title = "Transaction Error",
  onRetry,
  showRetryButton = true,
  showSupportButton = true,
}: ProfessionalErrorModalProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  // Parse error message to extract structured information
  const parseError = (errorMessage: string) => {
    const lines = errorMessage.split('\n').filter(line => line.trim())
    const mainTitle = lines[0] || "Error Occurred"
    const sections: { [key: string]: string[] } = {}
    let currentSection = "description"
    
    sections[currentSection] = []
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line.startsWith('📊') || line.startsWith('🔍') || line.startsWith('💡') || line.startsWith('⚠️')) {
        const sectionName = line.split(' ')[1] || 'info'
        currentSection = sectionName.toLowerCase()
        sections[currentSection] = []
        sections[currentSection].push(line)
      } else if (line.startsWith('•') || line.startsWith('-') || line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.')) {
        sections[currentSection] = sections[currentSection] || []
        sections[currentSection].push(line)
      } else if (line) {
        sections[currentSection] = sections[currentSection] || []
        sections[currentSection].push(line)
      }
    }
    
    return { mainTitle, sections }
  }

  const { mainTitle, sections } = parseError(error)

  // Determine error type and icon
  const getErrorIcon = () => {
    const errorLower = error.toLowerCase()
    if (errorLower.includes('insufficient') || errorLower.includes('balance')) {
      return <DollarSign className="h-6 w-6 text-yellow-500" />
    } else if (errorLower.includes('network') || errorLower.includes('connection')) {
      return <Wifi className="h-6 w-6 text-blue-500" />
    } else if (errorLower.includes('timeout') || errorLower.includes('slow')) {
      return <Clock className="h-6 w-6 text-orange-500" />
    } else if (errorLower.includes('cancelled') || errorLower.includes('rejected')) {
      return <XCircle className="h-6 w-6 text-gray-500" />
    } else {
      return <AlertTriangle className="h-6 w-6 text-red-500" />
    }
  }

  // Get error severity
  const getErrorSeverity = () => {
    const errorLower = error.toLowerCase()
    if (errorLower.includes('insufficient') || errorLower.includes('not found')) {
      return 'warning'
    } else if (errorLower.includes('cancelled') || errorLower.includes('rejected')) {
      return 'info'
    } else {
      return 'error'
    }
  }

  const severity = getErrorSeverity()

  const copyErrorDetails = () => {
    navigator.clipboard.writeText(error)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({
      title: "Error Details Copied",
      description: "Error details have been copied to your clipboard",
    })
  }

  const openSupport = () => {
    // You can customize this to open your support system
    window.open("mailto:support@rewardnft.com?subject=NFT Minting Error&body=" + encodeURIComponent(error), "_blank")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getErrorIcon()}
            <div>
              <DialogTitle className="text-xl font-semibold">
                {title}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                {mainTitle}
              </DialogDescription>
            </div>
            <Badge 
              variant={severity === 'error' ? 'destructive' : severity === 'warning' ? 'secondary' : 'outline'}
              className="ml-auto"
            >
              {severity.toUpperCase()}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Error Details */}
          {Object.entries(sections).map(([sectionKey, sectionLines]) => (
            <Card key={sectionKey} className="border-l-4 border-l-gray-300">
              <CardContent className="pt-4">
                {sectionLines.map((line, index) => (
                  <div key={index} className="mb-2">
                    {line.startsWith('•') || line.startsWith('-') ? (
                      <div className="flex items-start gap-2 text-sm">
                        <span className="text-gray-400 mt-1">•</span>
                        <span>{line.substring(1).trim()}</span>
                      </div>
                    ) : line.match(/^\d+\./) ? (
                      <div className="flex items-start gap-2 text-sm font-medium">
                        <span className="text-blue-500">{line.match(/^\d+\./)?.[0]}</span>
                        <span>{line.replace(/^\d+\.\s*/, '')}</span>
                      </div>
                    ) : (
                      <p className={`text-sm ${line.includes('💡') ? 'font-medium text-blue-700' : line.includes('🔍') ? 'font-medium text-gray-700' : ''}`}>
                        {line}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {showRetryButton && onRetry && (
              <Button 
                onClick={onRetry} 
                className="flex items-center gap-2"
                variant="default"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            )}
            
            <Button 
              onClick={copyErrorDetails} 
              variant="outline"
              className="flex items-center gap-2"
            >
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Details
                </>
              )}
            </Button>

            {showSupportButton && (
              <Button 
                onClick={openSupport} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Contact Support
              </Button>
            )}

            <Button 
              onClick={onClose} 
              variant="secondary"
              className="ml-auto"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
