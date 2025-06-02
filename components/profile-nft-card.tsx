import Image from "next/image"
import { Badge } from "@/components/ui/badge"

interface NFT {
  id?: number
  name: string
  image: string
  rarity: string
  acquired?: string
}

interface ProfileNFTCardProps {
  nft?: NFT
  name?: string
  image?: string
  rarity?: string
  acquired?: string
}

export function ProfileNFTCard(props: ProfileNFTCardProps) {
  // Handle both individual props and nft object
  const name = props.name || props.nft?.name || "Unnamed NFT"
  const image = props.image || props.nft?.image || "/placeholder.svg"
  const rarity = props.rarity || props.nft?.rarity || "Common"
  const acquired = props.acquired || props.nft?.acquired

  return (
    <div className="bg-white/10 rounded-xl overflow-hidden border border-white/20 hover:border-white/40 transition-colors">
      <div className="aspect-square relative">
        <Image src={image || "/placeholder.svg"} alt={name} fill className="object-cover" />
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-white">{name}</h3>
          <Badge
            className={`
              ${rarity === "Rare" ? "bg-purple-500/30 text-purple-200" : ""}
              ${rarity === "Common" ? "bg-blue-500/30 text-blue-200" : ""}
              ${rarity === "Legendary" ? "bg-yellow-500/30 text-yellow-200" : ""}
            `}
          >
            {rarity}
          </Badge>
        </div>
        {acquired && (
          <p className="text-white/60 text-sm">
            Acquired: {typeof acquired === "string" ? acquired : new Date(acquired).toLocaleDateString()}
          </p>
        )}
        <div className="flex justify-between items-center mt-4">
          <button className="text-white/80 hover:text-white text-sm underline">View Details</button>
          <button className="text-white/80 hover:text-white text-sm underline">Transfer</button>
        </div>
      </div>
    </div>
  )
}
