"use client"
import { Twitter, Facebook, Mail, Linkedin, MessageCircle, Copy, Check } from "lucide-react"
import { useState } from "react"

interface SocialShareProps {
  referralLink: string
  message?: string
}

export function SocialShare({ referralLink, message = "Join me on RewardNFT and earn rewards!" }: SocialShareProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const encodedMessage = encodeURIComponent(`${message} ${referralLink}`)

  return (
  <>
  </>
  )
}
