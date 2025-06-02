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
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 space-y-4">
      <h3 className="text-xl font-medium text-white">Share your referral link</h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <a
          href={`https://twitter.com/intent/tweet?text=${encodedMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#1DA1F2]/20 hover:bg-[#1DA1F2]/30 text-white rounded-lg p-3 flex items-center justify-center gap-2 transition-colors"
        >
          <Twitter size={18} />
          <span>Twitter</span>
        </a>

        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#4267B2]/20 hover:bg-[#4267B2]/30 text-white rounded-lg p-3 flex items-center justify-center gap-2 transition-colors"
        >
          <Facebook size={18} />
          <span>Facebook</span>
        </a>

        <a
          href={`mailto:?subject=Join me on RewardNFT&body=${encodedMessage}`}
          className="bg-gray-500/20 hover:bg-gray-500/30 text-white rounded-lg p-3 flex items-center justify-center gap-2 transition-colors"
        >
          <Mail size={18} />
          <span>Email</span>
        </a>

        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#0077B5]/20 hover:bg-[#0077B5]/30 text-white rounded-lg p-3 flex items-center justify-center gap-2 transition-colors"
        >
          <Linkedin size={18} />
          <span>LinkedIn</span>
        </a>

        <a
          href={`https://wa.me/?text=${encodedMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#25D366]/20 hover:bg-[#25D366]/30 text-white rounded-lg p-3 flex items-center justify-center gap-2 transition-colors"
        >
          <MessageCircle size={18} />
          <span>WhatsApp</span>
        </a>

        <button
          onClick={handleCopy}
          className="bg-gray-500/20 hover:bg-gray-500/30 text-white rounded-lg p-3 flex items-center justify-center gap-2 transition-colors"
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
          <span>{copied ? "Copied!" : "Copy Link"}</span>
        </button>
      </div>
    </div>
  )
}
